import React, { useRef, useState } from "react";
import { Copy, Send } from "lucide-react";
import { runTool } from "../../../utils/toolLogic";
import "./APIRequestBuilder.css";

// Lets users configure an HTTP request explicitly and displays the server response.
export default function APIRequestBuilder() {
  const [url, setUrl] = useState("https://api.github.com/repos/facebook/react");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState(
    '{\n  "Accept": "application/vnd.github+json"\n}',
  );
  const [params, setParams] = useState("{}");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const controller = useRef(null);

  async function send(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");
    controller.current?.abort();
    controller.current = new AbortController();
    try {
      const config = {
        url,
        method,
        headers: JSON.parse(headers || "{}"),
        params: JSON.parse(params || "{}"),
      };
      if (body.trim()) config.body = JSON.parse(body);
      setResponse(
        await runTool(
          "API Request Builder",
          JSON.stringify(config),
          controller.current.signal,
        ),
      );
    } catch (issue) {
      if (issue.name !== "AbortError")
        setError(issue.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="api-builder" onSubmit={send}>
      <label>
        Request URL
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://api.example.com/items"
        />
      </label>
      <div className="api-form-row">
        <label>
          Method
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Query parameters (JSON)
          <textarea
            value={params}
            onChange={(event) => setParams(event.target.value)}
            rows="3"
          />
        </label>
      </div>
      <div className="api-form-row">
        <label>
          Headers (JSON)
          <textarea
            value={headers}
            onChange={(event) => setHeaders(event.target.value)}
            rows="4"
          />
        </label>
        <label>
          JSON body (optional)
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows="4"
            placeholder={'{\n  "name": "example"\n}'}
          />
        </label>
      </div>
      <p className="api-notice">
        This sends your configured request to the destination URL. Cross-origin
        browser rules may prevent some servers from responding.
      </p>
      <button className="primary" type="submit" disabled={loading}>
        <Send size={15} />
        {loading ? "Sending request…" : "Send request"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {response && (
        <div className="api-response">
          <div>
            <b>Response</b>
            <button
              type="button"
              className="icon-btn"
              aria-label="Copy response"
              onClick={() => navigator.clipboard.writeText(response)}
            >
              <Copy size={16} />
            </button>
          </div>
          <pre>{response}</pre>
        </div>
      )}
    </form>
  );
}
