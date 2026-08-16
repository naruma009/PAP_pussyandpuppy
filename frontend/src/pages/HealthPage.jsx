import HealthStatus from "../components/HealthStatus";

export default function HealthPage() {
  return (
    <section>
      <p className="eyebrow">Local integration proof</p>
      <h1>FastAPI health</h1>
      <HealthStatus />
    </section>
  );
}
