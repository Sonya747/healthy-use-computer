import "./App.css";
import { HashRouter, Route, Routes } from "react-router";
import MainLayout from "./Layout/MainLayout.tsx";

function App() {

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="*" element={ <MainLayout />}/>
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
