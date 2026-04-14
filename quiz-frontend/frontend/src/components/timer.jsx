function Timer({ seconds }) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  const label = `${minutes}:${String(remainder).padStart(2, '0')}`;

  return (
    <div className="timer-pill">
      <span>Time</span>
      <strong>{label}</strong>
    </div>
  );
}

export default Timer;
