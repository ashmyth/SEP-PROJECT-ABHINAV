const { useState, useEffect, useRef, useMemo } = React;
const { createRoot } = ReactDOM;
const { motion, AnimatePresence } = Motion;

const h = React.createElement;

// ---------------------------------------------------------------------------
// Audio Chime (Web Audio API Synthesizer - zero external asset dependencies)
// ---------------------------------------------------------------------------
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(587.33, now, 0.15);        // D5
    playTone(880.0, now + 0.12, 0.18);   // A5
    playTone(1174.66, now + 0.24, 0.35); // D6
  } catch (e) {
    // Audio Context might be restricted before interaction
  }
}

// ---------------------------------------------------------------------------
// API Layer
// ---------------------------------------------------------------------------
function getCookie(name) {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

const CSRF = () => getCookie("csrftoken");

async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", ...opts });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

const apiGet = (p) => api(p, { method: "GET" });
const apiPost = (p, body) =>
  api(p, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRFToken": CSRF() },
    body: JSON.stringify(body),
  });
const apiPut = (p, body) =>
  api(p, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-CSRFToken": CSRF() },
    body: JSON.stringify(body),
  });
const apiDelete = (p) =>
  api(p, { method: "DELETE", headers: { "X-CSRFToken": CSRF() } });

// ---------------------------------------------------------------------------
// Helpers & Motion Presets
// ---------------------------------------------------------------------------
const cx = (...c) => c.filter(Boolean).join(" ");
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

