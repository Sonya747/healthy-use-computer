from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Enum
from database import Base

# 屏幕使用时间
class ScreenSession(Base):
    __tablename__ = 'screen_sessions'
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime, nullable=False)  # 使用开始时间
    end_time = Column(DateTime)                    # 使用结束时间
    total_duration = Column(Integer)               # 总秒数

# 姿态指标
class PostureMetric(Base):
    __tablename__ = 'posture_metrics'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False)    # 记录时间
    head_pitch = Column(Integer)                    # 简化为整数值
    head_yaw = Column(Integer)
    eye_state = Column(Enum('open', 'closed'))      # 合并双眼状态

# 提醒事件
class AlertEvent(Base):
    __tablename__ = 'alert_events'
    id = Column(Integer, primary_key=True)
    alert_type = Column(Enum('posture', 'rest'))    # 提醒类型
    trigger_time = Column(DateTime, nullable=False)