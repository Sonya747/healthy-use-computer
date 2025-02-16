import asyncio
from pydantic import BaseModel
from datetime import datetime

#TODO 数据模型定义
class AnalysisRequest(BaseModel):
    frame_data: bytes  # 原始二进制图像数据
    timestamp: datetime
    device_id: str

class EyeStateResult(BaseModel):
    is_eye_open: bool
    confidence: float
    blink_count: int
    timestamp: datetime

class AnalysisRequest:
    """视频帧请求类型（非JSON结构）"""
    def __init__(self, frame_data: bytes):
        self.frame_data = frame_data  # 二进制图像数据
        
