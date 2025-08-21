from typing import Dict, Any, List, Optional
import json
from pathlib import Path
import os

from src.core.logger import logger

class NodeConfig:
    """节点配置类，负责加载和管理节点配置"""
    
    def __init__(self, config_dir: str):
        self.config_dir = config_dir
        self.node_configs: Dict[str, Dict[str, Any]] = {}
        self._load_configs()
    
    def _load_configs(self):
        """加载所有节点配置"""
        config_path = Path(self.config_dir)
        if not config_path.exists() or not config_path.is_dir():
            logger.warning(f"节点配置目录 {self.config_dir} 不存在")
            return
        
        # 加载所有json配置文件
        for file_path in config_path.glob('*.json'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                node_type = file_path.stem
                self.node_configs[node_type] = config
                logger.info(f"成功加载节点配置: {node_type}")
            except Exception as e:
                logger.error(f"加载节点配置 {file_path.name} 失败: {str(e)}")
    
    def get_node_config(self, node_type: str) -> Optional[Dict[str, Any]]:
        """获取指定类型的节点配置"""
        return self.node_configs.get(node_type)
    
    def get_all_node_configs(self) -> Dict[str, Dict[str, Any]]:
        """获取所有节点配置"""
        return self.node_configs

def create_default_node_configs(config_dir: str):
    """创建默认的节点配置文件"""
    config_path = Path(config_dir)
    if not config_path.exists():
        os.makedirs(config_path, exist_ok=True)
    
    # 标签召回配置
    tag_recall_config = {
        "description": "基于标签的召回配置",
        "parameters": {
            "recall_size": {
                "type": "integer",
                "description": "召回数量",
                "default": 100,
                "minimum": 10,
                "maximum": 1000
            },
            "tag_weight_decay": {
                "type": "number",
                "description": "标签权重衰减系数",
                "default": 0.9,
                "minimum": 0.1,
                "maximum": 1.0
            },
            "min_tag_match": {
                "type": "integer",
                "description": "最小匹配标签数",
                "default": 1,
                "minimum": 1,
                "maximum": 10
            },
            "max_tag_match": {
                "type": "integer",
                "description": "最大匹配标签数",
                "default": 3,
                "minimum": 1,
                "maximum": 10
            }
        }
    }
    
    # 热门召回配置
    popular_recall_config = {
        "description": "基于热度的召回配置",
        "parameters": {
            "recall_size": {
                "type": "integer",
                "description": "召回数量",
                "default": 100,
                "minimum": 10,
                "maximum": 1000
            },
            "time_window": {
                "type": "string",
                "description": "时间窗口",
                "default": "1d",
                "enum": ["1h", "6h", "1d", "7d", "30d"]
            },
            "metrics": {
                "type": "array",
                "description": "热度指标",
                "default": ["pv", "like", "comment"],
                "items": {
                    "type": "string",
                    "enum": ["pv", "like", "comment", "share", "favorite"]
                }
            },
            "weights": {
                "type": "object",
                "description": "指标权重",
                "default": {
                    "pv": 1.0,
                    "like": 3.0,
                    "comment": 5.0,
                    "share": 7.0,
                    "favorite": 10.0
                }
            }
        }
    }
    
    # 向量召回配置
    vector_recall_config = {
        "description": "基于向量的召回配置",
        "parameters": {
            "recall_size": {
                "type": "integer",
                "description": "召回数量",
                "default": 100,
                "minimum": 10,
                "maximum": 1000
            },
            "vector_field": {
                "type": "string",
                "description": "向量字段",
                "default": "emb"
            },
            "distance_metric": {
                "type": "string",
                "description": "距离度量",
                "default": "cosine",
                "enum": ["cosine", "l2", "inner"]
            },
            "min_score": {
                "type": "number",
                "description": "最小相似度分数",
                "default": 0.7,
                "minimum": 0.0,
                "maximum": 1.0
            }
        }
    }
    
    # 多跳召回配置
    multi_hop_recall_config = {
        "description": "基于多跳关系的召回配置",
        "parameters": {
            "recall_size": {
                "type": "integer",
                "description": "召回数量",
                "default": 100,
                "minimum": 10,
                "maximum": 1000
            },
            "max_hops": {
                "type": "integer",
                "description": "最大跳数",
                "default": 2,
                "minimum": 1,
                "maximum": 3
            },
            "relation_types": {
                "type": "array",
                "description": "关系类型",
                "default": ["like", "favorite"],
                "items": {
                    "type": "string",
                    "enum": ["like", "favorite", "follow", "view"]
                }
            },
            "hop_decay": {
                "type": "number",
                "description": "跳数衰减系数",
                "default": 0.5,
                "minimum": 0.1,
                "maximum": 1.0
            }
        }
    }
    
    # 粗排配置
    pre_rank_config = {
        "description": "粗排配置",
        "parameters": {
            "rank_size": {
                "type": "integer",
                "description": "排序后保留数量",
                "default": 200,
                "minimum": 50,
                "maximum": 500
            },
            "feature_fields": {
                "type": "array",
                "description": "特征字段",
                "default": ["title", "tags", "author_id", "created_at"],
                "items": {
                    "type": "string"
                }
            },
            "model_type": {
                "type": "string",
                "description": "模型类型",
                "default": "rule",
                "enum": ["rule", "gbdt", "lr"]
            },
            "rule_weights": {
                "type": "object",
                "description": "规则权重",
                "default": {
                    "recency": 0.7,
                    "popularity": 0.3
                }
            }
        }
    }
    
    # 精排配置
    rank_config = {
        "description": "精排配置",
        "parameters": {
            "rank_size": {
                "type": "integer",
                "description": "排序后保留数量",
                "default": 50,
                "minimum": 20,
                "maximum": 200
            },
            "feature_fields": {
                "type": "array",
                "description": "特征字段",
                "default": ["title", "tags", "author_id", "created_at"],
                "items": {
                    "type": "string"
                }
            },
            "model_type": {
                "type": "string",
                "description": "模型类型",
                "default": "gbdt",
                "enum": ["gbdt", "lr", "dnn"]
            },
            "model_path": {
                "type": "string",
                "description": "模型路径",
                "default": "models/gbdt_rank_v1"
            },
            "score_field": {
                "type": "string",
                "description": "分数字段",
                "default": "rank_score"
            }
        }
    }
    
    # 重排配置
    rerank_config = {
        "description": "重排配置",
        "parameters": {
            "diversity_weight": {
                "type": "number",
                "description": "多样性权重",
                "default": 0.2,
                "minimum": 0.0,
                "maximum": 1.0
            },
            "diversity_fields": {
                "type": "array",
                "description": "多样性字段",
                "default": ["tags", "author_id"],
                "items": {
                    "type": "string"
                }
            },
            "max_items_per_key": {
                "type": "object",
                "description": "每个键的最大项数",
                "default": {
                    "author_id": 2,
                    "tags": 3
                }
            },
            "n_out_m": {
                "type": "object",
                "description": "N出M配置",
                "default": {
                    "enabled": False,
                    "n": 1,
                    "m": 5,
                    "key": "author_id"
                }
            }
        }
    }
    
    # 过滤配置
    filter_config = {
        "description": "过滤配置",
        "parameters": {
            "filter_rules": {
                "type": "array",
                "description": "过滤规则",
                "default": ["block", "duplicate", "low_quality"],
                "items": {
                    "type": "string",
                    "enum": ["block", "duplicate", "low_quality", "sensitive"]
                }
            },
            "quality_threshold": {
                "type": "number",
                "description": "质量阈值",
                "default": 0.3,
                "minimum": 0.0,
                "maximum": 1.0
            }
        }
    }
    
    # 混排配置
    blend_config = {
        "description": "混排配置",
        "parameters": {
            "blend_strategy": {
                "type": "string",
                "description": "混排策略",
                "default": "weighted",
                "enum": ["weighted", "interleave", "cascade"]
            },
            "weights": {
                "type": "object",
                "description": "各来源权重",
                "default": {
                    "content": 1.0,
                    "ad": 0.8,
                    "product": 0.9
                }
            },
            "output_size": {
                "type": "integer",
                "description": "输出数量",
                "default": 20,
                "minimum": 5,
                "maximum": 50
            },
            "ad_density": {
                "type": "number",
                "description": "广告密度",
                "default": 0.2,
                "minimum": 0.0,
                "maximum": 0.5
            },
            "product_density": {
                "type": "number",
                "description": "商品密度",
                "default": 0.1,
                "minimum": 0.0,
                "maximum": 0.5
            }
        }
    }
    
    # 保存配置文件
    configs = {
        "tag_recall": tag_recall_config,
        "popular_recall": popular_recall_config,
        "vector_recall": vector_recall_config,
        "multi_hop_recall": multi_hop_recall_config,
        "pre_rank": pre_rank_config,
        "rank": rank_config,
        "rerank": rerank_config,
        "filter": filter_config,
        "blend": blend_config
    }
    
    for node_type, config in configs.items():
        file_path = config_path / f"{node_type}.json"
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            logger.info(f"创建节点配置: {file_path}")
        except Exception as e:
            logger.error(f"创建节点配置 {file_path} 失败: {str(e)}")