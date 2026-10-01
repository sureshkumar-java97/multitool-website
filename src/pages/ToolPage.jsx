import React, { useRef, useState } from "react";
import { Copy, RotateCcw, Sparkles, Check, AlertCircle } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { allTools } from "../data/registry";
import BasicCalculator from "../tools/calculators/BasicCalculator/BasicCalculator";
import ScientificCalculator from "../tools/calculators/ScientificCalculator/ScientificCalculator";
import { exampleFor, inputHint, runTool } from "../utils/toolLogic";
import WorldClock from "../tools/converters/WorldClock/WorldClock";
import {
  ExamCountdown,
  PomodoroTimer,
} from "../tools/student/StudentWidgets/StudentWidgets";
import CurrencyConverter from "../tools/converters/CurrencyConverter/CurrencyConverter";
import APIRequestBuilder from "../tools/developer/APIRequestBuilder/APIRequestBuilder";
import ColorPicker from "../tools/design/ColorPicker/ColorPicker";
import NumericTool from "../components/NumericTool/NumericTool";

// These tools work with measurable values, so they use number fields and a
// calculator-style result instead of the text workspace used by text tools.
const NUMERIC_TOOLS = new Set([
  "Percentage",
  "EMI",
  "Loan",
  "GST",
  "Discount",
  "Age",
  "BMI",
  "CGPA ↔ Percentage Converter",
  "Length",
  "Weight",
  "Temperature",
  "Time",
  "Area",
  "Data Storage",
  "Study Time Planner",
  "Marks Percentage Calculator",
  "Attendance Calculator",
  "Electricity Bill Estimator",
  "Water Intake Calculator",
  "Trip Cost Calculator",
]);
export default function ToolPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const tool = allTools.find((t) => t.slug === slug);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestController = useRef(null);
  if (!tool)
    return (
      <main className="wrap">
        <h1>Tool not found</h1>
        <Link to="/tools">Browse tools</Link>
      </main>
    );
  const run = async () => {
    setError("");
    setLoading(true);
    requestController.current?.abort();
    requestController.current = new AbortController();
    try {
      const result = await runTool(
        tool.name,
        input,
        requestController.current.signal,
      );
      setOutput(result);
    } catch (e) {
      if (e.name !== "AbortError") {
        setOutput("");
        setError(e.message || "Check your input and try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="wrap tool-page">
      <button
        className="back"
        type="button"
        onClick={() => {
          // Return to the page that opened this tool; direct links fall back to the tool library.
          if (window.history.length > 1) navigate(-1);
          else navigate("/tools");
        }}
        aria-label="Go back to the previous page"
      >
        ← Back
      </button>
      <div className="tool-heading">
        <span className="tool-icon">
          <Sparkles size={22} />
        </span>
        <div>
          <p className="eyebrow">{tool.category}</p>
          <h1>{tool.name}</h1>
          <p className="muted">{tool.description}</p>
        </div>
      </div>
      {tool.name === "Basic Calculator" ? (
        <BasicCalculator />
      ) : tool.name === "Scientific Calculator" ? (
        <ScientificCalculator />
      ) : tool.name === "World Clock" ? (
        <WorldClock />
      ) : tool.name === "Currency" ? (
        <CurrencyConverter />
      ) : tool.name === "API Request Builder" ? (
        <APIRequestBuilder />
      ) : tool.name === "Color Picker" ? (
        <ColorPicker />
      ) : tool.name === "Pomodoro Timer" ? (
        <PomodoroTimer />
      ) : tool.name === "Exam Countdown" ? (
        <ExamCountdown />
      ) : NUMERIC_TOOLS.has(tool.name) ? (
        <NumericTool name={tool.name} />
      ) : (
        <div className="workspace">
          <section className="panel">
            <label htmlFor="tool-input">Input</label>
            <textarea
              id="tool-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                tool.name.includes("JSON")
                  ? "Paste JSON here…"
                  : inputHint(tool.name)
              }
            />
            <div className="actions">
              <button className="primary" onClick={run} disabled={loading}>
                {loading
                  ? "Loading…"
                  : tool.name === "Currency"
                    ? "Get latest rate"
                    : "Run tool"}
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError("");
                }}
              >
                <RotateCcw size={15} /> Reset
              </button>
              <button
                className="secondary"
                onClick={() =>
                  setInput(
                    tool.name.includes("JSON")
                      ? '{"name":"MultiTool","tools":["fast","useful"]}'
                      : exampleFor(tool.name),
                  )
                }
              >
                <Sparkles size={15} /> Example
              </button>
            </div>
            {error && (
              <p className="error">
                <AlertCircle size={16} />
                {error}
              </p>
            )}
          </section>
          <section className="panel output-panel">
            <div className="output-title">
              <label>Output</label>
              <button
                className="icon-btn"
                aria-label="Copy output"
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <pre>
              {output || (
                <span className="placeholder">
                  Your result will appear here.
                </span>
              )}
            </pre>
          </section>
        </div>
      )}
      <p className="privacy">
        {tool.name === "API Request Builder"
          ? "This tool sends the request you configure to the URL you enter. The destination controls how it handles that request."
          : tool.name === "Currency"
            ? "Currency codes are sent to Frankfurter to retrieve the latest published reference rate."
            : "Your input is processed locally in this browser. Nothing is uploaded."}
      </p>
      <div className="related">
        <h2>Related tools</h2>
        {allTools
          .filter((t) => t.category === tool.category && t.slug !== slug)
          .slice(0, 4)
          .map((t) => (
            <Link key={t.slug} to={"/tool/" + t.slug}>
              {t.name} ↗
            </Link>
          ))}
      </div>
    </main>
  );
}
/* Shared workspace: extend the run switch for a browser-only transformation. */
