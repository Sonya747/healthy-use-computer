-- 插入测试数据（每小时一条记录）
INSERT INTO posture_metrics (timestamp, pitch, yaw, roll)
WITH RECURSIVE dates(t) AS (
    VALUES('2025-04-10 00:00:00')
    UNION ALL
    SELECT datetime(t, '+1 hour') FROM dates
    WHERE t < '2025-04-16 23:00:00'
)
SELECT 
    t,
    ABS(RANDOM() % 1500)/100.0 + 15,  -- 生成15.00-30.00的随机数
    ABS(RANDOM() % 1500)/100.0 + 15,
    ABS(RANDOM() % 1500)/100.0 + 15
FROM dates;