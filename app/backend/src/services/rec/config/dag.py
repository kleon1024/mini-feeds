from typing import Dict, List, Any, Optional, Union, Callable, Type
import json
import os
from pathlib import Path
import importlib
import logging
import time

from src.core.logger import logger
from src.services.rec.trace import TraceInfo

class Node:
    """推荐系统DAG节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        self.node_id = node_id
        self.config = config
        self.inputs = {}
        self.output = None
        self._validate_config()
    
    def _validate_config(self):
        """验证节点配置"""
        pass
    
    async def process(self, data: Any, context: Dict[str, Any]) -> Any:
        """处理节点逻辑"""
        raise NotImplementedError("子类必须实现process方法")

class DAG:
    """推荐系统DAG定义"""
    
    def __init__(self, dag_id: str, config_path: str):
        self.dag_id = dag_id
        self.config_path = config_path
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, List[str]] = {}
        self.entry_nodes: List[str] = []
        self.node_configs: Dict[str, Dict[str, Any]] = {}
        self._load_config()
        self._build_nodes()
    
    def _load_config(self):
        """加载DAG配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                
            self.dag_config = config.get('dag', {})
            self.node_configs = config.get('nodes', {})
            self.edges = config.get('edges', {})
            self.entry_nodes = config.get('entry_nodes', [])
            
            # 验证配置
            if not self.entry_nodes:
                raise ValueError(f"DAG {self.dag_id} 没有定义入口节点")
                
            # 检查节点配置是否存在
            for node_id in self.node_configs.keys():
                if node_id not in self.edges and node_id not in self.entry_nodes:
                    logger.warning(f"节点 {node_id} 在DAG中未连接")
            
            # 检查边的有效性
            for src, targets in self.edges.items():
                if src not in self.node_configs:
                    raise ValueError(f"边的源节点 {src} 不存在")
                for target in targets:
                    if target not in self.node_configs:
                        raise ValueError(f"边的目标节点 {target} 不存在")
        
        except Exception as e:
            logger.error(f"加载DAG配置失败: {str(e)}")
            raise
    
    def _build_nodes(self):
        """构建DAG节点"""
        for node_id, node_config in self.node_configs.items():
            try:
                node_type = node_config.get('type')
                if not node_type:
                    raise ValueError(f"节点 {node_id} 未指定类型")
                
                # 动态导入节点类
                module_path, class_name = node_type.rsplit('.', 1)
                module = importlib.import_module(module_path)
                node_class = getattr(module, class_name)
                
                # 创建节点实例
                node = node_class(node_id, node_config)
                self.nodes[node_id] = node
                
            except Exception as e:
                logger.error(f"构建节点 {node_id} 失败: {str(e)}")
                raise
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行DAG流程"""
        # 获取或创建trace信息
        trace = context.get('trace')
        if not trace:
            trace = TraceInfo()
            context['trace'] = trace
        
        # 设置用户ID
        user_id = context.get('user_id')
        if user_id:
            trace.set_user_id(user_id)
        
        results = {}
        visited = set()
        
        try:
            # 从入口节点开始执行
            for entry_node in self.entry_nodes:
                await self._execute_node(entry_node, context, results, visited)
            
            # 标记trace完成
            trace.complete("success")
        except Exception as e:
            # 标记trace失败
            trace.complete("error")
            raise
        
        return results
    
    async def _execute_node(self, node_id: str, context: Dict[str, Any], 
                           results: Dict[str, Any], visited: set):
        """递归执行节点"""
        # 检查节点是否已执行
        if node_id in visited:
            return
        
        # 获取节点
        node = self.nodes.get(node_id)
        if not node:
            raise ValueError(f"节点 {node_id} 不存在")
        
        # 获取trace信息
        trace = context.get('trace')
        
        # 检查依赖节点是否已执行
        dependencies_met = True
        for src, targets in self.edges.items():
            if node_id in targets and src not in visited:
                dependencies_met = False
                # 先执行依赖节点
                await self._execute_node(src, context, results, visited)
        
        # 收集输入
        node.inputs = {}
        for src, targets in self.edges.items():
            if node_id in targets and src in results:
                node.inputs[src] = results[src]
        
        # 执行节点
        try:
            start_time = time.time()
            node_context = {
                **context,
                'dag_id': self.dag_id,
                'node_id': node_id,
                'inputs': node.inputs
            }
            
            # 记录节点开始执行
            if trace:
                trace.start_node(node_id, node.__class__.__name__)
                if isinstance(node.inputs, dict):
                    for src, input_data in node.inputs.items():
                        if isinstance(input_data, list):
                            trace.add_node_detail(node_id, f"input_{src}_count", len(input_data))
            
            # 执行节点
            # 获取输入数据
            input_data = None
            if node.inputs:
                # 如果有多个输入，使用第一个输入作为数据
                input_data = next(iter(node.inputs.values()))
            
            # 执行节点处理
            output = await node.process(input_data, node_context)
            results[node_id] = output
            node.output = output
            
            # 记录节点执行结果
            end_time = time.time()
            duration_ms = int((end_time - start_time) * 1000)
            logger.debug(f"节点 {node_id} 执行完成，耗时: {duration_ms}ms")
            
            if trace:
                output_count = len(output) if isinstance(output, list) else 0
                trace.end_node(node_id, "success", output_count)
            
        except Exception as e:
            error_msg = f"执行节点 {node_id} 失败: {str(e)}"
            logger.error(error_msg)
            
            # 记录错误信息
            if trace:
                trace.add_error(node_id, error_msg)
                trace.end_node(node_id, "error")
                
            raise
        
        # 标记为已访问
        visited.add(node_id)
        
        # 执行后续节点
        if node_id in self.edges:
            for target in self.edges[node_id]:
                await self._execute_node(target, context, results, visited)

class DAGManager:
    """DAG管理器，负责加载和管理多个DAG"""
    
    def __init__(self, config_dir: str):
        self.config_dir = config_dir
        self.dags: Dict[str, DAG] = {}
        self._load_dags()
    
    def _load_dags(self):
        """加载所有DAG配置"""
        config_path = Path(self.config_dir)
        if not config_path.exists() or not config_path.is_dir():
            logger.warning(f"DAG配置目录 {self.config_dir} 不存在")
            return
        
        # 加载所有json配置文件
        for file_path in config_path.glob('**/*.json'):
            try:
                dag_id = file_path.stem
                self.dags[dag_id] = DAG(dag_id, str(file_path))
                logger.info(f"成功加载DAG: {dag_id} 从 {file_path}")
            except Exception as e:
                logger.error(f"加载DAG {file_path.name} 失败: {str(e)}")
    
    def get_dag(self, dag_id: str) -> Optional[DAG]:
        """获取指定的DAG"""
        return self.dags.get(dag_id)
    
    async def execute_dag(self, dag_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行指定的DAG"""
        dag = self.get_dag(dag_id)
        if not dag:
            raise ValueError(f"DAG {dag_id} 不存在")
        
        return await dag.execute(context)