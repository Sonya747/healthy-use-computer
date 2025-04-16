import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  message,
  Space,
  Spin,
  Tabs,
} from "antd";
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
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(7, "days"),
    dayjs(),
  ]);
  const [screenData, setScreenData] = useState<ScreenSessionData[]>([]);
  const [postureData, setPostureData] = useState<PostureMetric[]>([]);
  const [alertData, setAlertData] = useState<AlertCorrelation[]>([]);
  type DataState = "loading" | "empty" | "error" | "success";
  const [screenDataState, setScreenDataState] = useState<DataState>("loading");
  const [postureDataState, setPostureDataState] =
    useState<DataState>("loading");
  const [alertDataState, setAlertDataState] = useState<DataState>("loading");
  const [key, setKey] = useState<string>("1");

  useEffect(() => {
    switch (key) {
      case "1":
        loadScreenData();
        break;
      case "2":
        loadPostureData();
        break;
      case "3":
        loadAlertData();
        break;
      default:
        break;
    }
  }, [dateRange, key]);

  const loadScreenData = async () => {
    setScreenDataState("loading");
    try {
      const screenRes = await fetchScreenSessions(dateRange[0], dateRange[1]);
      if (screenRes.length === 0) {
        setScreenDataState("empty");
        message.warning("屏幕使用数据为空");
      } else {
        setScreenDataState("success");
        setScreenData(screenRes);
      }
    } catch (error) {
      setScreenDataState("error");
      console.error("屏幕使用数据加载失败:", error);
    }
  };

  const loadPostureData = async () => {
    try {
      const postureRes = await fetchPostureMetrics();
      if (postureRes.length === 0) {
        setPostureDataState("empty");
        message.warning("姿态监测数据为空");
      } else {
        setPostureDataState("success");
        setPostureData(postureRes);
      }
    } catch (error) {
      setPostureDataState("error");
      console.error("姿态监测数据加载失败:", error);
    }
  };

  const loadAlertData = async () => {
    try {
      const alertRes = await fetchAlertCorrelation();
      if (alertRes.length === 0) {
        setAlertDataState("empty");
        message.warning("健康提醒数据为空");
      } else {
        setAlertDataState("success");
        setAlertData(alertRes);
        console.log(alertRes);
      }
    } catch (error) {
      setAlertDataState("error");
      console.error("健康提醒数据加载失败:", error);
    }
  };

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
      value: d.pitch,
      type: "头部俯仰角",
    })),
    ...postureData.map((d) => ({
      timestamp: d.timestamp,
      value: d.yaw,
      type: "头部偏航角",
    })),
  ];

  const renderAlertData = () => {
    switch (alertDataState) {
      case "loading":
        return <Spin spinning={true} tip="加载中..." />;
      case "empty":
        // return <Text type="warning">暂无健康提醒数据</Text>;
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                当前没有可用数据
                <br />
                请检查设备连接或调整时间范围
              </span>
            }
          >
            <Button type="primary" onClick={loadAlertData}>
              重新加载
            </Button>
          </Empty>
        );
      case "error":
        return <Text type="danger">加载健康提醒数据失败</Text>;
      case "success":
        console.log(alertData);
        return (
          <DualAxes
          data={[alertData, alertData.map(d => ({ ...d, alert_count: d.alert_count || 0.1 }))]} // 避免全零数据
          xField="date"
          yField={['total_duration_hours', 'alert_count']}
          geometryOptions={[
            {
              geometry: 'column',
              color: '#1890ff',
              columnWidthRatio: 0.4,
              mapping: {
                color: (datum) => datum.total_duration_hours > 0 ? '#1890ff' : '#f0f0f0'
              }
            },
            {
              geometry: 'line',
              color: '#ff4d4f',
              lineSize: 2,
              point: { size: 4, shape: 'circle' }
            }
          ]}
          meta={{
            date: {
              type: 'timeCat',
              formatter: (val) => dayjs(val).format('MM/DD'),
              range: [0, 1] // 强制显示所有数据点
            },
            total_duration_hours: {
              min: 0,
              max: Math.max(...alertData.map(d => d.total_duration_hours)) + 0.5
            },
            alert_count: {
              min: 0,
              max: 5 // 即使数据全零也显示刻度
            }
          }}
          tooltip={{
            showCrosshairs: true,
            shared: true
          }}
          legend={{
            position: 'top',
            itemName: {
              formatter: (text) => text === 'total_duration_hours' ? '使用时长' : '提醒次数'
            }
          }}
          animation={false} // 暂时关闭动画调试
          theme="dark" // 测试主题是否生效
          height={400}
          padding="auto"
          slider={{ start: 0, end: 1 }}
        />
          // <TestChart/>
        );
    }
  };

  const renderScreenData = () => {
    switch (screenDataState) {
      case "loading":
        return <Spin spinning={true} tip="加载中..." />;
      case "empty":
        // return <Text type="warning">暂无健康提醒数据</Text>;
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                当前没有可用数据
                <br />
                请检查设备连接或调整时间范围
              </span>
            }
          >
            <Button type="primary" onClick={loadAlertData}>
              重新加载
            </Button>
          </Empty>
        );
      case "error":
        return <Text type="danger">加载屏幕使用数据失败</Text>;
      case "success":
        return (
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
        );
    }
  };

  const renderPostureData = () => {
    switch (postureDataState) {
      case "loading":
        return <Spin spinning={true} tip="加载中..." />;
      case "empty":
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                当前没有可用数据
                <br />
                请检查设备连接或调整时间范围
              </span>
            }
          >
            <Button type="primary" onClick={loadAlertData}>
              重新加载
            </Button>
          </Empty>
        );
      case "error":
        return <Text type="danger">加载姿态监测数据失败</Text>;
      case "success":
        return (
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
        );
    }
  };
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
            {`数据统计周期：${dateRange[0].format(
              "YYYY年MM月DD日"
            )} - ${dateRange[1].format("YYYY年MM月DD日")}`}
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
        {/* <Spin spinning={loading} tip="加载中..."> */}
        <Tabs defaultActiveKey="1" activeKey={key} onChange={setKey}>
          (
          <TabPane tab="屏幕使用时间" key="1">
            {key === "1" && renderScreenData()}
          </TabPane>
          ) (
          <TabPane tab="姿势监测" key="2">
            {key === "2" && renderPostureData()}
          </TabPane>
          )
          <TabPane tab="健康提醒" key="3">
            {key === "3" && renderAlertData()}
          </TabPane>
        </Tabs>
        {/* </Spin> */}
      </Card>
    </div>
  );
};

export default Dashboard;
