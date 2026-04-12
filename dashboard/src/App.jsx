import { useEffect, useRef, useState } from "react";
import socket from "./utils/socket";
import Header from "./components/Header";
import MachineCard from "./components/MachineCard";
import "./App.css";

export default function App() {
  const buffer = useRef({});
  const [machines, setMachines] = useState({});

  useEffect(() => {
    function onMetrics(payload) {
      buffer.current[payload.machineId] = payload;
    }
    socket.on("metrics:update", onMetrics);

    const flush = setInterval(() => {
      if (Object.keys(buffer.current).length > 0) {
        setMachines({ ...buffer.current });
      }
    }, 1500);

    return () => {
      socket.off("metrics:update", onMetrics);
      clearInterval(flush);
    };
  }, []);

  const entries = Object.values(machines);

  return (
    <div className="app">
      <Header machineCount={entries.length} />
      <main className="grid">
        {entries.length === 0 && (
          <div className="empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p>Waiting for agents to connect…</p>
          </div>
        )}
        {entries.map((m) => (
          <MachineCard key={m.machineId} data={m} />
        ))}
      </main>
    </div>
  );
}
