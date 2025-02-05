import { ReactNode } from "react";
import { Navigate, NavLink, NonIndexRouteObject } from "react-router";
import MainLayout from "../Layout/MainLayout";
import Camera from "../pages/Camera/Camera";
import {
  HomeOutlined,
  LaptopOutlined,
  LineChartOutlined,
  SettingOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import Home from "../pages/Home/Home";
import Report from "../pages/Report/Report";
import Screen from "../pages/Screen/Screen";
import Setting from "../pages/Setting/Setting";
import { MenuProps } from "antd";
//用于Router以及Menu
export interface RouteProp extends NonIndexRouteObject {
  label?: string;
  icon?: ReactNode;
  children?: RouteProp[];
}

export const routes: RouteProp[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "home",
        element: <Home />,
        label: "主页",
        icon: <HomeOutlined />,
      },
      {
        path: "camera",
        element: <Camera />,
        label: "监测模式",
        icon: <VideoCameraOutlined />,
      },
      {
        path: "report",
        element: <Report />,
        label: "健康报告",
        icon: <LineChartOutlined />,
      },
      // {
      //   path: "screen",
      //   element: <Screen />,
      //   label: "屏幕设置",
      //   icon: <LaptopOutlined />,
      // },
      {
        path: "setting",
        element: <Setting />,
        label: "设置",
        icon: <SettingOutlined />,
      },
    ],
  },
];
