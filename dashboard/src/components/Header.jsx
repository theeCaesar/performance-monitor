export default function Header({ machineCount }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>PulseBoard</span>
      </div>
      <div className="topbar__status">
        <span className="dot" />
        <span>
          {machineCount} {machineCount === 1 ? "machine" : "machines"} connected
        </span>
      </div>
    </header>
  );
}
