import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import "./ColorPicker.css";

// Native color input gives a real visual picker while keeping conversion local.
export default function ColorPicker() {
  const [color, setColor] = useState("#81283f");
  const [copied, setCopied] = useState(false);
  const [r, g, b] = color
    .slice(1)
    .match(/.{2}/g)
    .map((value) => parseInt(value, 16));
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  const light = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * light - 1));
    if (max === rr) hue = ((gg - bb) / delta) % 6;
    else if (max === gg) hue = (bb - rr) / delta + 2;
    else hue = (rr - gg) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  async function copy(value) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }
  return (
    <section className="color-picker-tool">
      <label className="color-wheel-label">
        Choose a color
        <input
          aria-label="Choose color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>
      <div className="color-values">
        {[
          ["HEX", color.toUpperCase()],
          ["RGB", `rgb(${r}, ${g}, ${b})`],
          [
            "HSL",
            `hsl(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(light * 100)}%)`,
          ],
        ].map(([label, value]) => (
          <button key={label} onClick={() => copy(value)}>
            <span>{label}</span>
            <code>{value}</code>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        ))}
      </div>
    </section>
  );
}
