import React, { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { exampleFor, runTool } from "../../utils/toolLogic";
import "./NumericTool.css";

const configs = {
  Percentage: [
    ["Amount", "250"],
    ["Percentage", "15"],
  ],
  EMI: [
    ["Loan principal", "250000"],
    ["Annual interest rate (%)", "8.5"],
    ["Term (months)", "60"],
  ],
  Loan: [
    ["Loan principal", "250000"],
    ["Annual interest rate (%)", "8.5"],
    ["Term (months)", "60"],
  ],
  GST: [
    ["Amount before GST", "1200"],
    ["GST rate (%)", "18"],
  ],
  Discount: [
    ["Original price", "2499"],
    ["Discount (%)", "20"],
  ],
  Age: [["Date of birth", "", "date"]],
  BMI: [
    ["Weight (kg)", "68"],
    ["Height (cm)", "172"],
  ],
  "CGPA ↔ Percentage Converter": [
    ["CGPA (up to 10) or percentage (up to 100)", "8.2"],
  ],
  Length: [
    ["Amount", "5"],
    ["From unit", "km", "select", ["m", "km", "cm", "mm", "mi", "ft", "in"]],
    [
      "To unit",
      "miles",
      "select",
      ["m", "km", "cm", "mm", "mi", "miles", "ft", "in"],
    ],
  ],
  Weight: [
    ["Amount", "70"],
    ["From unit", "kg", "select", ["kg", "g", "mg", "lb", "lbs", "oz"]],
    ["To unit", "lb", "select", ["kg", "g", "mg", "lb", "lbs", "oz"]],
  ],
  Temperature: [
    ["Amount", "25"],
    ["From unit", "C", "select", ["C", "F", "K"]],
    ["To unit", "F", "select", ["C", "F", "K"]],
  ],
  Time: [
    ["Amount", "90"],
    ["From unit", "min", "select", ["s", "min", "h", "d"]],
    [
      "To unit",
      "seconds",
      "select",
      ["s", "seconds", "min", "minutes", "h", "hours", "d", "days"],
    ],
  ],
  Area: [
    ["Amount", "1"],
    ["From unit", "acre", "select", ["m2", "km2", "ft2", "acre", "ha"]],
    ["To unit", "m2", "select", ["m2", "km2", "ft2", "acre", "ha"]],
  ],
  "Data Storage": [
    ["Amount", "2"],
    [
      "From unit",
      "GB",
      "select",
      ["B", "KB", "MB", "GB", "TB", "KiB", "MiB", "GiB", "TiB"],
    ],
    [
      "To unit",
      "MB",
      "select",
      ["B", "KB", "MB", "GB", "TB", "KiB", "MiB", "GiB", "TiB"],
    ],
  ],
  "Study Time Planner": [
    ["Available study hours", "3"],
    ["Subjects (comma separated)", "Math, Physics, History", "text"],
  ],
  "Marks Percentage Calculator": [
    ["Subject marks (obtained / total)", "80/100, 75/100, 42/50", "text"],
  ],
  "Attendance Calculator": [
    ["Total classes", "100"],
    ["Classes attended", "76"],
    ["Required attendance (%)", "80"],
  ],
  "Electricity Bill Estimator": [
    ["Units consumed", "250"],
    ["First slab limit (units)", "100"],
    ["First slab rate", "3"],
    ["Second slab limit (total units)", "200"],
    ["Second slab rate", "5"],
    ["Remaining slab rate", "8"],
  ],
  "Water Intake Calculator": [["Weight (kg)", "68"]],
  "Trip Cost Calculator": [
    ["One-way distance (km)", "120"],
    ["Mileage (km/L)", "15"],
    ["Fuel price per liter", "105"],
    ["People sharing cost", "3"],
  ],
};

function featuredValue(name, output) {
  // Keep the largest value short and scannable; the detailed age stays below.
  if (name === "Age") return `${output.match(/^\d+/)?.[0] ?? output} years`;
  // A study plan is the answer itself, so keep every scheduled subject visible.
  if (name === "Study Time Planner") return output;
  const lines = output.split("\n");
  let selected = lines[0] || output;
  if (["EMI", "Loan"].includes(name))
    selected =
      lines.find((line) => line.startsWith("Monthly payment:")) || selected;
  if (name === "GST")
    selected =
      lines.find((line) => line.startsWith("Total including GST:")) || selected;
  if (name === "Discount")
    selected = lines.find((line) => line.startsWith("Sale price:")) || selected;
  if (name === "Marks Percentage Calculator")
    selected = lines.find((line) => line.startsWith("Percentage:")) || selected;
  if (name === "Electricity Bill Estimator")
    selected =
      lines.find((line) => line.startsWith("Estimated energy charge:")) ||
      selected;
  if (name === "Trip Cost Calculator")
    selected =
      lines.find((line) => line.startsWith("Round-trip fuel cost:")) ||
      selected;
  return selected.replace(/^[^:=]+[:=]\s*/, "");
}

// Numeric tools use labeled fields, while the shared transform utilities keep text input.
export default function NumericTool({ name }) {
  const fieldConfig = configs[name] || [];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fieldConfig.map(([label, initial]) => [label, initial])),
  );
  const [subjects, setSubjects] = useState(["80/100", "75/100", "42/50"]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isMarks = name === "Marks Percentage Calculator";
  const isAge = name === "Age";
  const [activeField, setActiveField] = useState(
    fieldConfig.find(([, , type = "number"]) => type !== "select")?.[0] || "",
  );
  const [activeSubject, setActiveSubject] = useState(0);
  const [dateDigits, setDateDigits] = useState("");

  // Send each keypad press to the field the user last selected.
  function pressKey(key) {
    if (isAge && activeField === "Date of birth") {
      const next =
        key === "Clear"
          ? ""
          : key === "⌫"
            ? dateDigits.slice(0, -1)
            : /^\d$/.test(key)
              ? dateDigits.length === 8
                ? key
                : dateDigits.length < 8
                  ? dateDigits + key
                  : dateDigits
              : dateDigits;
      setDateDigits(next);
      setField(
        "Date of birth",
        next.length === 8
          ? `${next.slice(0, 4)}-${next.slice(4, 6)}-${next.slice(6, 8)}`
          : "",
      );
      return;
    }

    if (isMarks) {
      setSubjects((current) =>
        current.map((subject, index) => {
          if (index !== activeSubject) return subject;
          if (key === "Clear") return "";
          if (key === "⌫") return subject.slice(0, -1);
          return /^\d$/.test(key) || key === "." || key === "/"
            ? subject + key
            : subject;
        }),
      );
      return;
    }

    setValues((current) => {
      const existing = String(current[activeField] ?? "");
      let next = existing;
      if (key === "Clear") next = "";
      else if (key === "⌫") next = existing.slice(0, -1);
      else if (/^\d$/.test(key)) next = existing + key;
      else if (key === "." && !existing.includes("."))
        next = existing ? `${existing}.` : "0.";
      else if (key === "±")
        next = existing.startsWith("-") ? existing.slice(1) : `-${existing}`;
      return { ...current, [activeField]: next };
    });
  }

  async function calculate(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    let input;
    if (isMarks) input = subjects.filter(Boolean).join(", ");
    else if (name === "Study Time Planner")
      input = `${values["Available study hours"]}\n${values["Subjects (comma separated)"]}`;
    else if (name === "Electricity Bill Estimator")
      input = `${values["Units consumed"]}, ${values["First slab limit (units)"]}@${values["First slab rate"]}, ${values["Second slab limit (total units)"]}@${values["Second slab rate"]}, *@${values["Remaining slab rate"]}`;
    else input = fieldConfig.map(([label]) => values[label]).join(", ");
    try {
      setOutput(await runTool(name, input));
    } catch (issue) {
      setError(issue.message || "Check the values and try again.");
    } finally {
      setLoading(false);
    }
  }

  function setField(label, value) {
    setValues((current) => ({ ...current, [label]: value }));
  }
  function fillExample() {
    const example = exampleFor(name);
    if (name === "Age") {
      const sampleBirthDate = new Date();
      sampleBirthDate.setFullYear(sampleBirthDate.getFullYear() - 30);
      const sampleDate = sampleBirthDate.toISOString().slice(0, 10);
      setField("Date of birth", sampleDate);
      setDateDigits(sampleDate.replaceAll("-", ""));
      return;
    }
    if (isMarks) {
      setSubjects(example.split(", "));
      return;
    }
    if (name === "Study Time Planner") {
      const [hours, ...subjectsList] = example
        .split(/[\n,]+/)
        .map((part) => part.trim())
        .filter(Boolean);
      setValues({
        "Available study hours": hours,
        "Subjects (comma separated)": subjectsList.join(", "),
      });
      return;
    }
    if (name === "Electricity Bill Estimator") {
      setValues({
        "Units consumed": "250",
        "First slab limit (units)": "100",
        "First slab rate": "3",
        "Second slab limit (total units)": "200",
        "Second slab rate": "5",
        "Remaining slab rate": "8",
      });
      return;
    }
    const parts = example.split(/[\s,]+/);
    setValues(
      Object.fromEntries(
        fieldConfig.map(([label], index) => [label, parts[index] || ""]),
      ),
    );
  }

  return (
    <form className="numeric-tool" onSubmit={calculate}>
      {isMarks ? (
        <div className="numeric-subjects">
          <span className="numeric-label">Obtained / total marks</span>
          {subjects.map((mark, index) => (
            <label key={index}>
              Subject {index + 1}
              <input
                inputMode="decimal"
                value={mark}
                onFocus={() => setActiveSubject(index)}
                onChange={(event) =>
                  setSubjects((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
                onFocus={() => setActiveSubject(index)}
                placeholder="80/100"
              />
            </label>
          ))}
          <button
            type="button"
            className="secondary add-subject"
            onClick={() => {
              setActiveSubject(subjects.length);
              setSubjects((current) => [...current, ""]);
            }}
          >
            <Plus size={14} /> Add subject
          </button>
        </div>
      ) : (
        <div className="numeric-fields">
          {fieldConfig.map(([label, initial, type = "number", options]) => (
            <label key={label}>
              {label}
              {type === "select" ? (
                <select
                  value={values[label]}
                  onChange={(event) => setField(label, event.target.value)}
                >
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  type={type}
                  onFocus={() => {
                    if (type === "number" || type === "date")
                      setActiveField(label);
                  }}
                  onChange={(event) => {
                    setField(label, event.target.value);
                    if (type === "date")
                      setDateDigits(event.target.value.replaceAll("-", ""));
                  }}
                  inputMode={type === "number" ? "decimal" : undefined}
                  step={type === "number" ? "any" : undefined}
                  value={values[label] ?? initial}
                />
              )}
            </label>
          ))}
        </div>
      )}
      {output && (
        <section
          className="numeric-result"
          aria-label="Answer"
          aria-live="polite"
        >
          <output>{featuredValue(name, output)}</output>
        </section>
      )}
      {(isAge ||
        isMarks ||
        fieldConfig.some(([, , type = "number"]) => type === "number")) && (
        <section className="number-pad" aria-label="On-screen number pad">
          <div className="number-pad-title">
            <strong>Number pad</strong>
            <span>
              {isAge
                ? "Enter birth date as YYYYMMDD"
                : isMarks
                  ? `Entering marks for subject ${activeSubject + 1}`
                  : `Entering ${activeField}`}
            </span>
          </div>
          {isAge && dateDigits && (
            <output className="date-keypad-preview">
              {dateDigits.slice(0, 4)}
              {dateDigits.length > 4 ? `-${dateDigits.slice(4, 6)}` : ""}
              {dateDigits.length > 6 ? `-${dateDigits.slice(6, 8)}` : ""}
            </output>
          )}
          <div className="number-pad-grid">
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
              isAge ? "" : "±",
              "0",
              isAge ? "" : ".",
              isMarks ? "/" : "",
              "",
            ].map((key, index) =>
              key ? (
                <button
                  className={key === "Clear" ? "number-pad-clear" : ""}
                  key={`${key}-${index}`}
                  type="button"
                  aria-label={
                    key === "⌫"
                      ? "Backspace"
                      : key === "Clear"
                        ? "Clear input"
                        : `Enter ${key}`
                  }
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => pressKey(key)}
                >
                  {key}
                </button>
              ) : (
                <span key={`blank-${index}`} aria-hidden="true" />
              ),
            )}
          </div>
        </section>
      )}
      <div className="numeric-actions">
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Calculating…" : "Calculate"}
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => {
            setOutput("");
            setError("");
            setValues(
              Object.fromEntries(
                fieldConfig.map(([label, initial]) => [label, initial]),
              ),
            );
            setSubjects(["80/100", "75/100", "42/50"]);
            setDateDigits("");
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <button className="secondary" type="button" onClick={fillExample}>
          Example
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
