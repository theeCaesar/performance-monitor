export function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export function formatBytes(bytes) {
  const gb = bytes / 1073741824;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1048576).toFixed(0)} MB`;
}

export function loadColor(percent) {
  if (percent <= 25) return "var(--clr-ok)";
  if (percent <= 50) return "var(--clr-warn-low)";
  if (percent <= 75) return "var(--clr-warn)";
  return "var(--clr-danger)";
}
