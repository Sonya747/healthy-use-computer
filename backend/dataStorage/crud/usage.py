from fastapi import  HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Float, func, case, extract
from datetime import date, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel
import pandas as pd

# ---------- 数据库基础配置 ----------
from dataStorage.modals import AlertEvent, PostureMetric, ScreenSession, UserSetting

class ScreenSessionResponse(BaseModel):
    date: date
    hourly_usage: Dict[str, float]

class PostureMetricResponse(BaseModel):
    timestamp: datetime
    pitch: float
    yaw: float
    yoll:float

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
        time_bucket: str
    ) -> List[Dict]:
        """获取姿态指标聚合数据（修复版）"""
        time_expr_map = {
        'H': func.strftime('%Y-%m-%d %H:00:00', PostureMetric.timestamp),
        'D': func.strftime('%Y-%m-%d 00:00:00', PostureMetric.timestamp),
        'W': func.strftime('%Y-%W', PostureMetric.timestamp),
        'M': func.strftime('%Y-%m-01', PostureMetric.timestamp)
         }
    
        try:
            time_expr = time_expr_map[time_bucket]
        except KeyError:
            raise HTTPException(status_code=400, detail="Unsupported time bucket")

        # 执行聚合查询
        query = db.query(
            time_expr.label('time_bucket'),
            func.avg(PostureMetric.pitch).label('pitch'),
            func.avg(PostureMetric.yaw).label('yaw'),
            func.avg(PostureMetric.roll).label('roll')
        ).group_by('time_bucket')

        try:
            results = query.all()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        # 结果格式化
        formatted_results = []
        for r in results:
            try:
                if time_bucket == 'W':
                    dt = datetime.strptime(r.time_bucket + '-1', "%Y-%W-%w")
                else:
                    dt = datetime.strptime(r.time_bucket, time_expr_map[time_bucket].compile().string)
                
                formatted_results.append({
                    "timestamp": dt.isoformat(),
                    "pitch": round(float(r.pitch), 2) if r.pitch is not None else None,
                    "yaw": round(float(r.yaw), 2) if r.yaw is not None else None,
                    "roll": round(float(r.roll), 2) if r.roll is not None else None
                })
            except Exception as e:
                # raise HTTPException(e)
                continue

        return formatted_results


    
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


class DataUpdate:
    @staticmethod
    def updateSettings(db:Session,data:dict):
        try:
        # 检查是否存在现有记录
            existing_setting = db.query(UserSetting).first()
            
            if existing_setting:
                # 更新现有记录
                for key, value in data.items():
                    if hasattr(existing_setting, key):
                        setattr(existing_setting, key, value)
                    else:
                        db.rollback()
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Invalid field: {key}"
                        )
                db.commit()
                db.refresh(existing_setting)
                return existing_setting
            else:
                # 创建新记录
                valid_fields = {'alter_method', 'yall', 'roll'}
                if not all(key in valid_fields for key in data.keys()):
                    db.rollback()
                    raise HTTPException(
                        status_code=400, 
                        detail="Invalid fields in request"
                    )
                    
                new_setting = UserSetting(**data)
                db.add(new_setting)
                db.commit()
                db.refresh(new_setting)
                return new_setting 
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()
