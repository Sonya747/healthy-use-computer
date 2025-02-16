import asyncio
from typing import Any, Dict, Optional

from pydantic import BaseModel


class AppState:
    def __init__(self):
        self.config = {
            "detection_interval": 30,
            "alert_threshold": 0.8
        }
        self.analysis_queue = asyncio.Queue()
        self.processing = False

class SystemConfig(BaseModel):
    """系统配置参数模型"""
    detection_interval: int = 30  # 单位：秒
    alert_threshold: float = 0.75  # 疲劳阈值 (0-1)
    resolution: str = "1280x720"   # 视频分辨率
    retention_days: Optional[int] = 30  # 数据保留天数

class ConfigUpdateResponse(BaseModel):
    """配置更新响应模型"""
    status: str
    changed_fields: Dict[str, Any]  # 类型无法精确约束，实际为键值对
