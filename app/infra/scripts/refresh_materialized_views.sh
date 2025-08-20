#!/bin/bash

# 刷新所有物化视图的脚本

echo "开始刷新物化视图: $(date)"

# 连接到PostgreSQL并执行刷新函数
psql -h postgres -U postgres -d mini_feeds -c "SELECT metrics.refresh_all_materialized_views();"

echo "物化视图刷新完成: $(date)"