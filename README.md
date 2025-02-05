# 项目说明
## 启动方法
### 首次启动
1. 激活虚拟环境
```
source venv/bin/activate
```
2. 安装依赖
```
pip install -r backend/requirements.txt
npm install
cd frontend
npm install
```
### 后续启动
```
npm start
```

## 开发日志
- 2025.1.2
使用```electron-vite-react```脚手架搭建项目
- 2025.1.3
写了摄像头组件的demo，并用于采集数据
- 2025.1.5
通过antd的Layout组件搭建主要布局
- 2025.1.6
更新路由管理
- 2025.1.10
稍微完善了CameraCapture组件，加入状态控制；
websocket传输视频流数据；
后续考虑更改为全局状态控制，
- 2025.2.5
更改项目结构，集成FastApi后端，使用electron作为桥阶层，前端改用更轻量的vite脚手架

后续考虑变更布局



# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
