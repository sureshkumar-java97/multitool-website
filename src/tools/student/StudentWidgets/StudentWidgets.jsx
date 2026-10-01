import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import "./StudentWidgets.css";

// A browser-only focus timer with common presets and a custom session length.
export function PomodoroTimer() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [activeDuration, setActiveDuration] = useState("focus");
  const [durationInput, setDurationInput] = useState("25");
  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(
      () =>
        setSeconds((value) => {
          if (value <= 1) {
            setRunning(false);
            setIsBreak((wasBreak) => {
              if (!wasBreak) setSessions((count) => count + 1);
              return !wasBreak;
            });
            return 0;
          }
          return value - 1;
        }),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [running]);
  useEffect(() => {
    if (!running && seconds === 0)
      setSeconds((isBreak ? breakMinutes : workMinutes) * 60);
  }, [breakMinutes, isBreak, running, seconds, workMinutes]);
  function preset(work, rest) {
    setWorkMinutes(work);
    setBreakMinutes(rest);
    setIsBreak(false);
    setSeconds(work * 60);
    setRunning(false);
    setDurationInput(String(activeDuration === "focus" ? work : rest));
  }
  // The same digit pad can set either custom timer length without a hardware keyboard.
  function pressDurationKey(key) {
    let next = durationInput;
    if (key === "Clear") next = "";
    else if (key === "⌫") next = durationInput.slice(0, -1);
    else if (/^\d$/.test(key)) next = durationInput + key;
    setDurationInput(next);
    if (!next) return;

    const max = activeDuration === "focus" ? 180 : 60;
    const minutes = Math.min(max, Math.max(1, Number(next) || 1));
    if (activeDuration === "focus") {
      setWorkMinutes(minutes);
      if (!isBreak) setSeconds(minutes * 60);
    } else {
      setBreakMinutes(minutes);
      if (isBreak) setSeconds(minutes * 60);
    }
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setIsBreak(false);
    setSeconds(workMinutes * 60);
  }
  return (
    <section className="student-widget">
      <p className="eyebrow">{isBreak ? "BREAK TIME" : "FOCUS SESSION"}</p>
      <div className="timer-display" aria-live="polite">
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </div>
      <p className="muted">Completed focus sessions: {sessions}</p>
      <div className="timer-presets">
        <button onClick={() => preset(25, 5)}>25 / 5</button>
        <button onClick={() => preset(50, 10)}>50 / 10</button>
        <label>
          Focus minutes
          <input
            type="number"
            min="1"
            max="180"
            value={activeDuration === "focus" ? durationInput : workMinutes}
            onFocus={() => {
              setActiveDuration("focus");
              setDurationInput(String(workMinutes));
            }}
            onChange={(event) => {
              const value = Math.min(
                180,
                Math.max(1, Number(event.target.value) || 1),
              );
              setActiveDuration("focus");
              setDurationInput(event.target.value);
              setWorkMinutes(value);
              if (!isBreak) setSeconds(value * 60);
              setRunning(false);
            }}
          />
        </label>
        <label>
          Break minutes
          <input
            type="number"
            min="1"
            max="60"
            value={activeDuration === "break" ? durationInput : breakMinutes}
            onFocus={() => {
              setActiveDuration("break");
              setDurationInput(String(breakMinutes));
            }}
            onChange={(event) => {
              const value = Math.min(
                60,
                Math.max(1, Number(event.target.value) || 1),
              );
              setActiveDuration("break");
              setDurationInput(event.target.value);
              setBreakMinutes(value);
              if (isBreak) setSeconds(value * 60);
              setRunning(false);
            }}
          />
        </label>
      </div>
      <section
        className="timer-number-pad"
        aria-label="Session length number pad"
      >
        <div className="timer-number-pad-heading">
          <strong>Number pad</strong>
          <span>
            Entering {activeDuration === "focus" ? "focus" : "break"} minutes
          </span>
        </div>
        <div className="timer-number-pad-grid">
          {[
            "7",
            "8",
            "9",
            "⌫",
            "4",
            "5",
            "6",
            "Clear",
            "1",
            "2",
            "3",
            "",
            "0",
            "",
            "",
            "",
          ].map((key, index) =>
            key ? (
              <button
                type="button"
                className={key === "Clear" ? "timer-number-pad-clear" : ""}
                key={`${key}-${index}`}
                aria-label={
                  key === "⌫"
                    ? "Backspace"
                    : key === "Clear"
                      ? "Clear minutes"
                      : `Enter ${key}`
                }
                onClick={() => pressDurationKey(key)}
              >
                {key}
              </button>
            ) : (
              <span key={`blank-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </section>
      <div className="timer-actions">
        <button
          className="primary"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </button>
        <button className="secondary" onClick={reset}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      <p className="form-note">
        Timer runs in this browser tab. Keep this page open during a session.
      </p>
    </section>
  );
}

// Counts down live to a locally interpreted date and time.
export function ExamCountdown() {
  const [date, setDate] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const target = date ? new Date(date).getTime() : NaN;
  const remaining = Number.isFinite(target) ? Math.max(0, target - now) : 0;
  const units = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
  };
  return (
    <section className="student-widget">
      <label className="countdown-label">
        Exam date and time
        <input
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      {date && (
        <div className="countdown-grid" aria-live="polite">
          {Object.entries(units).map(([unit, amount]) => (
            <div key={unit}>
              <strong>{String(amount).padStart(2, "0")}</strong>
              <span>{unit}</span>
            </div>
          ))}
        </div>
      )}
      <p className="form-note">
        Countdown uses the local timezone configured on your device.
      </p>
    </section>
  );
}
