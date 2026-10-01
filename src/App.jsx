import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Command,
  Menu,
  MapPin,
  Moon,
  Palette,
  Search,
  Star,
  Sun,
  X,
} from "lucide-react";
import { allTools, groups } from "./data/registry";
import "./styles.css";
import "./palette.css";
import "./glass-console.css";

// The swatches below change the app's accent colors while keeping the page light.
const accentPalettes = [
  { id: "burgundy", name: "Burgundy", color: "#81283f" },
  { id: "blue", name: "Blue", color: "#1d4ed8" },
  { id: "red", name: "Red", color: "#c1121f" },
  { id: "green", name: "Green", color: "#137547" },
  { id: "purple", name: "Purple", color: "#6d28d9" },
  { id: "orange", name: "Orange", color: "#c2410c" },
  { id: "teal", name: "Teal", color: "#0f766e" },
  { id: "pink", name: "Pink", color: "#be185d" },
  { id: "indigo", name: "Indigo", color: "#4338ca" },
  { id: "cyan", name: "Cyan", color: "#0e7490" },
];

// The individual utility workspace loads only when someone opens a tool.
const ToolPage = lazy(() => import("./pages/ToolPage"));

// Keep unexpected component failures inside the app and provide a clear recovery action.
class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="wrap error-page">
          <p className="eyebrow">A SMALL DETOUR</p>
          <h1>That page ran into a problem.</h1>
          <p className="muted">
            Reload the app to continue. Your saved theme preference is kept.
          </p>
          <button className="primary" onClick={() => window.location.reload()}>
            Reload MultiTool
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const [dark, setDark] = useState(
    localStorage.getItem("multitool-theme") === "dark",
  );
  const [selectedAccent, setSelectedAccent] = useState(
    localStorage.getItem("multitool-accent") || "burgundy",
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the theme choice between visits and expose it to the CSS token system.
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("multitool-theme", dark ? "dark" : "light");
  }, [dark]);

  // Remember the chosen accent and let CSS recolor the whole interface.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = selectedAccent;
    localStorage.setItem("multitool-accent", selectedAccent);
  }, [selectedAccent]);

  // Command-K opens search; Escape closes it.
  useEffect(() => {
    function handleKeys(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
      if (event.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  const results = allTools
    .filter((tool) =>
      `${tool.name} ${tool.category} ${tool.keywords}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 9);

  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          <span className="brand-mark">M</span> MultiTool
        </Link>
        <LocationWeatherClock />
        <nav
          className={mobileMenuOpen ? "nav-links show" : "nav-links"}
          aria-label="Main navigation"
        >
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/tools" onClick={() => setMobileMenuOpen(false)}>
            Tools
          </Link>
          <Link to="/feedback" onClick={() => setMobileMenuOpen(false)}>
            Feedback
          </Link>
        </nav>
        <div className="nav-actions">
          <button
            className="nav-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Search all tools"
          >
            <Search size={16} />
            <span>Search tools</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="icon-btn"
            aria-label="Toggle color theme"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="palette-control">
            <button
              className="icon-btn palette-toggle"
              aria-label="Choose page accent color"
              aria-haspopup="dialog"
              aria-expanded={paletteOpen}
              aria-controls="accent-palette"
              onClick={() => setPaletteOpen((open) => !open)}
            >
              <Palette size={19} />
            </button>
            {paletteOpen && (
              <section
                className="palette-popover"
                id="accent-palette"
                role="dialog"
                aria-label="Choose a page color"
              >
                <strong>Choose a color</strong>
                <p>Set the page accent and use the white theme.</p>
                <div className="palette-options">
                  {accentPalettes.map((palette) => (
                    <button
                      key={palette.id}
                      className={`palette-swatch palette-${palette.id}`}
                      aria-label={`${palette.name} theme`}
                      aria-pressed={selectedAccent === palette.id}
                      title={palette.name}
                      onClick={() => {
                        setSelectedAccent(palette.id);
                        setDark(false);
                        setPaletteOpen(false);
                      }}
                    >
                      <span aria-hidden="true">
                        {selectedAccent === palette.id && <Check size={13} />}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <button
            className="icon-btn mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div key={location.pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route
            path="/tool/:slug"
            element={
              <Suspense fallback={<main className="wrap">Loading tool…</main>}>
                <ToolPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <main className="wrap">
                <h1>Page not found</h1>
                <Link to="/">Back home</Link>
              </main>
            }
          />
        </Routes>
      </div>

      <footer>
        <Link to="/" className="brand">
          <span className="brand-mark">M</span> MultiTool
        </Link>
        <span>
          Weather: Open-Meteo · Currency: Frankfurter · Time: World Time API
        </span>
        <Link to="/feedback">
          Share feedback <ArrowUpRight size={14} />
        </Link>
      </footer>

      {searchOpen && (
        <div
          className="overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSearchOpen(false)
          }
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search tools"
          >
            <div className="dialog-input">
              <Search size={19} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, categories, keywords…"
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
            <div className="results">
              {results.map((tool) => (
                <button
                  className="result"
                  key={tool.slug}
                  onClick={() => {
                    navigate(`/tool/${tool.slug}`);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="mini-icon">
                    <Command size={16} />
                  </span>
                  <span>
                    <b>{tool.name}</b>
                    <small>{tool.category}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {results.length === 0 && (
                <p className="empty">No tools found. Try another search.</p>
              )}
            </div>
            <div className="dialog-hint">
              Type to search <span>ESC to close</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

// Location permission is requested only after the user presses this control.
function LocationWeatherClock() {
  const [now, setNow] = useState(Date.now());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function findWeather() {
    if (!navigator.geolocation) {
      setWeatherError("Location is not available in this browser.");
      return;
    }
    setLoading(true);
    setWeatherError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            latitude: coords.latitude,
            longitude: coords.longitude,
            current: "temperature_2m,apparent_temperature,weather_code",
            timezone: "auto",
          });
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params}`,
          );
          if (!response.ok)
            throw new Error(
              "Weather service could not return conditions for this location.",
            );
          const data = await response.json();
          setWeather({ ...data.current, timezone: data.timezone });
        } catch (error) {
          setWeatherError(
            error.message || "Weather could not be loaded. Try again.",
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setWeatherError(
          error.code === 1
            ? "Allow location access in your browser to load local weather."
            : "Could not determine location. Try again.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
    );
  }

  const weatherText = weather
    ? {
        0: "Clear",
        1: "Mostly clear",
        2: "Partly cloudy",
        3: "Cloudy",
        45: "Fog",
        48: "Fog",
        51: "Drizzle",
        53: "Drizzle",
        55: "Drizzle",
        61: "Rain",
        63: "Rain",
        65: "Heavy rain",
        71: "Snow",
        73: "Snow",
        75: "Heavy snow",
        80: "Showers",
        81: "Showers",
        82: "Heavy showers",
        95: "Thunderstorm",
        96: "Thunderstorm",
        99: "Thunderstorm",
      }[weather.weather_code] || "Current conditions"
    : "Local weather";
  const weatherCode = weather?.weather_code;
  const weatherType = !weather
    ? "sunny"
    : [0, 1].includes(weatherCode)
      ? "sunny"
      : [2, 3].includes(weatherCode)
        ? "cloudy"
        : [45, 48].includes(weatherCode)
          ? "fog"
          : [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)
            ? "rain"
            : [71, 73, 75].includes(weatherCode)
              ? "snow"
              : "storm";
  const WeatherIcon = {
    sunny: CloudSun,
    cloudy: Cloud,
    fog: CloudFog,
    rain: CloudRain,
    snow: CloudSnow,
    storm: CloudLightning,
  }[weatherType];
  return (
    <div className="nav-local" aria-live="polite">
      <button
        className={`nav-weather weather-${weatherType}`}
        onClick={findWeather}
        title="Use your location to get local weather"
        aria-label={
          weather
            ? `${Math.round(weather.temperature_2m)} degrees, ${weatherText}. Refresh local weather`
            : "Use your location to get local weather"
        }
      >
        <WeatherIcon className="weather-animated-icon" size={19} />
        {loading ? (
          <span className="weather-loading">Finding weather…</span>
        ) : weather ? (
          <span className="weather-copy">
            <strong>{Math.round(weather.temperature_2m)}°</strong>
            <small>{weatherText}</small>
          </span>
        ) : (
          <span className="weather-copy">
            <strong>Local weather</strong>
            <small>Tap to check</small>
          </span>
        )}
        <MapPin size={12} />
      </button>
      <time className="nav-clock" dateTime={new Date(now).toISOString()}>
        {new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          ...(weather?.timezone ? { timeZone: weather.timezone } : {}),
        }).format(now)}
      </time>
      {weatherError && (
        <span className="weather-error" role="status">
          {weatherError}
        </span>
      )}
    </div>
  );
}

// The landing page introduces the library, links popular utilities, and shows a three-step example.
function HomePage() {
  const popular = [
    "Basic Calculator",
    "Temperature",
    "JSON Formatter",
    "Word Counter",
    "Color Picker",
    "Password Generator",
    "Scientific Calculator",
  ];
  const marks = ["＋", "↔", "{ }", "Aa", "◉", "✳", "✓"];
  return (
    <main className="wrap home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i /> THE EVERYDAY TOOLKIT
          </span>
          <h1>
            Make everyday work
            <br />
            <em>a little lighter.</em>
          </h1>
          <p>
            All the small tools you reach for, thoughtfully brought together.
            From quick calculations to developer utilities, text helpers, and
            career prep.
          </p>
          <Link className="primary explore" to="/tools">
            Explore all tools <ArrowUpRight size={16} />
          </Link>
          <div className="hero-meta">
            <span>
              <Check size={14} /> Free to use
            </span>
            <span>
              <Check size={14} /> Private by design
            </span>
            <span>
              <Check size={14} /> No sign-up
            </span>
          </div>
        </div>
        <div className="hero-art" aria-label="MultiTool library overview">
          <div className="art-top">
            <span>YOUR TOOLKIT</span>
            <span className="live-dot" />
          </div>
          <div className="art-stat">
            <small>TOOLS, ONE PLACE</small>
            <strong>
              60<span>+</span>
            </strong>
            <p>
              Little helpers for the
              <br />
              things you do every day.
            </p>
          </div>
          <div className="art-tags">
            <span>✳ Calculate</span>
            <span>⌘ Create</span>
            <span>↗ Convert</span>
          </div>
          <div className="art-bottom">
            <span>Designed for focus</span>
            <span>01 — 06</span>
          </div>
        </div>
      </section>

      <section className="popular section">
        <div className="section-head">
          <div>
            <p className="eyebrow">A GOOD PLACE TO START</p>
            <h2>Popular tools</h2>
          </div>
          <Link to="/tools">
            Browse everything <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="popular-grid">
          {popular.map((name, index) => {
            const tool = allTools.find((item) => item.name === name);
            return (
              <Link
                to={`/tool/${tool.slug}`}
                className="popular-item"
                key={name}
              >
                <span className={`pop-icon c${index}`}>{marks[index]}</span>
                <span>{name}</span>
                <ArrowUpRight size={13} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="how section">
        <div>
          <p className="eyebrow">SIMPLE BY DESIGN</p>
          <h2>
            Three steps.
            <br />
            <em>One less hassle.</em>
          </h2>
          <p className="muted">
            Pick a tool, get what you need, and get back to what matters.
          </p>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Pick your tool</h3>
            <p>
              Find JSON Formatter in Developer Tools or search from anywhere.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Add your input</h3>
            <p>
              Paste your unformatted JSON into the input area. Your data stays
              here.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Format &amp; move on</h3>
            <p>
              Click Format, review the clean output, then copy it with one
              click.
            </p>
          </article>
        </div>
      </section>
      <section className="bottom-cta">
        <span>YOUR NEXT SMALL WIN</span>
        <h2>Ready when you are.</h2>
        <Link to="/tools">
          Find your tool <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}

// The tool library and category drawer are built from the single central registry.
function ToolsPage() {
  const [category, setCategory] = useState("All tools");
  const [query, setQuery] = useState("");
  const [alphabetical, setAlphabetical] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  let tools = allTools.filter(
    (tool) =>
      (category === "All tools" || tool.category === category) &&
      `${tool.name} ${tool.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (alphabetical)
    tools = [...tools].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="wrap tools-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">GLASS CONSOLE · TOOL LIBRARY</p>
          <h1>
            Tools for <em>the everyday.</em>
          </h1>
          <p className="muted">Practical helpers, ready when you need them.</p>
        </div>
        <button
          className="secondary mobile-categories"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={16} /> Categories
        </button>
      </div>
      <div className="tools-layout">
        <aside className={drawerOpen ? "sidebar drawer-open" : "sidebar"}>
          <div className="side-title">
            CATEGORIES{" "}
            <button
              className="icon-btn drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close categories"
            >
              <X size={16} />
            </button>
          </div>
          {groups.map((group) => (
            <button
              key={group.name}
              onClick={() => {
                setCategory(group.name);
                setDrawerOpen(false);
              }}
              className={`category ${category === group.name ? "selected" : ""}`}
            >
              <group.icon size={16} />
              {group.name}
              <small>{group.tools.length}</small>
            </button>
          ))}
          <button
            onClick={() => {
              setCategory("All tools");
              setDrawerOpen(false);
            }}
            className={`category category-all ${category === "All tools" ? "selected" : ""}`}
          >
            <span>⌘</span>All tools<small>{allTools.length}</small>
          </button>
        </aside>
        {drawerOpen && (
          <div className="drawer-shade" onClick={() => setDrawerOpen(false)} />
        )}
        <section className="tool-list">
          <div className="list-head">
            <div>
              <h2>{category}</h2>
              <p>
                {category === "All tools"
                  ? "A little something for almost everything."
                  : groups.find((group) => group.name === category)
                      ?.description}
              </p>
            </div>
            <div className="list-controls">
              <label className="list-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter tools…"
                />
              </label>
              <button
                className={`sort-btn ${alphabetical ? "active" : ""}`}
                onClick={() => setAlphabetical(!alphabetical)}
                aria-pressed={alphabetical}
              >
                A–Z
              </button>
            </div>
          </div>
          {tools.length ? (
            <div className="tool-grid">
              {tools.map((tool, index) => (
                <Link
                  key={tool.slug}
                  to={`/tool/${tool.slug}`}
                  className="tool-card"
                >
                  <span className={`card-icon c${index % 7}`}>
                    <Command size={17} />
                  </span>
                  <span className="card-text">
                    <b>{tool.name}</b>
                    <small>{tool.description}</small>
                    <span className="card-category">{tool.category}</span>
                  </span>
                  <ArrowUpRight size={15} className="card-arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Search size={24} />
              <h3>No tools found</h3>
              <p>Try a different search or select another category.</p>
              <button className="secondary" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// Feedback is validated in the browser and explicitly reports that it is a demonstration only.
function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="wrap feedback-page">
      <p className="eyebrow">WE’RE LISTENING</p>
      <h1>
        Help us make it <em>better.</em>
      </h1>
      <p className="muted">
        A thoughtful note goes a long way. Tell us what’s working or what you’d
        like to see.
      </p>
      {submitted ? (
        <div className="success-box">
          <Check size={22} />
          <h2>Thanks for sharing.</h2>
          <p>
            Your feedback has been received in this demo. Nothing was sent or
            stored.
          </p>
          <button className="secondary" onClick={() => setSubmitted(false)}>
            Send another
          </button>
        </div>
      ) : (
        <form
          className="feedback-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="form-row">
            <label>
              Name
              <input required placeholder="Your name" />
            </label>
            <label>
              Email
              <input required type="email" placeholder="you@example.com" />
            </label>
          </div>
          <label>
            Feedback type
            <select>
              <option>General feedback</option>
              <option>Bug report</option>
              <option>Feature request</option>
            </select>
          </label>
          <fieldset>
            <legend>How’s your experience so far?</legend>
            <div className="ratings">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating}>
                  <input type="radio" name="rating" value={rating} required />
                  <span>
                    <Star size={15} fill="currentColor" />
                    {rating}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Your message
            <textarea
              required
              minLength="12"
              placeholder="Share as much or as little as you like…"
            />
          </label>
          <button className="primary" type="submit">
            Send feedback <ArrowUpRight size={16} />
          </button>
          <p className="form-note">
            Demo form only. Your message stays in this browser session.
          </p>
        </form>
      )}
    </main>
  );
}

export default function Root() {
  return (
    <AppErrorBoundary>
  <HashRouter>
    <AppShell />
  </HashRouter>
</AppErrorBoundary>
  );
}
