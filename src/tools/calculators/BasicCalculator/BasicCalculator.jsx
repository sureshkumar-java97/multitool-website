import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import "./BasicCalculator.css";

const keys = [
  "AC",
  "±",
  "%",
  "÷",
  "7",
  "8",
  "9",
  "×",
  "4",
  "5",
  "6",
  "−",
  "1",
  "2",
  "3",
  "+",
  "0",
  ".",
  "⌫",
  "=",
];
const operators = { "÷": "/", "×": "*", "−": "-", "+": "+" };

// A small four-function calculator with chained arithmetic and keyboard support.
export default function BasicCalculator() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [pendingOperator, setPendingOperator] = useState(null);
  const [startNewNumber, setStartNewNumber] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  function enterDigit(digit) {
    setDisplay((current) =>
      startNewNumber
        ? digit === "."
          ? "0."
          : digit
        : digit === "." && current.includes(".")
          ? current
          : current === "0" && digit !== "."
            ? digit
            : current + digit,
    );
    setStartNewNumber(false);
  }

  function calculate(left, operator, right) {
    if (operator === "+") return left + right;
    if (operator === "-") return left - right;
    if (operator === "*") return left * right;
    if (operator === "/") {
      if (right === 0) throw new Error("Cannot divide by zero.");
      return left / right;
    }
    return right;
  }

  function press(key) {
    if (/^\d$/.test(key) || key === ".") {
      enterDigit(key);
      return;
    }
    if (key === "AC") {
      setDisplay("0");
      setStoredValue(null);
      setPendingOperator(null);
      setStartNewNumber(true);
      return;
    }
    if (key === "⌫") {
      setDisplay((current) =>
        current.length > 1 ? current.slice(0, -1) : "0",
      );
      setStartNewNumber(false);
      return;
    }
    if (key === "±") {
      setDisplay((current) =>
        current === "0" ? current : String(-Number(current)),
      );
      return;
    }
    if (key === "%") {
      setDisplay((current) => String(Number(current) / 100));
      setStartNewNumber(true);
      return;
    }
    if (key === "=") {
      if (pendingOperator && storedValue !== null) {
        try {
          const left = storedValue;
          const right = Number(display);
          const value = calculate(left, pendingOperator, right);
          const formatted = Number(value.toPrecision(12)).toString();
          setHistory((items) =>
            [
              `${left} ${pendingOperator} ${right} = ${formatted}`,
              ...items,
            ].slice(0, 8),
          );
          setDisplay(formatted);
          setStoredValue(null);
          setPendingOperator(null);
          setStartNewNumber(true);
        } catch (error) {
          setDisplay(error.message);
          setStoredValue(null);
          setPendingOperator(null);
          setStartNewNumber(true);
        }
      }
      return;
    }
    if (operators[key]) {
      const current = Number(display);
      if (pendingOperator && storedValue !== null && !startNewNumber) {
        try {
          setStoredValue(calculate(storedValue, pendingOperator, current));
        } catch {
          setStoredValue(current);
        }
      } else setStoredValue(current);
      setPendingOperator(operators[key]);
      setStartNewNumber(true);
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const keysBySymbol = {
        Enter: "=",
        "=": "=",
        Backspace: "⌫",
        Escape: "AC",
        "/": "÷",
        "*": "×",
        "-": "−",
        "+": "+",
        "%": "%",
      };
      const key = keysBySymbol[event.key] || event.key;
      if (
        /^\d$/.test(key) ||
        [".", "AC", "⌫", "±", "%", "÷", "×", "−", "+", "="].includes(key)
      ) {
        event.preventDefault();
        press(key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <section className="basic-calculator" aria-label="Basic calculator">
      <div className="basic-display">
        <button
          className="basic-history-toggle"
          aria-label="Show calculation history"
          onClick={() => setShowHistory((open) => !open)}
        >
          <History size={21} />
        </button>
        {pendingOperator && (
          <span className="basic-operation">
            {storedValue} {pendingOperator}
          </span>
        )}
        <output aria-live="polite">{display}</output>
        {showHistory && (
          <div className="basic-history">
            {history.length ? (
              history.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  onClick={() => {
                    setDisplay(item.split(" = ").at(-1));
                    setShowHistory(false);
                  }}
                >
                  {item}
                </button>
              ))
            ) : (
              <span>Completed calculations will appear here.</span>
            )}
          </div>
        )}
      </div>
      <div className="basic-keypad">
        {keys.map((key) => (
          <button
            key={key}
            className={`basic-key ${key === "=" ? "basic-equals" : operators[key] ? "basic-operator" : ["AC", "±", "%", "⌫"].includes(key) ? "basic-function" : ""} ${key === "0" ? "basic-zero" : ""}`}
            onClick={() => press(key)}
            aria-label={
              key === "⌫" ? "Backspace" : key === "=" ? "Calculate" : key
            }
          >
            {key}
          </button>
        ))}
      </div>
      <p className="basic-help">
        Everyday addition, subtraction, multiplication, and division. Keyboard
        input supported.
      </p>
    </section>
  );
}
