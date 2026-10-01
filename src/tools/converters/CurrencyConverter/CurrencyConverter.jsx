import React, { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { runTool } from "../../../utils/toolLogic";
import "./CurrencyConverter.css";

const common = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "SGD",
];

// Show only the converted amount as the answer, without exposing rate details.
function answerOnly(resultText) {
  const firstLine = resultText.split("\n")[0] || resultText;
  return firstLine.includes("=")
    ? firstLine.split("=").at(-1).trim()
    : firstLine;
}

// Load supported currency codes, then ask Frankfurter for the latest published reference rate.
export default function CurrencyConverter() {
  const [currencies, setCurrencies] = useState(
    common.map((code) => ({ iso_code: code, name: code })),
  );
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://api.frankfurter.dev/v2/currencies", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load currency list.");
        return response.json();
      })
      .then((items) => setCurrencies(items))
      .catch((issue) => {
        if (issue.name !== "AbortError")
          setError(
            "Currency list could not load. Common currencies remain available.",
          );
      });
    return () => controller.abort();
  }, []);

  async function convert() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      setResult(await runTool("Currency", `${amount}, ${from}, ${to}`));
    } catch (issue) {
      setError(issue.message || "Could not retrieve a rate. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  const options = currencies.map((currency) => (
    <option key={currency.iso_code} value={currency.iso_code}>
      {currency.iso_code} · {currency.name}
    </option>
  ));
  return (
    <section className="currency-tool">
      <div className="currency-fields">
        <label>
          Amount
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          From
          <select
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          >
            {options}
          </select>
        </label>
        <button
          className="currency-swap"
          aria-label="Swap currencies"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <ArrowLeftRight size={17} />
        </button>
        <label>
          To
          <select value={to} onChange={(event) => setTo(event.target.value)}>
            {options}
          </select>
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section
          className="currency-answer"
          aria-label="Answer"
          aria-live="polite"
        >
          <output>{answerOnly(result)}</output>
        </section>
      )}
      <section className="currency-pad" aria-label="Amount number pad">
        <div className="currency-pad-heading">
          <strong>Number pad</strong>
          <span>Enter conversion amount</span>
        </div>
        <div className="currency-pad-grid">
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
            ".",
            "",
            "",
          ].map((key, index) =>
            key ? (
              <button
                type="button"
                className={key === "Clear" ? "currency-pad-clear" : ""}
                key={`${key}-${index}`}
                aria-label={
                  key === "⌫"
                    ? "Backspace"
                    : key === "Clear"
                      ? "Clear amount"
                      : `Enter ${key}`
                }
                onClick={() => {
                  if (key === "Clear") setAmount("");
                  else if (key === "⌫")
                    setAmount((current) => current.slice(0, -1));
                  else if (/^\d$/.test(key))
                    setAmount((current) => current + key);
                  else if (key === ".")
                    setAmount((current) =>
                      current.includes(".")
                        ? current
                        : current
                          ? `${current}.`
                          : "0.",
                    );
                }}
              >
                {key}
              </button>
            ) : (
              <span key={`empty-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </section>
      <button
        className="primary"
        disabled={loading || !amount}
        onClick={convert}
      >
        {loading ? "Fetching latest rate…" : "Convert currency"}
      </button>
      <p className="currency-note">
        Latest published reference rates from Frankfurter. These are not live
        trading quotes and may update once per business day.
      </p>
    </section>
  );
}
