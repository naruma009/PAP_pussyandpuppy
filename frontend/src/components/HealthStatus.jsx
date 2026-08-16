import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export default function HealthStatus() {
  const [state, setState] = useState({ status: "loading", message: "Checking FastAPI..." });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((health) => setState({ status: "ok", message: `${health.service}: ${health.status}` }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ status: "error", message: error.message });
      });
    return () => controller.abort();
  }, []);

  return <output className={`health-status health-status--${state.status}`}>{state.message}</output>;
}
