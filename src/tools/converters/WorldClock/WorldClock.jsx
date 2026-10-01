import React, { useCallback, useEffect, useState } from "react";
import { Clock3, Plus, RefreshCw, X } from "lucide-react";
import "./WorldClock.css";

const favorites = [
  "America/New_York",
  "Europe/London",
  "Asia/Kolkata",
  "Asia/Tokyo",
];
const labelFor = (zone) => zone.replaceAll("_", " ").replaceAll("/", " · ");

// Displays clocks from the World Time API and refreshes them once per minute.
export default function WorldClock() {
  const [timezones, setTimezones] = useState(favorites);
  const [available, setAvailable] = useState(favorites);
  const [selected, setSelected] = useState(favorites[0]);
  const [clocks, setClocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(Date.now());

  const refresh = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const responses = await Promise.all(
          timezones.map(async (zone) => {
            const response = await fetch(
              `https://gateway.timeapi.world/timezone/${encodeURIComponent(zone)}`,
              { signal },
            );
            if (!response.ok)
              throw new Error(`Time service could not load ${zone}.`);
            return response.json();
          }),
        );
      const fetchedAt = Date.now();
      setClocks(responses.map((clock) => ({ ...clock, fetchedAt })));
      } catch (issue) {
        if (issue.name !== "AbortError")
          setError(
            "World Time API is unavailable right now. The local timezone fallback remains available.",
          );
      } finally {
        setLoading(false);
      }
    },
    [timezones],
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const tickTimer = window.setInterval(() => setTick(Date.now()), 1000);
    const refreshTimer = window.setInterval(() => refresh(controller.signal), 60000);
    return () => {
      controller.abort();
      window.clearInterval(tickTimer);
      window.clearInterval(refreshTimer);
    };
  }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://gateway.timeapi.world/timezone", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Timezone list unavailable");
        return response.json();
      })
      .then((zones) => setAvailable(zones))
      .catch(() => setAvailable(favorites));
    return () => controller.abort();
  }, []);

  function addClock() {
    if (!timezones.includes(selected))
      setTimezones((zones) => [...zones, selected]);
  }

  return (
    <section className="world-clock-tool" aria-label="World clock">
      <header className="clock-controls">
        <div>
          <span className="world-clock-icon">
            <Clock3 size={20} />
          </span>
          <p>Add cities and compare their local times.</p>
        </div>
        <div className="clock-add">
          <label className="sr-only" htmlFor="clock-zone">
            Choose timezone
          </label>
          <select
            id="clock-zone"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {available.map((zone) => (
              <option key={zone} value={zone}>
                {labelFor(zone)}
              </option>
            ))}
          </select>
          <button className="primary" onClick={addClock}>
            <Plus size={15} /> Add clock
          </button>
          <button
            className="icon-btn"
            onClick={() => refresh()}
            aria-label="Refresh clocks"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      {loading && clocks.length === 0 && (
        <p className="clock-status">Loading current times…</p>
      )}
      {error && (
        <p className="clock-error" role="status">
          {error}
        </p>
      )}
      <div className="world-clock-grid">
        {timezones.map((zone) => {
          const clock = clocks.find((item) => item.timezone === zone);
        const localTime = clock?.datetime
          ? new Date(new Date(clock.datetime).getTime() + tick - clock.fetchedAt)
            : new Date(tick);
          return (
            <article className="world-clock-card" key={zone}>
              <div>
                <span className="clock-zone">{labelFor(zone)}</span>
                <button
                  className="remove-clock"
                  aria-label={`Remove ${zone}`}
                  onClick={() =>
                    setTimezones((zones) =>
                      zones.filter((item) => item !== zone),
                    )
                  }
                >
                  <X size={15} />
                </button>
              </div>
              <strong>
                {new Intl.DateTimeFormat(undefined, {
                  timeZone: zone,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                }).format(localTime)}
              </strong>
              <small>
                {new Intl.DateTimeFormat(undefined, {
                  timeZone: zone,
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }).format(localTime)}
              </small>
              <small>
                {clock?.abbreviation || zone.split("/")[0]}{" "}
                {clock?.utc_offset || ""}
              </small>
            </article>
          );
        })}
      </div>
      <p className="clock-attribution">
        Time zones and UTC offsets via World Time API. Clock display ticks
        locally between refreshes.
      </p>
    </section>
  );
}
