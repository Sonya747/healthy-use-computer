-- -- 创建alert_events表
-- CREATE TABLE alert_events (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     alert_type TEXT CHECK(alert_type IN ('posture', 'eye')),
--     trigger_time DATETIME NOT NULL
-- );

-- -- 创建user_settings表
-- CREATE TABLE user_settings (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     alter_method INTEGER NOT NULL,
--     yall FLOAT NOT NULL,
--     roll FLOAT NOT NULL,
--     pitch FLOAT NOT NULL,
--     eyeWidth FLOAT NOT NULL
-- );

-- -- 为alert_events插入测试数据
-- INSERT INTO alert_events (alert_type, trigger_time) VALUES
-- ('posture', '2023-10-01 09:30:00'),
-- ('eye', '2023-10-01 10:15:00'),
-- ('posture', '2023-10-02 14:20:00'),
-- ('eye', '2023-10-02 16:45:00');


DROP TABLE posture_metrics;


-- 创建姿势数据表
CREATE TABLE posture_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    pitch FLOAT ,
    yaw FLOAT ,
    roll FLOAT 
);

-- 插入测试数据（每小时一条记录）
INSERT INTO posture_metrics (timestamp, pitch, yaw, roll)
WITH RECURSIVE dates(t) AS (
    VALUES('2025-04-10 00:00:00')
    UNION ALL
    SELECT datetime(t, '+1 hour') FROM dates
    WHERE t < '2025-04-16 23:00:00'
)