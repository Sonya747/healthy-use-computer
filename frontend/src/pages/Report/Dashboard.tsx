import React, { useState, useEffect } from "react";
import { Card, DatePicker, Space, Spin, Tabs } from "antd";
import { Line, Heatmap, DualAxes } from "@ant-design/charts";
import dayjs from "dayjs";
import {
  fetchScreenSessions,
  fetchPostureMetrics,
  fetchAlertCorrelation,
} from "../../api/usage";
import type {
  ScreenSessionData,
  PostureMetric,
  AlertCorrelation,
  DateRange,
} from "./types";
import { Typography } from "antd";
const { Text } = Typography;

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(7, "days"),
    dayjs(),
  ]);
  const [screenData, setScreenData] = useState<ScreenSessionData[]>([]);
  const [postureData, setPostureData] = useState<PostureMetric[]>([]);
  const [alertData, setAlertData] = useState<AlertCorrelation[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [screenRes, postureRes, alertRes] = await Promise.all([
        fetchScreenSessions(dateRange[0], dateRange[1]),
        fetchPostureMetrics(),
        fetchAlertCorrelation(),
      ]);
      setScreenData(screenRes);
      setPostureData(postureRes);
      setAlertData(alertRes);
    } catch (error) {
      console.error("数据加载失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  // 热力图数据转换
  const heatmapData = screenData.flatMap((item) =>
    Object.entries(item.hourly_usage).map(([hour, value]) => ({
      date: item.date,
      hour: `${hour.padStart(2, "0")}:00`,
      value: Number(value.toFixed(2)),
    }))
  );

  // 姿态数据转换
  const postureChartData = [
    ...postureData.map((d) => ({
      timestamp: d.timestamp,
      value: d.head_pitch,
      type: "头部俯仰角",
    })),
    ...postureData.map((d) => ({
      timestamp: d.timestamp,
      value: d.head_yaw,
      type: "头部偏航角",
    })),
  ];

  return (
    <div style={{ padding: 24, background: "#f0f2f5" }}>
      <Card
        bordered={false}
        style={{
          background: "linear-gradient(45deg, #1890ff, #722ed1)",
          borderRadius: 15,
          color: "white",
        }}
      >
        <Space direction="vertical" size="middle">
          <Typography.Title level={2} style={{ color: "white", margin: 0 }}>
            📊 健康分析报告 - 本周汇总
          </Typography.Title>
          <Text style={{ color: "rgba(255,255,255,0.85)" }}>
            {`数据统计周期：${dateRange[0].toDate()} - ${dateRange[1].toDate()}`}
          </Text>
        </Space>
      </Card>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 18, marginRight: 16 }}>
              健康数据分析看板
            </span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as DateRange)}
              style={{ width: 256 }}
            />
          </div>
        }
        bordered={false}
      >
        <Spin spinning={loading} tip="加载中...">
          <Tabs defaultActiveKey="1">
            <TabPane tab="屏幕使用时间" key="1">
              <Heatmap
                data={heatmapData}
                xField="date"
                yField="hour"
                colorField="value"
                color={["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"]}
                legend={{ position: "right" }}
                height={400}
                tooltip={{
                  fields: ["date", "hour", "value"],
                  formatter: (data: any) => ({
                    name: "使用时长",
                    value: `${data.value} 小时`,
                  }),
                }}
              />
            </TabPane>

            <TabPane tab="姿势监测" key="2">
              <Line
                data={postureChartData}
                xField="timestamp"
                yField="value"
                seriesField="type"
                smooth
                height={400}
                meta={{
                  value: { alias: "角度值 (°)" },
                  timestamp: { alias: "时间" },
                }}
                interactions={[{ type: "marker-active" }]}
                legend={{ position: "top" }}
                animation={{ appear: { duration: 1000 } }}
              />
            </TabPane>

            <TabPane tab="健康提醒" key="3">
              <DualAxes
                data={[alertData, alertData]}
                xField="date"
                yField={["total_duration_hours", "alert_count"]}
                geometryOptions={[
                  {
                    geometry: "column",
                    color: "#1890ff",
                    columnWidthRatio: 0.4,
                  },
                  {
                    geometry: "line",
                    color: "#ff4d4f",
                    lineWidth: 2,
                  },
                ]}
                height={400}
                meta={{
                  total_duration_hours: { alias: "使用时长 (小时)" },
                  alert_count: { alias: "提醒次数" },
                }}
                legend={{ position: "top" }}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default Dashboard;
