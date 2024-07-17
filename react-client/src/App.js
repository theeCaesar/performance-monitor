import { useEffect, useState } from "react";
import "./App.css";
import socket from "./utilities/socketConnection";
import Widget from "./perfDataComponents/Widget";

function App() {
  const [performanceData, setPerformanceData] = useState({});
  const perfMachineData = {};

  // memo? nah

  useEffect(() => {
    socket.on("perfData", (data) => {
      perfMachineData[data.macA] = data; //not gonna cause a re-render
    });
  }, [perfMachineData]);

  useEffect(() => {
    setInterval(() => {
      setPerformanceData(perfMachineData);
    }, 2000);
  }, [perfMachineData]);

  const widgets = Object.values(performanceData).map((d) => (
    <Widget data={d} key={d.macA} />
  ));

  return <div className="container">{widgets}</div>;
}

export default App;
