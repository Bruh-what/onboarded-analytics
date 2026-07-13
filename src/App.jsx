import { useState, useEffect } from "react";
import "./App.css";

const CORRECT_PASSWORD = import.meta.env.VITE_ANALYTICS_PASSWORD;

function BarChart({ data }) {
  if (!data || data.length === 0) return <p>No data</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="chart">
      {data.map((d) => (
        <div key={d.date} className="bar-wrap">
          <div
            className="bar"
            style={{ height: `${(d.count / max) * 160}px` }}
            title={`${d.date}: ${d.count}`}
          />
          <span className="bar-label">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading...</p>;
  if (error) return <p className="status error">Error: {error}</p>;

  return (
    <div className="dashboard">
      <h1>file_processed Analytics</h1>
      <div className="summary">
        <div className="card">
          <span className="num">{stats.allTime}</span>
          <span className="label">All time</span>
        </div>
        <div className="card">
          <span className="num">{stats.last7Days}</span>
          <span className="label">Last 7 days</span>
        </div>
        <div className="card">
          <span className="num">{stats.last30Days}</span>
          <span className="label">Last 30 days</span>
        </div>
      </div>
      <h2>Daily counts (last 30 days)</h2>
      <BarChart data={stats.daily} />
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [failed, setFailed] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value === CORRECT_PASSWORD) {
      onUnlock();
    } else {
      setFailed(true);
      setValue("");
    }
  }

  return (
    <div className="gate">
      <h1>Onboarded Analytics</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFailed(false);
          }}
          autoFocus
        />
        <button type="submit">Enter</button>
      </form>
      {failed && <p className="error">Incorrect password</p>}
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? (
    <Dashboard />
  ) : (
    <PasswordGate onUnlock={() => setUnlocked(true)} />
  );
}
