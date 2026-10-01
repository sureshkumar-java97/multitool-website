import React, { useCallback, useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import "./Calculator.css";

// Converts typed or clicked math into tokens. No JavaScript eval is used.
function tokenize(source) {
  const clean = source
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−]/g, "-");
  const tokens =
    clean.match(
      /(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-zA-Z]+|[()+\-*/^%!]/g,
    ) || [];
  if (tokens.join("") !== clean.replace(/\s/g, ""))
    throw new Error("Check the expression and try again.");
  return tokens;
}

// Recursive-descent parser supports arithmetic, functions, constants, and postfix operators.
function evaluateMath(source, degrees, answer) {
  const tokens = tokenize(source.replace(/\bAns\b/g, String(answer)));
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const toRadians = (value) => (degrees ? (value * Math.PI) / 180 : value);
  const fromRadians = (value) => (degrees ? (value * 180) / Math.PI : value);
  const factorial = (value) => {
    if (!Number.isInteger(value) || value < 0 || value > 170)
      throw new Error("Factorial needs a whole number from 0 to 170.");
    let product = 1;
    for (let n = 2; n <= value; n += 1) product *= n;
    return product;
  };

  function expression() {
    let value = term();
    while (peek() === "+" || peek() === "-") {
      const operator = take();
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  function term() {
    let value = unary();
    while (["*", "/"].includes(peek())) {
      const operator = take();
      const right = unary();
      if (operator === "/" && right === 0)
        throw new Error("Cannot divide by zero.");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function unary() {
    if (peek() === "+") {
      take();
      return unary();
    }
    if (peek() === "-") {
      take();
      return -unary();
    }
    return power();
  }

  function power() {
    let value = postfix();
    if (peek() === "^") {
      take();
      value = value ** unary();
    }
    return value;
  }

  function postfix() {
    let value = primary();
    while (peek() === "!" || peek() === "%") {
      const operator = take();
      value = operator === "!" ? factorial(value) : value / 100;
    }
    return value;
  }

  function primary() {
    const token = take();
    if (token === "(") {
      const value = expression();
      if (take() !== ")") throw new Error("Add a closing parenthesis.");
      return value;
    }
    if (token === "pi") return Math.PI;
    if (token === "e") return Math.E;
    if (!Number.isNaN(Number(token)) && token !== undefined)
      return Number(token);
    if (/^[a-z]+$/i.test(token || "")) {
      if (take() !== "(")
        throw new Error(`Add an opening parenthesis after ${token}.`);
      const value = expression();
      if (take() !== ")") throw new Error("Add a closing parenthesis.");
      const functions = {
        sin: (x) => Math.sin(toRadians(x)),
        cos: (x) => Math.cos(toRadians(x)),
        tan: (x) => Math.tan(toRadians(x)),
        asin: (x) => fromRadians(Math.asin(x)),
        acos: (x) => fromRadians(Math.acos(x)),
        atan: (x) => fromRadians(Math.atan(x)),
        ln: Math.log,
        log: Math.log10,
        sqrt: Math.sqrt,
        abs: Math.abs,
        exp: Math.exp,
      };
      if (!functions[token]) throw new Error(`Unknown function: ${token}.`);
      const result = functions[token](value);
      if (Number.isNaN(result))
        throw new Error("That operation is outside the real-number range.");
      return result;
    }
    throw new Error("Enter a number or a supported math function.");
  }

  if (!tokens.length) throw new Error("Enter a calculation first.");
  const result = expression();
  if (position !== tokens.length)
    throw new Error("Check the expression near the end.");
  if (!Number.isFinite(result))
    throw new Error("The result is outside the supported range.");
  return result;
}

const rows = [
  ["Inv", "sin", "ln", "7", "8", "9", "÷"],
  ["π", "cos", "log", "4", "5", "6", "×"],
  ["e", "tan", "√", "1", "2", "3", "−"],
  ["Ans", "EXP", "xʸ", "0", ".", "=", "+"],
];

function formatNumber(value) {
  if (Object.is(value, -0)) return "0";
  return Number(value.toPrecision(12)).toString();
}

export default function ScientificCalculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [answer, setAnswer] = useState(0);
  const [degrees, setDegrees] = useState(true);
  const [inverse, setInverse] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const calculate = useCallback(() => {
    try {
      const value = evaluateMath(expression, degrees, answer);
      const formatted = formatNumber(value);
      setResult(formatted);
      setAnswer(value);
      setHistory((items) =>
        [{ expression, result: formatted }, ...items].slice(0, 8),
      );
      setError("");
      setExpression(formatted);
    } catch (issue) {
      setError(issue.message);
    }
  }, [answer, degrees, expression]);

  // Keyboard support mirrors the on-screen calculator buttons.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (/^[0-9.]$/.test(event.key)) {
        setExpression((value) => value + event.key);
        setError("");
      } else if (
        ["+", "-", "*", "/", "^", "(", ")", "%", "!"].includes(event.key)
      ) {
        setExpression((value) => value + event.key);
        setError("");
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
      } else if (event.key === "Backspace") {
        setExpression((value) => value.slice(0, -1));
        setError("");
      } else if (event.key === "Escape") {
        setExpression("");
        setResult("0");
        setError("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [calculate]);

  function append(value) {
    setError("");
    setExpression((current) => current + value);
  }

  function press(label) {
    if (label === "Inv") {
      setInverse((value) => !value);
      return;
    }
    if (label === "=") {
      calculate();
      return;
    }
    if (label === "AC") {
      setExpression("");
      setResult("0");
      setError("");
      return;
    }
    if (label === "Ans") {
      append("Ans");
      return;
    }
    if (label === "π") {
      append("pi");
      return;
    }
    if (label === "√") {
      append("sqrt(");
      return;
    }
    if (label === "xʸ") {
      append("^");
      return;
    }
    if (label === "EXP") {
      append("*10^");
      return;
    }
    if (label === "x!") {
      append("!");
      return;
    }
    if (["sin", "cos", "tan", "ln", "log"].includes(label)) {
      const fn =
        inverse && ["sin", "cos", "tan"].includes(label) ? `a${label}` : label;
      append(`${fn}(`);
      setInverse(false);
      return;
    }
    const symbols = { "×": "*", "÷": "/", "−": "-" };
    append(symbols[label] || label);
  }

  return (
    <section className="calculator" aria-label="Scientific calculator">
      <div className="calculator-display">
        <button
          className="history-toggle"
          aria-label="Show calculation history"
          onClick={() => setShowHistory((open) => !open)}
        >
          <History size={22} />
        </button>
        <div className="display-expression" aria-live="polite">
          {expression || " "}
        </div>
        <output className="display-result" aria-live="polite">
          {result}
        </output>
        {error && (
          <p className="calculator-error" role="alert">
            {error}
          </p>
        )}
        {showHistory && (
          <div className="calculator-history">
            {history.length ? (
              history.map((item, index) => (
                <button
                  key={`${item.expression}-${index}`}
                  onClick={() => {
                    setExpression(item.expression);
                    setResult(item.result);
                    setShowHistory(false);
                  }}
                >
                  {item.expression} = <strong>{item.result}</strong>
                </button>
              ))
            ) : (
              <span>Your recent calculations will appear here.</span>
            )}
          </div>
        )}
      </div>
      <div className="calculator-keys">
        <div className="calculator-key-row">
          <div className="angle-toggle" aria-label="Angle unit">
            <button
              className={degrees ? "active" : ""}
              onClick={() => setDegrees(true)}
            >
              Deg
            </button>
            <span />
            <button
              className={!degrees ? "active" : ""}
              onClick={() => setDegrees(false)}
            >
              Rad
            </button>
          </div>
          {["x!", "(", ")", "%", "AC"].map((key) => (
            <button
              key={key}
              className="calc-key function-key"
              onClick={() => press(key)}
            >
              {key}
            </button>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div className="calculator-key-row" key={rowIndex}>
            {row.map((key) => {
              const shown =
                inverse && ["sin", "cos", "tan"].includes(key)
                  ? `${key}⁻¹`
                  : key;
              const type =
                key === "="
                  ? "equals-key"
                  : ["÷", "×", "−", "+"].includes(key)
                    ? "operator-key"
                    : Number.isFinite(Number(key)) || key === "."
                      ? "number-key"
                      : "function-key";
              return (
                <button
                  key={key}
                  className={`calc-key ${type}`}
                  onClick={() => press(key)}
                  aria-label={key === "=" ? "Calculate" : shown}
                >
                  {shown}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="calculator-help">
        Type on your keyboard or select a key.{" "}
        {degrees ? "Angles are in degrees." : "Angles are in radians."}
      </p>
    </section>
  );
}
