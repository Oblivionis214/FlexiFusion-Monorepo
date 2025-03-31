timeout = 300  # 设置 5 分钟超时
max_requests = 1000  # 限制每个 worker 处理的最大请求数
max_requests_jitter = 50  # 添加随机抖动，避免所有 worker 同时重启