from sqlalchemy import Column, Float, Integer, String, DateTime, JSON, Boolean, Enum
from database import Base

# 屏幕使用时间
class ScreenSession(Base):
    __tablename__ = 'screen_sessions'
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime, nullable=False)  # 使用开始时间
    end_time = Column(DateTime)                    # 使用结束时间
    # total_duration = Column(Integer)               # 总秒数

# 姿态指标
class PostureMetric(Base):
    __tablename__ = 'posture_metrics'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False)    # 记录时间
    pitch = Column(Float)                  
    yaw = Column(Float)
    roll = Column(Float)


# 提醒事件
class AlertEvent(Base):
    __tablename__ = 'alert_events'
    id = Column(Integer, primary_key=True)
    alert_type = Column(Enum('posture', 'eye'))    # 提醒类型
    trigger_time = Column(DateTime, nullable=False)

class UserSetting(Base):
    __tablename__ = 'user_settings'
    id = Column(Integer, primary_key=True)
    alter_method = Column(Integer, nullable=False) #1： music ， 0:silence
    yall = Column(Float, nullable=False)         
    roll = Column(Float, nullable=False)
    pitch = Column(Float, nullable=False)
    eyeWidth = Column(Float, nullable=False)