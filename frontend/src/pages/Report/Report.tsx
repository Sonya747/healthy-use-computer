import { Row, Col, Card, Typography, Timeline, Progress, Tag, Divider, Space } from 'antd';
import { Bar, Pie } from '@ant-design/charts';
import { ClockCircleOutlined, AlertOutlined, EyeOutlined, DashboardOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Report = () => {
  // 示例数据
  const usageData = [
    { time: '00:00', value: 0 },
    { time: '04:00', value: 0 },
    { time: '08:00', value: 4.5 },
    { time: '12:00', value: 6.8 },
    { time: '16:00', value: 7.2 },
    { time: '20:00', value: 5.4 },
  ];

  const alertData = [
    { type: '姿势提醒', value: 12 },
    { type: '休息提醒', value: 8 },
    { type: '用眼提醒', value: 6 },
    { type: '饮水提醒', value: 4 },
  ];

  const barConfig = {
    data: usageData,
    xField: 'value',
    yField: 'time',
    seriesField: 'time',
    color: ({ time }) => {
      const hour = parseInt(time.split(':')[0]);
      return hour > 18 ? '#722ed1' : hour > 12 ? '#1890ff' : hour > 8 ? '#52c41a' : '#faad14';
    },
    legend: false,
    height: 200,
    axis: {
      x: { title: '使用时长 (小时)' },
      y: { title: '时间段' }
    }
  };

  const pieConfig = {
    data: alertData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      content: '{name} | {percentage}',
    },
    color: ['#ff4d4f', '#faad14', '#52c41a', '#1890ff'],
    interactions: [{ type: 'element-active' }],
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card bordered={false} style={{ 
            background: 'linear-gradient(45deg, #1890ff, #722ed1)',
            borderRadius: 15,
            color: 'white'
          }}>
            <Space direction="vertical" size="middle">
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                📊 健康分析报告 - 本周汇总
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                数据统计周期：2023年12月18日 - 2023年12月24日
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title={<><DashboardOutlined /> 健康综合评分</>}
            style={{ borderRadius: 15, height: '100%' }}
          >
            <Progress
              type="dashboard"
              percent={82}
              strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
              width={150}
              format={percent => (
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0 }}>{percent}分</Title>
                  <Text type="secondary">健康指数</Text>
                </div>
              )}
            />
            <Divider />
            <Timeline mode="alternate">
              <Timeline.Item color="green">连续健康天数 +3</Timeline.Item>
              {/* <Timeline.Item color="red">周三久坐超标</Timeline.Item> */}
              <Timeline.Item color="green">达成饮水目标 5/7</Timeline.Item>
              <Timeline.Item color="gold">日平均休息次数 6.8</Timeline.Item>
            </Timeline>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card 
            title={<><ClockCircleOutlined /> 时段使用分布</>}
            style={{ borderRadius: 15 }}
          >
            <Bar {...barConfig} />
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Text strong>高峰时段：</Text>
                <Tag color="geekblue">14:00-16:00 (7.2小时)</Tag>
              </Col>
              <Col span={12}>
                <Text strong>最健康时段：</Text>
                <Tag color="green">08:00-10:00 (4.5小时)</Tag>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title={<><AlertOutlined /> 提醒统计</>}
            style={{ borderRadius: 15 }}
          >
            <Pie {...pieConfig} />
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>最常提醒类型：</Text>
                <Tag color="red">姿势提醒 (12次)</Tag>
              </Col>
              <Col span={12}>
                <Text strong>提醒响应率：</Text>
                <Progress percent={78} size="small" />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title={<><EyeOutlined /> 用眼健康分析</>}
            style={{ borderRadius: 15 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>平均连续用眼时长</Text>
                <Title level={3}>48分钟</Title>
                <Progress percent={60} status="active" />
                <Text type="secondary">建议：≤40分钟</Text>
              </Col>
              <Col span={12}>
                <Text strong>每日护眼操完成率</Text>
                <Title level={3}>85%</Title>
                <Progress 
                  type="circle" 
                  percent={85} 
                  width={80}
                  strokeColor="#52c41a"
                />
              </Col>
            </Row>
            <Divider />
            <Text strong>最佳护眼日：</Text>
            <Tag color="green">周四（间隔提醒9次）</Tag>
          </Card>
        </Col>

        <Col span={24}>
          <Card 
            title="健康趋势日历"
            style={{ borderRadius: 15 }}
          >
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 8
            }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i}
                  style={{
                    background: `rgba(24, 144, 255, ${Math.random() * 0.4 + 0.2})`,
                    padding: 12,
                    borderRadius: 8,
                    textAlign: 'center',
                    color: 'white'
                  }}
                >
                  <div>12/{18 + i}</div>
                  <Text strong>{Math.floor(Math.random() * 8 + 2)}h</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Report;