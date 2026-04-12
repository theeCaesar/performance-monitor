import { useEffect, useState } from "react";
import socket from "../utils/socket";
import ArcGauge from "./ArcGauge";
import { formatUptime, formatBytes } from "../utils/format";

export default function MachineCard({ data }) {
  const [online, setOnline] = useState(true);

  const { machineId, hostname, platform, uptime, cpu, memory } = data;

  useEffect(() => {
    function onStatus({ machineId: id, online: alive }) {
      if (id === machineId) setOnline(alive);
    }
    socket.on("agent:status", onStatus);
    return () => socket.off("agent:status", onStatus);
  }, [machineId]);

  return (
    <div className={`card${online ? "" : " card--offline"}`}>
      {!online && <div className="card__badge">OFFLINE</div>}

      <div className="card__header">
        <div className="card__host">{hostname || machineId.slice(0, 12)}</div>
        <div className="card__meta">
          <span className="pill">{platform}</span>
          <span className="pill">{formatUptime(uptime)}</span>
        </div>
      </div>

      <div className="card__gauges">
        <ArcGauge value={cpu.load} label="CPU" />
        <ArcGauge value={memory.percent} label="RAM" />
      </div>

      <div className="card__details">
        <div className="detail-row">
          <span className="detail-key">Processor</span>
          <span className="detail-val">{cpu.model}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Cores</span>
          <span className="detail-val">{cpu.cores}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Clock</span>
          <span className="detail-val">{cpu.speed} MHz</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Memory</span>
          <span className="detail-val">
            {formatBytes(memory.used)} / {formatBytes(memory.total)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Free</span>
          <span className="detail-val">{formatBytes(memory.free)}</span>
        </div>
      </div>
    </div>
  );
}
