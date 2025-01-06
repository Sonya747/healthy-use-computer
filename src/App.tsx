import "./App.css";
import { HashRouter, Route, Routes, useRoutes } from "react-router";
import MainLayout from "./Layout/MainLayout.tsx";
import { routes } from "./router/index.tsx";

function App() {

  const element = useRoutes(routes);
  return (
    <>
      {element}
    </>
  );
}

export default App;
