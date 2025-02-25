import { Row, Col, Card, Statistic, Progress, Typography, Space } from 'antd';
import { RiseOutlined, AlertOutlined, DashboardOutlined, ClockCircleOutlined } from '@ant-design/icons';
// import { Line } from '@ant-design/charts';

const { Title, Text } = Typography;

const Home = () => {
  // 示例数据
  const usageData = [
    { day: '周一', value: 4.5 },
    { day: '周二', value: 6.2 },
    { day: '周三', value: 5.8 },
    { day: '周四', value: 7.1 },
    { day: '周五', value: 6.5 },
    { day: '周六', value: 8.3 },
    { day: '周日', value: 4.9 },
  ];

  const config = {
    data: usageData,
    xField: 'day',
    yField: 'value',
    label: {},
    point: {
      size: 5,
      shape: 'diamond',
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 2000,
      },
    },
    color: '#1890ff',
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card bordered={false} style={{ borderRadius: 15, background: 'rgba(255,255,255,0.9)' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={2} style={{ color: '#1890ff' }}>
                🖥️ 欢迎使用 Healthy Use Computer
              </Title>
              <Text type="secondary" strong>
                您的人体工学电脑使用健康管理系统，助您保持高效工作的同时维护健康习惯
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 15, transition: 'all 0.3s' }}>
            <Statistic
              title="今日健康评分"
              value={88.5}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
              suffix="分"
            />
            <Progress percent={88.5} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 15, transition: 'all 0.3s' }}>
            <Statistic
              title="连续健康天数"
              value={14}
              valueStyle={{ color: '#faad14' }}
              prefix={<DashboardOutlined />}
              suffix="天"
            />
            <Text type="secondary">最佳记录：28天</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 15, transition: 'all 0.3s' }}>
            <Statistic
              title="今日提醒次数"
              value={6}
              valueStyle={{ color: '#f5222d' }}
              prefix={<AlertOutlined />}
              suffix="次"
            />
            <Text type="secondary">比昨日减少20%</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 15, transition: 'all 0.3s' }}>
            <Statistic
              title="总使用时长"
              value={36.5}
              precision={1}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
              suffix="小时"
            />
          </Card>
        </Col>

        {/* <Col span={24}>
          <Card 
            title="本周使用趋势分析" 
            bordered={false} 
            style={{ borderRadius: 15, background: 'rgba(255,255,255,0.9)' }}
            headStyle={{ borderBottom: 0 }}
          >
            <Line {...config} />
          </Card>
        </Col> */}

        <Col xs={24} md={12}>
          <Card 
            title="健康指标达成率" 
            style={{ borderRadius: 15, height: '100%' }}
          >
            <Progress
              type="dashboard"
              percent={75}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text strong>当前进度</Text>
              <br />
              <Text type="secondary">建议目标：每日达成率 ≥ 85%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="快捷操作" 
            style={{ borderRadius: 15, height: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <DashboardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>监测模式</div>
                </Card.Grid>
              </Col>

              <Col span={12}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div>健康报告</div>
                </Card.Grid>
              </Col>
              <Col span={12}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>个性化设置</div>
                </Card.Grid>
              </Col>
              <Col span={12}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <AlertOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <div>报告bug</div>
                </Card.Grid>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;