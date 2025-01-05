import React, { useState } from "react";
import {
  HomeOutlined,
  LaptopOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Layout style={{ height: "100%", width: "100%" }}>
        <Header style={{ padding: 0 }}>
            
            <div style={{color:'white',fontWeight:'bold',fontSize:20}}>healthy use computer</div>

        </Header>
        <Layout>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={["1"]}
              items={[
                {
                  key: 0,
                  icon: <HomeOutlined />,
                  label: "主页",
                },
                {
                  key: "1",
                  icon: <VideoCameraOutlined />,
                  label: "监测模式",
                },
                {
                  key: "2",
                  icon: <LineChartOutlined />,
                  label: "健康报告",
                },
                {
                  key: "3",
                  icon: <LaptopOutlined />,
                  label: "屏幕设置",
                },
                //   {
                //     key: "3",
                //     icon: <UserOutlined />,
                //     label: "用户",
                //   },
                {
                  key: "4",
                  icon: <SettingOutlined />,
                  label: "设置",
                },
              ]}
            />
          </Sider>
          <Content
            style={{
              padding: "24px",
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            Content
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default MainLayout;