function uniqueId() {
  return "row_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function calculate1RM(weight, reps) {
  if (!weight || weight <= 0) return 0;
  if (reps <= 1) return weight;
  // Epley formula: weight * (1 + reps / 30)
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function formatDate(iso) {
  if (!iso) return "Today";
  try {
    const parts = iso.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch (e) {}
  return iso;
}

function convertWeight(kg, unit) {
  if (unit === "lbs") {
    return Math.round(kg * 2.20462 * 10) / 10;
  }
  return Math.round(kg * 10) / 10;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const Icon = {
  Dumbbell: (props) =>
    h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "m6.5 6.5 11 11" }),
      h("path", { d: "m21 21-1-1a2 2 0 0 0-2.83 0l-2.17 2.17a2 2 0 0 1-2.83 0L3 13a2 2 0 0 1 0-2.83L5.17 8a2 2 0 0 0 0-2.83L4.17 4.17a2 2 0 0 1 0-2.83l.66-.66a2 2 0 0 1 2.83 0l1 1a2 2 0 0 0 2.83 0l2.17-2.17a2 2 0 0 1 2.83 0L21 8a2 2 0 0 1 0 2.83l-2.17 2.17a2 2 0 0 0 0 2.83l1 1a2 2 0 0 1 0 2.83l-.66.66a2 2 0 0 1-2.83 0Z" })
    ),
  Flame: (props) =>
    h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" })
    ),
  Trophy: (props) =>
    h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }),
      h("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }),
      h("path", { d: "M4 22h16" }),
      h("path", { d: "M10 14.66V17c0 .55-.45 1-1 1H7" }),
      h("path", { d: "M14 14.66V17c0 .55.45 1 1 1h2" }),
      h("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" })
    ),
  Plus: (props) =>
    h(
      "svg",
      { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("line", { x1: 12, y1: 5, x2: 12, y2: 19 }),
      h("line", { x1: 5, y1: 12, x2: 19, y2: 12 })
    ),
  Trash: (props) =>
    h(
      "svg",
      { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "M3 6h18" }),
      h("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
      h("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
    ),
  Copy: (props) =>
    h(
      "svg",
      { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("rect", { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }),
      h("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
    ),
  Timer: (props) =>
    h(
      "svg",
      { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("line", { x1: 10, x2: 14, y1: 2, y2: 2 }),
      h("line", { x1: 12, x2: 15, y1: 14, y2: 11 }),
      h("circle", { cx: 12, cy: 14, r: 8 })
    ),
  Search: (props) =>
    h(
      "svg",
      { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("circle", { cx: 11, cy: 11, r: 8 }),
      h("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
    ),
  Edit: (props) =>
    h(
      "svg",
      { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }),
      h("path", { d: "m15 5 4 4" })
    ),
  Check: (props) =>
    h(
      "svg",
      { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("polyline", { points: "20 6 9 17 4 12" })
    ),
  Sparkles: (props) =>
    h(
      "svg",
      { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" }),
      h("path", { d: "M5 3v4" }),
      h("path", { d: "M19 17v4" }),
      h("path", { d: "M3 5h4" }),
      h("path", { d: "M17 19h4" })
    ),
  LogOut: (props) =>
    h(
      "svg",
      { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      h("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
      h("polyline", { points: "16 17 21 12 16 7" }),
      h("line", { x1: 21, x2: 9, y1: 12, y2: 12 })
    ),
};

// ---------------------------------------------------------------------------
// Workout Routine Templates Preset Data
// ---------------------------------------------------------------------------
const WORKOUT_TEMPLATES = [
  {
    id: "push",
    name: "Push Day (Chest, Shoulders, Triceps)",
    badge: "Hypertrophy",
    color: "from-orange-500/20 to-emerald-500/10 border-orange-500/30",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 8, weight: 80 },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: 26 },
      { name: "Standing Overhead Press", sets: 3, reps: 8, weight: 50 },
      { name: "Cable Lateral Raises", sets: 4, reps: 15, weight: 12 },
      { name: "Tricep Rope Pushdowns", sets: 3, reps: 12, weight: 30 },
    ],
  },
  {
    id: "pull",
    name: "Pull Day (Back, Lats, Biceps)",
    badge: "Strength",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    exercises: [
      { name: "Conventional Deadlift", sets: 4, reps: 5, weight: 140 },
      { name: "Bent Over Barbell Row", sets: 4, reps: 8, weight: 75 },
      { name: "Lat Pulldown (Wide Grip)", sets: 3, reps: 10, weight: 65 },
      { name: "Face Pulls", sets: 4, reps: 15, weight: 25 },
      { name: "Incline DB Bicep Curls", sets: 3, reps: 12, weight: 16 },
    ],
  },
  {
    id: "legs",
    name: "Leg Day (Quads, Hamstrings, Calves)",
    badge: "Heavy Power",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: 6, weight: 110 },
      { name: "Romanian Deadlift (RDL)", sets: 3, reps: 8, weight: 95 },
      { name: "Leg Press 45°", sets: 3, reps: 12, weight: 180 },
      { name: "Seated Hamstring Curls", sets: 3, reps: 12, weight: 45 },
      { name: "Standing Calf Raises", sets: 4, reps: 15, weight: 60 },
    ],
  },
  {
    id: "upper",
    name: "Upper Body Power",
    badge: "Athletic",
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    exercises: [
      { name: "Incline Barbell Bench", sets: 4, reps: 6, weight: 75 },
      { name: "Weighted Pull-Ups", sets: 3, reps: 6, weight: 15 },
      { name: "Seated Dumbbell Shoulder Press", sets: 3, reps: 8, weight: 28 },
      { name: "Chest Supported Row", sets: 3, reps: 10, weight: 55 },
      { name: "Dips", sets: 3, reps: 12, weight: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Base UI Components
// ---------------------------------------------------------------------------
function Button(props) {
  const { variant = "primary", size = "md", className = "", children, ...rest } = props;
  const base =
    "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

  const sizes = {
    sm: "px-2.5 py-1 text-xs rounded-md gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
  };

  const variants = {
    primary:
      "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20",
    accent:
      "bg-orange-500 text-white hover:bg-orange-400 font-bold shadow-lg shadow-orange-500/20",
    ghost:
      "bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white",
    danger:
      "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white",
    subtle:
      "text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-md",
  };

  return h(
    motion.button,
    {
      type: "button",
      className: cx(base, sizes[size], variants[variant], className),
      ...rest,
    },
    children
  );
}

function TextInput(props) {
  const { error, className = "", ...rest } = props;
  const cls = cx(
    "w-full rounded-lg border bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus:border-emerald-500 transition-all tnum",
    error ? "border-rose-500" : "border-slate-700/80",
    className
  );
  return h("input", { className: cls, ...rest });
}

// ---------------------------------------------------------------------------
// Status Notification Banner
// ---------------------------------------------------------------------------
function StatusBanner({ message, onClose }) {
  if (!message) return null;
  const isErr = message.type === "error";

  return h(
    AnimatePresence,
    null,
    h(
      motion.div,
      {
        initial: { opacity: 0, y: -20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.25, ease: EASE_OUT_EXPO },
        className: cx(
          "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md",
          isErr
            ? "bg-rose-950/80 text-rose-200 border-rose-500/40"
            : "bg-emerald-950/80 text-emerald-200 border-emerald-500/40"
        ),
      },
      h(isErr ? Icon.Trash : Icon.Check, { className: isErr ? "text-rose-400" : "text-emerald-400" }),
      h("span", null, message.text),
      h(
        "button",
        {
          onClick: onClose,
          className: "ml-2 text-slate-400 hover:text-white",
          "aria-label": "Close",
        },
        "✕"
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Rest Timer Widget (Gym Lifter Utility)
// ---------------------------------------------------------------------------
function RestTimerWidget({ timerState, setTimerState }) {
  const { active, secondsLeft, totalSeconds, isRunning } = timerState;

  useEffect(() => {
    let interval = null;
    if (active && isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setTimerState((prev) => {
          if (prev.secondsLeft <= 1) {
            playChime();
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.9 } });
            return { ...prev, secondsLeft: 0, isRunning: false, active: false };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [active, isRunning, secondsLeft]);

  if (!active && secondsLeft === 0) return null;

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return h(
    motion.div,
    {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
      className:
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl",
    },
    h(
      "div",
      { className: "flex items-center gap-3" },
      h(
        "div",
        { className: "relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400" },
        h(Icon.Timer, { className: isRunning ? "animate-spin" : "" })
      ),
      h(
        "div",
        null,
        h("div", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400" }, "Rest Timer"),
        h("div", { className: "text-lg font-black tracking-tight text-white tnum" }, timeFormatted)
      )
    ),
    h(
      "div",
      { className: "flex items-center gap-1.5" },
      h(
        Button,
        {
          size: "sm",
          variant: isRunning ? "ghost" : "primary",
          onClick: () => setTimerState((prev) => ({ ...prev, isRunning: !prev.isRunning })),
        },
        isRunning ? "Pause" : "Resume"
      ),
      h(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: () => setTimerState((prev) => ({ ...prev, secondsLeft: prev.secondsLeft + 30, totalSeconds: prev.totalSeconds + 30 })),
        },
        "+30s"
      ),
      h(
        "button",
        {
          onClick: () => setTimerState({ active: false, secondsLeft: 0, totalSeconds: 0, isRunning: false }),
          className: "p-1.5 text-slate-500 hover:text-rose-400 transition-colors",
          "aria-label": "Dismiss timer",
        },
        "✕"
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Top Navigation Bar
// ---------------------------------------------------------------------------
function TopBar({ user, stats, unit, onToggleUnit, onLogout, onStartTimer }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return h(
    "header",
    { className: "sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md" },
    h(
      "div",
      { className: "mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6" },
      h(
        "div",
        { className: "flex items-center gap-3.5" },
        h(
          "div",
          { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20 text-slate-950" },
          h(Icon.Dumbbell, { className: "stroke-[2.5]" })
        ),
        h(
          "div",
          null,
          h(
            "div",
            { className: "flex items-center gap-2" },
            h("span", { className: "font-athletic text-2xl font-black tracking-wider text-white" }, "WOD LOG"),
            h("span", { className: "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20" }, "PRO")
          ),
          h("div", { className: "hidden text-xs text-slate-400 sm:block" }, todayStr)
        )
      ),
      h(
        "div",
        { className: "flex items-center gap-2.5 sm:gap-4" },
        // Quick Timer Launcher Buttons
        h(
          "div",
          { className: "hidden items-center gap-1 sm:flex rounded-lg bg-slate-900 border border-slate-800 p-1" },
          h("span", { className: "px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500" }, "Rest:"),
          [60, 90, 120].map((s) =>
            h(
              "button",
              {
                key: s,
                onClick: () => onStartTimer(s),
                className: "rounded px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors",
              },
              `${s}s`
            )
          )
        ),
        // Unit switcher
        h(
          "button",
          {
            onClick: onToggleUnit,
            className: "flex items-center rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-700 transition-colors",
            title: "Toggle weight unit",
          },
          h("span", { className: unit === "kg" ? "text-emerald-400 font-extrabold" : "text-slate-500" }, "KG"),
          h("span", { className: "mx-1 text-slate-600" }, "/"),
          h("span", { className: unit === "lbs" ? "text-emerald-400 font-extrabold" : "text-slate-500" }, "LBS")
        ),
        // User profile badge with dropdown
        h(
          "div",
          { ref: dropdownRef, className: "relative" },
          h(
            "button",
            {
              onClick: () => setDropdownOpen(!dropdownOpen),
              className: "flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-850 hover:border-slate-700 transition-all",
            },
            h("div", { className: "h-2 w-2 rounded-full bg-emerald-400" }),
            h("span", null, user.username),
            h("span", { className: "text-slate-500" }, "▾")
          ),
          dropdownOpen &&
            h(
              motion.div,
              {
                initial: { opacity: 0, y: 8, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                className: "absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50",
              },
              h(
                "div",
                { className: "px-3 py-2 border-b border-slate-800/80 mb-1" },
                h("div", { className: "text-xs font-semibold text-white" }, user.username),
                h("div", { className: "text-[10px] text-slate-500" }, "Active Lifter")
              ),
              h(
                "button",
                {
                  onClick: onLogout,
                  className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors",
                },
                h(Icon.LogOut),
                "Sign Out"
              )
            )
        )
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Hero Statistics Cards
// ---------------------------------------------------------------------------
function HeroStats({ stats, unit }) {
  if (!stats) return null;

  const volumeDisplay =
    unit === "lbs"
      ? (stats.total_volume * 2.20462).toLocaleString(undefined, { maximumFractionDigits: 0 })
      : stats.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return h(
    "div",
    { className: "mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" },
    // Total Volume
    h(
      "div",
      { className: "rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-glass transition-all hover:border-slate-700" },
      h(
        "div",
        { className: "flex items-center justify-between text-slate-400 mb-2" },
        h("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Total Volume"),
        h("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400" }, h(Icon.Dumbbell))
      ),
      h("div", { className: "font-athletic text-3xl font-black tracking-tight text-white tnum" }, volumeDisplay),
      h("div", { className: "text-[11px] font-semibold text-emerald-400 mt-0.5" }, `${unit.toUpperCase()} lifted all-time`)
    ),
    // Workouts Logged
    h(
      "div",
      { className: "rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-glass transition-all hover:border-slate-700" },
      h(
        "div",
        { className: "flex items-center justify-between text-slate-400 mb-2" },
        h("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Sessions"),
        h("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400" }, h(Icon.Sparkles))
      ),
      h("div", { className: "font-athletic text-3xl font-black tracking-tight text-white tnum" }, stats.total_workouts),
      h("div", { className: "text-[11px] font-semibold text-cyan-400 mt-0.5" }, `${stats.workouts_this_month} this month`)
    ),
    // Workout Streak
    h(
      "div",
      { className: "rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-glass transition-all hover:border-slate-700" },
      h(
        "div",
        { className: "flex items-center justify-between text-slate-400 mb-2" },
        h("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Streak"),
        h("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400" }, h(Icon.Flame))
      ),
      h("div", { className: "font-athletic text-3xl font-black tracking-tight text-white tnum" }, `${stats.streak_days} DAYS`),
      h("div", { className: "text-[11px] font-semibold text-orange-400 mt-0.5" }, stats.streak_days > 0 ? "Active consistency 🔥" : "Log today to start!")
    ),
    // Top PR Lift
    h(
      "div",
      { className: "rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-glass transition-all hover:border-slate-700" },
      h(
        "div",
        { className: "flex items-center justify-between text-slate-400 mb-2" },
        h("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Top PR"),
        h("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400" }, h(Icon.Trophy))
      ),
      stats.top_prs && stats.top_prs.length > 0
        ? h(
            "div",
            null,
            h(
              "div",
              { className: "font-athletic text-3xl font-black tracking-tight text-white truncate tnum" },
              `${convertWeight(stats.top_prs[0].weight, unit)} ${unit}`
            ),
            h("div", { className: "text-[11px] font-semibold text-purple-400 truncate mt-0.5" }, stats.top_prs[0].exercise)
          )
        : h(
            "div",
            null,
            h("div", { className: "font-athletic text-3xl font-black tracking-tight text-slate-500" }, "—"),
            h("div", { className: "text-[11px] text-slate-500 mt-0.5" }, "Log lifts to see PRs")
          )
    )
  );
}

// ---------------------------------------------------------------------------
// Workout Creator & Template Loader
// ---------------------------------------------------------------------------
function NewSessionCard({ onCreate, unit }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([
    { id: uniqueId(), name: "", sets: 3, reps: 10, weight: 60 },
  ]);
  const [busy, setBusy] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const addRow = () => {
    setRows((prev) => [...prev, { id: uniqueId(), name: "", sets: 3, reps: 10, weight: 60 }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id, key, val) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  };

  const loadTemplate = (tmpl) => {
    setRows(
      tmpl.exercises.map((e) => ({
        id: uniqueId(),
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
      }))
    );
    setShowTemplates(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.name.trim());
    if (!valid.length) return;
    setBusy(true);
    await onCreate({
      date,
      exercises: valid.map((r) => ({
        name: r.name.trim(),
        sets: Number(r.sets) || 1,
        reps: Number(r.reps) || 1,
        weight: Number(r.weight) || 0,
      })),
    });
    setBusy(false);
    // Reset to fresh row
    setRows([{ id: uniqueId(), name: "", sets: 3, reps: 10, weight: 60 }]);
  };

  const totalEstVolume = rows.reduce(
    (acc, r) => acc + (Number(r.sets) || 0) * (Number(r.reps) || 0) * (Number(r.weight) || 0),
    0
  );

  return h(
    "div",
    { className: "mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl" },
    h(
      "div",
      { className: "flex flex-wrap items-center justify-between gap-3 mb-5" },
      h(
        "div",
        null,
        h("h2", { className: "font-athletic text-2xl font-black tracking-wide text-white" }, "START NEW TRAINING SESSION"),
        h("p", { className: "text-xs text-slate-400" }, "Log your sets, reps and load or choose a proven routine template.")
      ),
      h(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: () => setShowTemplates(!showTemplates),
          className: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
        },
        h(Icon.Sparkles),
        showTemplates ? "Hide Templates" : "Load Routine Template"
      )
    ),

    // Template Picker Drawer
    showTemplates &&
      h(
        motion.div,
        {
          initial: { opacity: 0, height: 0 },
          animate: { opacity: 1, height: "auto" },
          exit: { opacity: 0, height: 0 },
          className: "mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden pt-1 pb-3",
        },
        WORKOUT_TEMPLATES.map((tmpl) =>
          h(
            "button",
            {
              key: tmpl.id,
              type: "button",
              onClick: () => loadTemplate(tmpl),
              className: cx(
                "flex flex-col text-left rounded-xl border bg-gradient-to-b p-3.5 transition-all hover:scale-[1.02] cursor-pointer",
                tmpl.color
              ),
            },
            h(
              "div",
              { className: "flex items-center justify-between mb-1.5" },
              h("span", { className: "text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/10 px-2 py-0.5 text-white" }, tmpl.badge),
              h("span", { className: "text-xs text-emerald-400 font-bold" }, "+ Use")
            ),
            h("div", { className: "font-bold text-sm text-white mb-1 leading-tight" }, tmpl.name),
            h(
              "div",
              { className: "text-[11px] text-slate-400 space-y-0.5" },
              tmpl.exercises.slice(0, 3).map((e, idx) =>
                h("div", { key: idx, className: "truncate" }, `• ${e.name} (${e.sets}x${e.reps})`)
              ),
              tmpl.exercises.length > 3 && h("div", { className: "text-[10px] text-slate-500" }, `+ ${tmpl.exercises.length - 3} more`)
            )
          )
        )
      ),

    // Workout Builder Form
    h(
      "form",
      { onSubmit: submit, className: "space-y-4" },
      // Date Selector Row
      h(
        "div",
        { className: "flex flex-wrap items-center gap-3 pb-2 border-b border-slate-800" },
        h("div", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Session Date:"),
        h(TextInput, {
          type: "date",
          value: date,
          onChange: (e) => setDate(e.target.value),
          className: "w-auto max-w-[180px] bg-slate-950 py-1.5 text-xs font-semibold",
        }),
        h(
          "div",
          { className: "flex items-center gap-1.5 ml-auto" },
          h(
            "button",
            {
              type: "button",
              onClick: () => setDate(new Date().toISOString().slice(0, 10)),
              className: "rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition-colors",
            },
            "Today"
          ),
          h(
            "button",
            {
              type: "button",
              onClick: () => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setDate(y.toISOString().slice(0, 10));
              },
              className: "rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition-colors",
            },
            "Yesterday"
          )
        )
      ),

      // Exercise Rows Header
      h(
        "div",
        { className: "grid grid-cols-[1fr_70px_70px_85px_36px] gap-2 items-center px-1" },
        h("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400" }, "Exercise Movement"),
        h("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center" }, "Sets"),
        h("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center" }, "Reps"),
        h("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center" }, unit.toUpperCase()),
        h("span", null)
      ),

      // Dynamic Rows
      h(
        "div",
        { className: "space-y-2" },
        rows.map((r, i) =>
          h(
            motion.div,
            {
              key: r.id,
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, height: 0 },
              className: "grid grid-cols-[1fr_70px_70px_85px_36px] gap-2 items-center",
            },
            h(TextInput, {
              placeholder: i === 0 ? "e.g. Bench Press, Squat, Pull-ups" : "Exercise name",
              value: r.name,
              onChange: (e) => updateRow(r.id, "name", e.target.value),
              autoFocus: i === rows.length - 1 && i > 0,
            }),
            h(TextInput, {
              type: "number",
              min: 1,
              value: r.sets,
              onChange: (e) => updateRow(r.id, "sets", Math.max(1, parseInt(e.target.value) || 1)),
              className: "text-center",
            }),
            h(TextInput, {
              type: "number",
              min: 1,
              value: r.reps,
              onChange: (e) => updateRow(r.id, "reps", Math.max(1, parseInt(e.target.value) || 1)),
              className: "text-center",
            }),
            h(TextInput, {
              type: "number",
              min: 0,
              step: 0.5,
              value: r.weight,
              onChange: (e) => updateRow(r.id, "weight", Math.max(0, parseFloat(e.target.value) || 0)),
              className: "text-center font-bold text-emerald-400",
            }),
            h(
              "button",
              {
                type: "button",
                onClick: () => removeRow(r.id),
                disabled: rows.length === 1,
                className: "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-20 transition-all",
                "aria-label": "Remove exercise row",
              },
              h(Icon.Trash)
            )
          )
        )
      ),

      // Footer Actions
      h(
        "div",
        { className: "flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800" },
        h(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            onClick: addRow,
          },
          h(Icon.Plus),
          "Add Another Movement"
        ),
        h(
          "div",
          { className: "flex items-center gap-4" },
          totalEstVolume > 0 &&
            h(
              "div",
              { className: "text-xs font-semibold text-slate-400" },
              "Est. Volume: ",
              h("span", { className: "font-black text-emerald-400 tnum" }, `${convertWeight(totalEstVolume, unit)} ${unit}`)
            ),
          h(
            Button,
            {
              type: "submit",
              variant: "primary",
              disabled: busy || !rows.some((r) => r.name.trim()),
            },
            busy ? "Logging..." : "Save Workout Session"
          )
        )
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Exercise Table & Inline Editor
// ---------------------------------------------------------------------------
function ExerciseTable({ sessionId, exercises, onUpdate, onDelete, onStartTimer, unit }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", sets: 1, reps: 1, weight: 0 });

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditForm({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight });
  };

  const saveEdit = async (exerciseId) => {
    await onUpdate(sessionId, exerciseId, editForm);
    setEditingId(null);
  };

  const quickIncrementWeight = async (e, delta) => {
    const newWeight = Math.max(0, Math.round((e.weight + delta) * 10) / 10);
    await onUpdate(sessionId, e.id, { weight: newWeight });
  };

  return h(
    "div",
    { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60" },
    h(
      "table",
      { className: "w-full text-left text-sm" },
      h(
        "thead",
        null,
        h(
          "tr",
          { className: "border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400" },
          h("th", { className: "py-2.5 px-4" }, "Movement"),
          h("th", { className: "py-2.5 px-3 text-center" }, "Sets"),
          h("th", { className: "py-2.5 px-3 text-center" }, "Reps"),
          h("th", { className: "py-2.5 px-3 text-right" }, `Load (${unit.toUpperCase()})`),
          h("th", { className: "py-2.5 px-3 text-center" }, "Est. 1RM"),
          h("th", { className: "py-2.5 px-4 text-right" }, "Actions")
        )
      ),
      h(
        "tbody",
        { className: "divide-y divide-slate-800/60" },
        exercises.map((e) => {
          const isEditing = editingId === e.id;
          const oneRM = calculate1RM(e.weight, e.reps);

          if (isEditing) {
            return h(
              "tr",
              { key: e.id, className: "bg-slate-800/40" },
              h(
                "td",
                { className: "py-2 px-3" },
                h(TextInput, {
                  value: editForm.name,
                  onChange: (ev) => setEditForm({ ...editForm, name: ev.target.value }),
                  className: "py-1 text-xs font-semibold",
                })
              ),
              h(
                "td",
                { className: "py-2 px-2 text-center" },
                h(TextInput, {
                  type: "number",
                  min: 1,
                  value: editForm.sets,
                  onChange: (ev) => setEditForm({ ...editForm, sets: Math.max(1, parseInt(ev.target.value) || 1) }),
                  className: "py-1 text-xs text-center w-16 mx-auto",
                })
              ),
              h(
                "td",
                { className: "py-2 px-2 text-center" },
                h(TextInput, {
                  type: "number",
                  min: 1,
                  value: editForm.reps,
                  onChange: (ev) => setEditForm({ ...editForm, reps: Math.max(1, parseInt(ev.target.value) || 1) }),
                  className: "py-1 text-xs text-center w-16 mx-auto",
                })
              ),
              h(
                "td",
                { className: "py-2 px-2 text-right" },
                h(TextInput, {
                  type: "number",
                  min: 0,
                  step: 0.5,
                  value: editForm.weight,
                  onChange: (ev) => setEditForm({ ...editForm, weight: Math.max(0, parseFloat(ev.target.value) || 0) }),
                  className: "py-1 text-xs text-right w-20 ml-auto font-bold text-emerald-400",
                })
              ),
              h("td", { className: "py-2 px-3 text-center text-xs text-slate-500" }, "—"),
              h(
                "td",
                { className: "py-2 px-4 text-right" },
                h(
                  "div",
                  { className: "flex items-center justify-end gap-1.5" },
                  h(
                    Button,
                    { size: "sm", variant: "primary", onClick: () => saveEdit(e.id) },
                    "Save"
                  ),
                  h(
                    Button,
                    { size: "sm", variant: "ghost", onClick: () => setEditingId(null) },
                    "Cancel"
                  )
                )
              )
            );
          }

          return h(
            "tr",
            { key: e.id, className: "group hover:bg-slate-900/50 transition-colors" },
            // Name
            h(
              "td",
              { className: "py-3 px-4" },
              h("span", { className: "font-semibold text-white group-hover:text-emerald-400 transition-colors" }, e.name)
            ),
            // Sets
            h("td", { className: "py-3 px-3 text-center font-medium text-slate-300 tnum" }, e.sets),
            // Reps
            h("td", { className: "py-3 px-3 text-center font-medium text-slate-300 tnum" }, e.reps),
            // Weight & quick adjust
            h(
              "td",
              { className: "py-3 px-3 text-right" },
              h(
                "div",
                { className: "flex items-center justify-end gap-1.5" },
                h("span", { className: "font-bold text-emerald-400 tnum" }, convertWeight(e.weight, unit)),
                h(
                  "div",
                  { className: "opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity" },
                  h(
                    "button",
                    {
                      onClick: () => quickIncrementWeight(e, 2.5),
                      title: "+2.5kg",
                      className: "rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-slate-400 hover:bg-emerald-500 hover:text-slate-950",
                    },
                    "+2.5"
                  ),
                  h(
                    "button",
                    {
                      onClick: () => quickIncrementWeight(e, -2.5),
                      title: "-2.5kg",
                      className: "rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-slate-400 hover:bg-rose-500 hover:text-white",
                    },
                    "-2.5"
                  )
                )
              )
            ),
            // Estimated 1RM
            h(
              "td",
              { className: "py-3 px-3 text-center" },
              oneRM > 0
                ? h("span", { className: "rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20 tnum" }, `${convertWeight(oneRM, unit)} ${unit}`)
                : h("span", { className: "text-slate-600 text-xs" }, "—")
            ),
            // Actions
            h(
              "td",
              { className: "py-3 px-4 text-right" },
              h(
                "div",
                { className: "flex items-center justify-end gap-1" },
                h(
                  "button",
                  {
                    onClick: () => onStartTimer(90),
                    title: "Start 90s rest timer",
                    className: "p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors",
                  },
                  h(Icon.Timer)
                ),
                h(
                  "button",
                  {
                    onClick: () => startEdit(e),
                    title: "Edit movement",
                    className: "p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors",
                  },
                  h(Icon.Edit)
                ),
                h(
                  "button",
                  {
                    onClick: () => onDelete(sessionId, e.id),
                    title: "Delete movement",
                    className: "p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors",
                  },
                  h(Icon.Trash)
                )
              )
            )
          );
        })
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Single Workout Session Card
// ---------------------------------------------------------------------------
function SessionCard({
  session,
  expanded,
  onToggle,
  onUpdateExercise,
  onDeleteExercise,
  onAddExercise,
  onDuplicateSession,
  onDeleteSession,
  onStartTimer,
  unit,
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 10, weight: 60 });
  const [busy, setBusy] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newEx.name.trim()) return;
    setBusy(true);
    await onAddExercise(session.id, {
      name: newEx.name.trim(),
      sets: Number(newEx.sets) || 1,
      reps: Number(newEx.reps) || 1,
      weight: Number(newEx.weight) || 0,
    });
    setBusy(false);
    setNewEx({ name: "", sets: 3, reps: 10, weight: 60 });
    setAddingNew(false);
  };

  const volumeDisplay = convertWeight(session.volume, unit).toLocaleString();

  return h(
    motion.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 },
      className: cx(
        "rounded-2xl border transition-all shadow-lg overflow-hidden",
        expanded
          ? "border-emerald-500/40 bg-slate-900/90 shadow-emerald-500/5"
          : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80"
      ),
    },
    // Header Bar
    h(
      "div",
      {
        onClick: onToggle,
        className: "flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none",
      },
      h(
        "div",
        { className: "flex items-center gap-3.5" },
        h(
          "div",
          {
            className: cx(
              "flex h-10 w-10 items-center justify-center rounded-xl font-athletic text-lg font-black transition-colors",
              expanded ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
            ),
          },
          session.exercise_count
        ),
        h(
          "div",
          null,
          h("div", { className: "font-athletic text-xl font-bold tracking-wide text-white" }, formatDate(session.date)),
          h(
            "div",
            { className: "flex items-center gap-2 text-xs text-slate-400" },
            h("span", null, `${session.exercise_count} movement${session.exercise_count === 1 ? "" : "s"}`),
            h("span", { className: "text-slate-600" }, "•"),
            h("span", null, `${session.total_sets || 0} sets`)
          )
        )
      ),
      h(
        "div",
        { className: "flex items-center gap-4" },
        h(
          "div",
          { className: "text-right" },
          h("div", { className: "font-athletic text-2xl font-black text-emerald-400 tnum" }, `${volumeDisplay} ${unit}`),
          h("div", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-500" }, "Total Volume")
        ),
        h(
          motion.div,
          {
            animate: { rotate: expanded ? 180 : 0 },
            className: "text-slate-400",
          },
          "▼"
        )
      )
    ),

    // Expanded Body
    h(
      AnimatePresence,
      null,
      expanded &&
        h(
          motion.div,
          {
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            transition: { duration: 0.25, ease: EASE_OUT_EXPO },
            className: "border-t border-slate-800 p-4 sm:p-5 space-y-4",
          },
          session.exercises && session.exercises.length > 0
            ? h(ExerciseTable, {
                sessionId: session.id,
                exercises: session.exercises,
                onUpdate: onUpdateExercise,
                onDelete: onDeleteExercise,
                onStartTimer: onStartTimer,
                unit: unit,
              })
            : h(
                "div",
                { className: "rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500" },
                "No exercises logged in this session yet."
              ),

          // Add New Exercise Row Inline
          addingNew
            ? h(
                "form",
                {
                  onSubmit: handleAddSubmit,
                  className: "rounded-xl border border-emerald-500/30 bg-slate-950 p-3 space-y-3",
                },
                h(
                  "div",
                  { className: "text-xs font-bold uppercase tracking-wider text-emerald-400" },
                  "+ Add Movement to Session"
                ),
                h(
                  "div",
                  { className: "grid grid-cols-[1fr_70px_70px_85px] gap-2 items-center" },
                  h(TextInput, {
                    placeholder: "Movement name (e.g. Incline Bench)",
                    value: newEx.name,
                    onChange: (e) => setNewEx({ ...newEx, name: e.target.value }),
                    autoFocus: true,
                  }),
                  h(TextInput, {
                    type: "number",
                    min: 1,
                    placeholder: "Sets",
                    value: newEx.sets,
                    onChange: (e) => setNewEx({ ...newEx, sets: Math.max(1, parseInt(e.target.value) || 1) }),
                    className: "text-center",
                  }),
                  h(TextInput, {
                    type: "number",
                    min: 1,
                    placeholder: "Reps",
                    value: newEx.reps,
                    onChange: (e) => setNewEx({ ...newEx, reps: Math.max(1, parseInt(e.target.value) || 1) }),
                    className: "text-center",
                  }),
                  h(TextInput, {
                    type: "number",
                    min: 0,
                    step: 0.5,
                    placeholder: "Kg",
                    value: newEx.weight,
                    onChange: (e) => setNewEx({ ...newEx, weight: Math.max(0, parseFloat(e.target.value) || 0) }),
                    className: "text-center font-bold text-emerald-400",
                  })
                ),
                h(
                  "div",
                  { className: "flex items-center justify-end gap-2" },
                  h(
                    Button,
                    { size: "sm", variant: "ghost", onClick: () => setAddingNew(false) },
                    "Cancel"
                  ),
                  h(
                    Button,
                    { size: "sm", variant: "primary", type: "submit", disabled: busy || !newEx.name.trim() },
                    busy ? "Adding..." : "Add Movement"
                  )
                )
              )
            : null,

          // Card Footer Toolbar
          h(
            "div",
            { className: "flex flex-wrap items-center justify-between gap-3 pt-2" },
            h(
              "div",
              { className: "flex items-center gap-2" },
              !addingNew &&
                h(
                  Button,
                  {
                    size: "sm",
                    variant: "ghost",
                    onClick: () => setAddingNew(true),
                    className: "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10",
                  },
                  h(Icon.Plus),
                  "Add Movement"
                ),
              h(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => onDuplicateSession(session.id),
                  title: "Copy this exact workout to today's log",
                },
                h(Icon.Copy),
                "Repeat Workout"
              )
            ),
            h(
              Button,
              {
                size: "sm",
                variant: "danger",
                onClick: () => onDeleteSession(session.id),
              },
              h(Icon.Trash),
              "Delete Session"
            )
          )
        )
    )
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
function Dashboard({ user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [unit, setUnit] = useState(() => localStorage.getItem("wod_unit") || "kg");
  const [message, setMessage] = useState(null);

  // Global Rest Timer
  const [timerState, setTimerState] = useState({
    active: false,
    secondsLeft: 0,
    totalSeconds: 0,
    isRunning: false,
  });

  const flash = (type, text) => {
    setMessage({ type, text });
  };

  const toggleUnit = () => {
    const next = unit === "kg" ? "lbs" : "kg";
    setUnit(next);
    localStorage.setItem("wod_unit", next);
  };

  const startTimer = (seconds) => {
    setTimerState({
      active: true,
      secondsLeft: seconds,
      totalSeconds: seconds,
      isRunning: true,
    });
    flash("success", `Rest timer started: ${seconds}s`);
  };

  const loadData = async () => {
    const [sessRes, statsRes] = await Promise.all([
      apiGet("/api/sessions/"),
      apiGet("/api/stats/"),
    ]);
    if (sessRes.ok) {
      setSessions(sessRes.data.sessions);
      // Auto expand latest session
      if (sessRes.data.sessions.length > 0 && Object.keys(expanded).length === 0) {
        setExpanded({ [sessRes.data.sessions[0].id]: true });
      }
    }
    if (statsRes.ok) {
      setStats(statsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const handleCreateSession = async (payload) => {
    const res = await apiPost("/api/sessions/", payload);
    if (res.ok) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      flash("success", "Workout session logged successfully! 💪");
      await loadData();
      setExpanded((prev) => ({ ...prev, [res.data.id]: true }));
    } else {
      flash("error", (res.data && res.data.error) || "Failed to create session");
    }
  };

  const handleDuplicateSession = async (sessionId) => {
    const res = await apiPost(`/api/sessions/${sessionId}/duplicate/`, {
      date: new Date().toISOString().slice(0, 10),
    });
    if (res.ok) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      flash("success", "Workout routine copied to today!");
      await loadData();
      setExpanded((prev) => ({ ...prev, [res.data.id]: true }));
    } else {
      flash("error", (res.data && res.data.error) || "Failed to duplicate session");
    }
  };

  const handleAddExercise = async (sessionId, ex) => {
    const res = await apiPost(`/api/sessions/${sessionId}/exercises/`, ex);
    if (res.ok) {
      flash("success", `Added ${ex.name}`);
      await loadData();
    } else {
      flash("error", (res.data && res.data.error) || "Failed to add exercise");
    }
  };

  const handleUpdateExercise = async (sessionId, exerciseId, data) => {
    const res = await apiPut(`/api/sessions/${sessionId}/exercises/${exerciseId}/`, data);
    if (res.ok) {
      flash("success", "Updated movement");
      await loadData();
    } else {
      flash("error", "Failed to update movement");
    }
  };

  const handleDeleteExercise = async (sessionId, exerciseId) => {
    const res = await apiDelete(`/api/sessions/${sessionId}/exercises/${exerciseId}/delete/`);
    if (res.ok) {
      flash("success", "Movement removed");
      await loadData();
    } else {
      flash("error", "Could not remove exercise");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this entire workout session?")) return;
    const res = await apiDelete(`/api/sessions/${sessionId}/delete/`);
    if (res.ok) {
      flash("success", "Workout session deleted");
      await loadData();
    } else {
      flash("error", "Could not delete session");
    }
  };

  const handleLogout = async () => {
    await apiPost("/api/logout/", {});
    onLogout();
  };

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter((s) => {
      if (s.date.includes(q)) return true;
      return s.exercises.some((e) => e.name.toLowerCase().includes(q));
    });
  }, [sessions, searchQuery]);

  return h(
    "div",
    { className: "min-h-screen bg-slate-950 text-slate-100 pb-20" },
    h(TopBar, {
      user,
      stats,
      unit,
      onToggleUnit: toggleUnit,
      onLogout: handleLogout,
      onStartTimer: startTimer,
    }),
    h(
      "main",
      { className: "mx-auto max-w-5xl px-4 pt-6 sm:px-6" },
      // Hero Stats Section
      h(HeroStats, { stats, unit }),

      // New Workout Session Builder
      h(NewSessionCard, { onCreate: handleCreateSession, unit }),

      // Workouts List & Search Bar
      h(
        "div",
        { className: "space-y-4" },
        h(
          "div",
          { className: "flex flex-wrap items-center justify-between gap-3 mb-2" },
          h(
            "div",
            { className: "flex items-center gap-2.5" },
            h("h3", { className: "font-athletic text-2xl font-black tracking-wide text-white" }, "WORKOUT LOG HISTORY"),
            h("span", { className: "rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-400 tnum" }, filteredSessions.length)
          ),
          // Search input
          h(
            "div",
            { className: "relative w-full max-w-xs" },
            h("div", { className: "absolute inset-y-0 left-3 flex items-center text-slate-500" }, h(Icon.Search)),
            h(TextInput, {
              placeholder: "Search by movement (e.g. Squat)...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-9 py-1.5 text-xs bg-slate-900",
            }),
            searchQuery &&
              h(
                "button",
                {
                  onClick: () => setSearchQuery(""),
                  className: "absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 hover:text-white",
                },
                "✕"
              )
          )
        ),

        // Session Cards List
        loading
          ? [1, 2, 3].map((i) =>
              h("div", {
                key: i,
                className: "h-24 rounded-2xl border border-slate-800/80 bg-slate-900/40 animate-pulse",
              })
            )
          : filteredSessions.length === 0
          ? h(
              "div",
              { className: "rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center" },
              h(
                "div",
                { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3" },
                h(Icon.Dumbbell, { className: "w-7 h-7 stroke-[2]" })
              ),
              h("div", { className: "font-athletic text-xl font-bold text-white mb-1" }, searchQuery ? "No matching workouts found" : "No workout sessions yet"),
              h(
                "p",
                { className: "text-sm text-slate-400 max-w-sm mx-auto" },
                searchQuery
                  ? "Try searching for a different exercise name or clear your search."
                  : "Start logging your training above or choose one of our workout templates to get started!"
              )
            )
          : filteredSessions.map((s) =>
              h(SessionCard, {
                key: s.id,
                session: s,
                expanded: !!expanded[s.id],
                onToggle: () => setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] })),
                onUpdateExercise: handleUpdateExercise,
                onDeleteExercise: handleDeleteExercise,
                onAddExercise: handleAddExercise,
                onDuplicateSession: handleDuplicateSession,
                onDeleteSession: handleDeleteSession,
                onStartTimer: startTimer,
                unit: unit,
              })
            )
      )
    ),

    // Floating Rest Timer
    h(RestTimerWidget, { timerState, setTimerState }),

    // Floating Notification Banner
    h(
      "div",
      { className: "pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" },
      h(StatusBanner, { message, onClose: () => setMessage(null) })
    )
  );
}

// ---------------------------------------------------------------------------
// Athletic Auth Experience (Login & Register)
// ---------------------------------------------------------------------------
function AuthView({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const path = mode === "login" ? "/api/login/" : "/api/register/";
    const res = await apiPost(path, { username, password });
    setBusy(false);
    if (res.ok) {
      setUsername("");
      setPassword("");
      onAuth(res.data.user);
    } else {
      const err = res.data && (res.data.error || "Authentication failed");
      setError(Array.isArray(err) ? err.join(" ") : err);
    }
  };

  return h(
    "div",
    { className: "min-h-screen flex items-center justify-center px-4 bg-slate-950 relative overflow-hidden" },
    // Ambient athletic background glow
    h("div", {
      className:
        "pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]",
    }),
    h("div", {
      className:
        "pointer-events-none absolute -bottom-40 right-10 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[120px]",
    }),

    h(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: EASE_OUT_EXPO },
        className: "w-full max-w-md relative z-10",
      },
      // Header Brand
      h(
        "div",
        { className: "mb-8 text-center" },
        h(
          "div",
          { className: "inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30 text-slate-950 mb-3" },
          h(Icon.Dumbbell, { className: "w-8 h-8 stroke-[2.5]" })
        ),
        h("h1", { className: "font-athletic text-4xl font-black tracking-wider text-white" }, "WOD LOG"),
        h("p", { className: "mt-1.5 text-sm text-slate-400" }, "High Performance Training Journal & 1RM Tracker")
      ),

      // Auth Card
      h(
        "div",
        { className: "rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl" },
        // Mode Switcher
        h(
          "div",
          { className: "mb-6 flex rounded-xl bg-slate-950 p-1 border border-slate-800" },
          ["login", "register"].map((m) =>
            h(
              "button",
              {
                key: m,
                onClick: () => {
                  setMode(m);
                  setError(null);
                },
                className: cx(
                  "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  mode === m
                    ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white"
                ),
              },
              m === "login" ? "Sign In" : "Register"
            )
          )
        ),

        // Error message
        error &&
          h(
            "div",
            { className: "mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-medium text-rose-300" },
            error
          ),

        // Form
        h(
          "form",
          { onSubmit: submit, className: "space-y-4" },
          h(
            "div",
            { className: "space-y-1.5" },
            h("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400" }, "Username"),
            h(TextInput, {
              value: username,
              onChange: (e) => setUsername(e.target.value),
              autoComplete: "username",
              placeholder: "athlete_one",
              required: true,
            })
          ),
          h(
            "div",
            { className: "space-y-1.5" },
            h("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400" }, "Password"),
            h(TextInput, {
              type: "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              autoComplete: mode === "login" ? "current-password" : "new-password",
              placeholder: "••••••••",
              required: true,
            })
          ),
          h(
            Button,
            { type: "submit", variant: "primary", className: "w-full py-3 mt-2", disabled: busy },
            busy ? "Working…" : mode === "login" ? "Sign In to WOD Log" : "Create Athlete Account"
          )
        ),

        // Feature Highlights
        h(
          "div",
          { className: "mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400" },
          h("div", { className: "flex items-center gap-1.5" }, h(Icon.Check, { className: "text-emerald-400" }), "Progressive Overload"),
          h("div", { className: "flex items-center gap-1.5" }, h(Icon.Check, { className: "text-emerald-400" }), "Estimated 1RM"),
          h("div", { className: "flex items-center gap-1.5" }, h(Icon.Check, { className: "text-emerald-400" }), "Smart Rest Timer"),
          h("div", { className: "flex items-center gap-1.5" }, h(Icon.Check, { className: "text-emerald-400" }), "Workout Templates")
        )
      )
    )
  );
}

// ---------------------------------------------------------------------------
// App Entrypoint
// ---------------------------------------------------------------------------
function App() {
  const [user, setUser] = useState(null); // null = checking

  useEffect(() => {
    apiGet("/api/me/")
      .then((r) => (r.ok ? r.data.user : false))
      .then((u) => setUser(u))
      .catch(() => setUser(false));
  }, []);

  if (user === null)
    return h(
      "div",
      { className: "flex min-h-screen items-center justify-center bg-slate-950 text-slate-400 font-bold" },
      h("div", { className: "flex items-center gap-3" },
        h("div", { className: "h-3 w-3 rounded-full bg-emerald-400 animate-ping" }),
        "Initializing WOD Log..."
      )
    );

  return h(
    AnimatePresence,
    { mode: "wait" },
    user
      ? h(
          motion.div,
          { key: "dash", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } },
          h(Dashboard, { user, onLogout: () => setUser(false) })
        )
      : h(
          motion.div,
          { key: "auth", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } },
          h(AuthView, { onAuth: (u) => setUser(u) })
        )
  );
}

const __root = document.getElementById("root");
createRoot(__root).render(h(App));
__root.dataset.mounted = "1";
