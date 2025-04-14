from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Float, func, case, extract
from datetime import date, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel
import pandas as pd

# ---------- 数据库基础配置 ----------
from dataStorage.modals import AlertEvent, PostureMetric, ScreenSession
from database import Base, engine, SessionLocal

Base.metadata.create_all(bind=engine)

app = FastAPI()

# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- 数据模型定义 ----------
class ScreenSessionResponse(BaseModel):
    date: date
    hourly_usage: Dict[str, float]

class PostureMetricResponse(BaseModel):
    timestamp: datetime
    head_pitch: float
    head_yaw: float
    is_abnormal: bool

class AlertCorrelationResponse(BaseModel):
    date: date
    total_duration_hours: float
    alert_count: int

class DataAccess:
    @staticmethod
    def get_screen_sessions(
        db: Session,
        start_date: date,
        end_date: date
    ) -> List[Dict]:
        """获取屏幕使用时间分布"""
        results = db.query(
            func.date(ScreenSession.start_time).label("date"),
            extract('hour', ScreenSession.start_time).label("hour"),
            func.sum(
                func.julianday(ScreenSession.end_time) - 
                func.julianday(ScreenSession.start_time)
            ).cast(Float).label("duration_hours")
        ).filter(
            func.date(ScreenSession.start_time) >= start_date,
            func.date(ScreenSession.start_time) <= end_date
        ).group_by("date", "hour").all()

        return [{"date": r.date, "hour": r.hour, "duration_hours": r.duration_hours} 
                for r in results]

    @staticmethod
    def get_posture_metrics(
        db: Session,
        threshold: int = 25,
        time_bucket: str = "5min"
    ) -> List[Dict]:
        """获取姿态指标聚合数据"""
        # 获取原始数据
        raw_data = db.query(
            PostureMetric.timestamp,
            PostureMetric.head_pitch,
            PostureMetric.head_yaw,
            case((PostureMetric.head_pitch > threshold, True), else_=False).label("is_abnormal")
        ).all()

        # 使用Pandas进行时间分桶处理
        df = pd.DataFrame([{
            "timestamp": r.timestamp,
            "head_pitch": r.head_pitch,
            "head_yaw": r.head_yaw,
            "is_abnormal": r.is_abnormal
        } for r in raw_data])

        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.resample(time_bucket, on='timestamp').agg({
                'head_pitch': 'mean',
                'head_yaw': 'mean',
                'is_abnormal': 'mean'
            }).reset_index()
            df['is_abnormal'] = df['is_abnormal'].round().astype(bool)
            return df.to_dict("records")
        return []

    @staticmethod
    def get_alert_correlation(db: Session) -> List[Dict]:
        """获取提醒与使用时长的关联数据"""
        results = db.query(
            func.date(ScreenSession.start_time).label("date"),
            func.sum(
                func.julianday(ScreenSession.end_time) -
                func.julianday(ScreenSession.start_time)
            ).cast(Float).label("total_duration_hours"),
            func.count(AlertEvent.id).label("alert_count")
        ).outerjoin(
            AlertEvent,
            func.date(ScreenSession.start_time) == func.date(AlertEvent.trigger_time)
        ).group_by("date").all()

        return [{
            "date": r.date,
            "total_duration_hours": r.total_duration_hours * 24,  # 转换天数为小时
            "alert_count": r.alert_count
        } for r in results]

