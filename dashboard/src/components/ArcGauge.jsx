import { useEffect, useRef } from "react";
import { loadColor } from "../utils/format";

const RADIUS = 70;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

export default function ArcGauge({ value = 0, label, unit = "%" }) {
  const circleRef = useRef(null);

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(value, 100)) / 100;
    circleRef.current.style.strokeDashoffset = offset;
    circleRef.current.style.stroke = loadColor(value);
  }, [value]);

  return (
    <div className="arc-gauge">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--clr-track)"
          strokeWidth={STROKE}
        />
        <circle
          ref={circleRef}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
      </svg>
      <div className="arc-gauge__inner">
        <span className="arc-gauge__value">
          {Math.round(value)}
          <small>{unit}</small>
        </span>
        <span className="arc-gauge__label">{label}</span>
      </div>
    </div>
  );
}
