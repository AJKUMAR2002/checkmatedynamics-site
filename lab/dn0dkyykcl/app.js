// Checkmate web app, internal prototype. All safety checks live in the bridge (run.py); this page only asks.
// Two builds of the same page:
//   local  - served by the bridge itself; it puts the pairing code in <meta name="cm-token">.
//   hosted - static files on the website (software/app/hosted/build.py); password gate, then pair with the
//            bridge on ws://127.0.0.1:<port> using the code the bridge prints.
const $ = (id) => document.getElementById(id);
const meta = (n) => (document.querySelector(`meta[name="${n}"]`) || {}).content || "";
const store = {        // per-viewer conveniences only; every call is wrapped (private windows can throw)
  get: (k, s = sessionStorage) => { try { return s.getItem(k); } catch { return null; } },
  set: (k, v, s = sessionStorage) => { try { v == null ? s.removeItem(k) : s.setItem(k, v); } catch { /* ignore */ } },
};
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const msg = (t) => { $("msg").textContent = t || ""; };

const MODE = meta("cm-mode") || "local";
let port = MODE === "local" ? location.port : (store.get("cm-bridge-port", localStorage) || "8790");
let token = MODE === "local" ? meta("cm-token") : (store.get("cm-pair") || "");
const httpBase = () => (MODE === "local" ? "" : `http://127.0.0.1:${port}`);
const wsUrl = () => (MODE === "local" ? `ws://${location.host}/ws` : `ws://127.0.0.1:${port}/ws`);

// ------------------------------------------------------------------ transport: WebSocket, HTTP fallback
let ws = null, wsReady = false, nextId = 1, started = false;
let tokenGood = MODE === "local";   // HTTP fallback only with a code the bridge accepted (bad codes count toward its lockout)
const pending = new Map();
const SLOW = new Set(["cl_cal", "foc_cal", "goto", "connect", "move"]);

function openWs() {
  if (ws) return;
  const sock = new WebSocket(wsUrl());
  ws = sock;
  let opened = false, authFailed = false;
  sock.onopen = () => { opened = true; sock.send(JSON.stringify({ type: "auth", token })); };
  sock.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === "welcome") { wsReady = true; tokenGood = true; overlay(null); }
    else if (m.type === "auth_failed") { authFailed = true; tokenGood = false; token = ""; store.set("cm-pair", null); overlay("pair", m.error); }
    else if (m.type === "state") render(m.state);
    else if (m.type === "result") { const p = pending.get(m.id); if (p) { pending.delete(m.id); p(m); } }
  };
  sock.onclose = () => {
    ws = null; wsReady = false;
    for (const [, p] of pending) p({ ok: false, error: "bridge connection lost" });
    pending.clear();
    $("link").textContent = "bridge offline";
    if (authFailed) return;                                  // wait for a new pairing code
    if (!opened && MODE === "hosted") overlay("nobridge");
    setTimeout(() => (MODE === "hosted" ? findBridge() : openWs()), 1500);
  };
}

async function http(action, body) {
  const r = await fetch(`${httpBase()}/api/${action}`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-CM-Token": token }, body: JSON.stringify(body),
  });
  return r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }));
}

async function api(action, args = {}) {
  let j;
  try {
    if (wsReady) {
      j = await new Promise((resolve) => {
        const id = nextId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ type: "call", id, action, args }));
        setTimeout(() => { if (pending.delete(id)) resolve({ ok: false, error: "no answer from the bridge" }); },
          action === "foc_cal" ? 120000 : SLOW.has(action) ? 60000 : 5000);
      });
    } else if (tokenGood) {
      j = await http(action, args);
    } else {
      j = { ok: false, error: "not paired with the bridge" };
    }
  } catch (e) { j = { ok: false, error: `bridge unreachable (${e.message || e})` }; }
  if (!j.ok && action !== "heartbeat") msg(j.error || "refused");
  return j;
}

// ------------------------------------------------------------------ hosted: find + pair
function overlay(which, text) {
  $("bridge").hidden = !which;
  document.body.classList.toggle("waiting", !!which);
  $("nobridge").hidden = which !== "nobridge";
  $("pairform").hidden = which !== "pair";
  if (which === "pair") { $("pairmsg").textContent = text || ""; $("paircodein").focus(); }
  $("portshow").textContent = port;
}

async function findBridge() {
  try {
    const r = await fetch(`${httpBase()}/api/hello`, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch {
    overlay("nobridge");
    setTimeout(findBridge, 2000);
    return;
  }
  if (!token) { overlay("pair"); return; }
  openWs();
}

$("pairform").onsubmit = (e) => {
  e.preventDefault();
  const v = $("paircodein").value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (v.length !== 8) { $("pairmsg").textContent = "The code has 8 characters, like 7KQ2-M9TX."; return; }
  token = `${v.slice(0, 4)}-${v.slice(4)}`;
  store.set("cm-pair", token);
  $("pairmsg").textContent = "pairing ...";
  openWs();
};
$("bportset").onclick = () => {
  const p = parseInt($("bport").value, 10);
  if (p >= 1024 && p <= 65535) { port = String(p); store.set("cm-bridge-port", port, localStorage); overlay("nobridge"); }
};

// ------------------------------------------------------------------ hosted: password gate (casual visitors only)
async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
$("gateform").onsubmit = async (e) => {
  e.preventDefault();
  const [salt, hash] = meta("cm-gate").split(":");
  if ((await sha256hex(salt + $("gatepw").value)) === hash) {
    store.set("cm-gate", "ok");
    $("gatepw").value = "";
    $("gate").hidden = true;
    start();
  } else {
    $("gatemsg").textContent = "Wrong password.";
  }
};

// ------------------------------------------------------------------ render
function kv(el, rows) {
  el.innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v == null ? "—" : esc(v)}</dd>`).join("");
}

let limitsFilled = false, cfgFilled = false, boardsKey = "";
function renderBoards(s) {
  const boards = s.boards || [];
  const key = JSON.stringify([boards.map((b) => [b.uid64, b.ip, b.fw, b.verified, b.notes]), s.connected_uid64]);
  if (key === boardsKey) return;
  boardsKey = key;
  $("boards").innerHTML = boards.length ? boards.map((b) => `<li>
      <span class="mono">${esc(b.product)} ${esc(b.hw)} · ${esc(b.fw)} · ${esc(b.serial || b.uid64)} · ${esc(b.ip)}</span>
      ${b.uid64 === s.connected_uid64 ? '<span class="label">connected</span>' : `<button data-uid="${esc(b.uid64)}">Connect</button>`}
      ${b.verified ? "" : '<span class="small">ID not verified</span>'}
      ${(b.notes || []).map((n) => `<span class="small">${esc(n)}</span>`).join("")}</li>`).join("")
    : `<li class="small">${s.discovery ? "No boards announcing yet. Boards with the discovery firmware appear here within 5 s of joining Wi-Fi."
      : "Discovery is off: type the board IP."}${s.discovery && s.discovery.note ? " " + esc(s.discovery.note) : ""}</li>`;
}

function render(s) {
  const where = MODE === "local" ? "" : `bridge 127.0.0.1:${port} · `;
  $("link").textContent = where + (s.connected ? `${s.host}` : "no board connected");
  renderBoards(s);
  if (!s.connected) {
    kv($("device"), [["Board", s.error || "not connected: pick a board above, or type its IP"]]);
    $("status").innerHTML = ""; return;
  }
  const st = s.status || {}, m = s.motor || {}, d = s.driver || {};
  kv($("device"), [
    ["Product", `${s.device.product} ${s.device.hw_rev}`],
    ["Firmware", s.device.fw],
    ["UID64", s.device.uid64],
    ["Link", s.sim ? "simulator" : `Wi-Fi console · ${s.host}`],
  ]);
  kv($("status"), [
    ["Motor", m.enabled ? (m.moving ? "enabled · moving" : "enabled") : "disabled"],
    ["Position", s.live_pos_rev != null
        ? `${s.live_pos_rev.toFixed(3)} rev · ${(s.live_pos_rev * 360).toFixed(1)}° (commanded, live)`
        : m.pos_rev !== undefined ? `${m.pos_rev.toFixed(3)} rev · ${(m.pos_rev * 360).toFixed(1)}°` : null],
    ["Encoder", `${st.enc} counts`],
    ["Run current", m.run_ma ? `${m.run_ma} mA RMS set` + (m.enabled && d.actual_ma != null ? ` · ${d.actual_ma} mA driver now` : "") : null],
    ["Speed · accel", m.rpm ? `${m.rpm} rpm · ${m.accel} rpm/s` : null],
    ...(s.live ? [
      ["Speed now", `${(s.live.rpm ?? 0).toFixed(1)} rpm measured · ${s.live.cmd_rpm == null ? "—" : s.live.cmd_rpm.toFixed(1) + " rpm"} commanded`],
      ["StallGuard", s.live.sg == null ? "— (driver off)" : `${s.live.sg} (higher = less load)`],
      ["Board state", s.live.state],
      ["Telemetry", `${s.live.age_ms ?? "—"} ms old · ${s.live.gaps} gaps`],
    ] : []),
    ["Microsteps", m.usteps],
    ["VIN", st.vin !== undefined ? `${st.vin.toFixed(2)} V${st.vin_alarm ? "  ALARM" : ""}` : null],
    ["PD contract", st.pd],
    ["Driver temperature", d.temperature],
    ["Driver faults", d.faults && d.faults.length ? d.faults.join(", ") : "none"],
    ["Heartbeat", s.heartbeat_tripped ? "lost: motor was stopped (reload resumes)" : "ok"],
  ]);
  $("warnings").innerHTML = [...(s.alarms || []).map((a) => `ALARM: ${a}`), ...(s.warnings || []), s.device.label]
    .map((w) => `<li>${esc(w)}</li>`).join("");
  $("events").textContent = (s.events || []).map((e) => `${e.t} ${e.kind} ${e.text}`).join("\n") +
    ((s.board_lines || []).length ? "\n— board —\n" + s.board_lines.join("\n") : "");
  $("alarm").hidden = !s.stall_alarm;
  $("alarmtext").textContent = s.stall_alarm ? `STALL: motor stopped and disabled. ${s.stall_alarm}` : "";
  const cl = s.closed_loop;
  $("clhint").textContent = s.stage < 5 ? `(needs firmware stage 5; board runs stage ${s.stage})` : "";
  document.querySelectorAll("#clrow button, #setstall, #goto").forEach((b) => (b.disabled = s.stage < 5));
  kv($("clstat"), s.stage < 5 ? [] : cl && cl.calibrated ? [
    ["State", `${cl.on ? "on" : "off"}${cl.stalled ? " · STALLED" : ""}`],
    ["Error", `${cl.err_fullsteps.toFixed(2)} full steps`],
    ["Encoder", `${cl.encoder_rev.toFixed(3)} rev · ${cl.cpr} counts/rev · direction ${cl.direction}`],
    ["Stall at", `${cl.stall_at.toFixed(1)} full steps`],
  ] : [["State", "not calibrated: Enable, then Calibrate"]]);
  $("apionly").hidden = $("apiset").hidden = !s.api;
  const foc = s.api && s.live && (s.live.caps || []).includes("foc");
  $("focpanel").hidden = !foc;
  if (foc) {
    const L = s.live, fc = L.foc_cal;
    kv($("focstat"), [
      ["Mode", L.mode === "step" || !L.mode ? "off (step mode)" : L.mode],
      ...(L.mode && L.mode !== "step" ? [
        ["Torque", `${(L.torque ?? 0).toFixed(1)} % demand · current ${L.i_pct ?? "—"} % · lead ${L.lead == null ? "—" : L.lead.toFixed(1) + "°"}`],
      ] : []),
      ["Encoder correction", L.lut ? "active" : "activates after the shaft turns one revolution (Calibrate encoder finds it by itself)"],
      ["Linearisation", fc ? (fc.ok ? `max error ${fc.max_counts} counts (${fc.max_deg}°)${fc.saved ? ", saved" : ""}` : `failed: ${fc.why}`) : "—"],
    ]);
    if (s.limits) { $("torq").min = -s.limits.max_torque_pct; $("torq").max = s.limits.max_torque_pct; }
  }
  if (s.limits) { $("vel").min = -s.limits.max_rpm; $("vel").max = s.limits.max_rpm; }
  if (s.cfg && !cfgFilled) {
    $("usteps").value = String(s.cfg.usteps); $("standstill").value = s.cfg.standstill;
    $("accel").value = s.cfg.accel; $("sgthrs").value = s.cfg.sgthrs; cfgFilled = true;
  }
  if (!limitsFilled && s.limits) {
    $("lim_ma").value = s.limits.max_ma; $("lim_rpm").value = s.limits.max_rpm; $("lim_rev").value = s.limits.soft_revs;
    $("lim_tq").value = s.limits.max_torque_pct;
    $("lim_ma").max = s.limits.hard_max_ma; limitsFilled = true;
  }
}

// ------------------------------------------------------------------ controls
// STOP: button, Esc and Space. Over the WebSocket and again over HTTP, in case one path is mid-reconnect.
const stop = () => {
  api("stop");
  if (tokenGood) setTimeout(() => http("stop", {}).catch(() => {}), 150);
  msg("STOP sent: motor stopping and disabled");
};
$("stop").onclick = stop;
document.addEventListener("keydown", (e) => {
  if (document.body.classList.contains("locked")) return;
  if (e.key === "Escape" || (e.key === " " && !["INPUT", "BUTTON"].includes(document.activeElement.tagName))) { e.preventDefault(); stop(); }
});

$("boards").onclick = async (e) => {
  const uid = e.target.dataset && e.target.dataset.uid;
  if (!uid) return;
  msg("connecting ..."); const r = await api("connect", { uid64: uid }); if (r.ok) msg("connected");
};
$("search").onclick = () => { boardsKey = ""; api("discover"); };
$("hostform").onsubmit = async (e) => {
  e.preventDefault();
  msg("connecting ..."); const r = await api("connect", { host: $("host").value.trim() }); if (r.ok) msg("connected");
};
// Velocity: drag to run, release (or leave the slider) to stop. Sends at most every 100 ms; the bridge caps it.
let velSent = 0, velTimer = null;
const velSend = () => { velTimer = null; velSent = Date.now(); api("vel", { rpm: +$("vel").value }); };
$("vel").oninput = () => {
  $("velval").textContent = `${$("vel").value} rpm`;
  if (!velTimer) velTimer = setTimeout(velSend, Math.max(0, 100 - (Date.now() - velSent)));
};
const velRelease = () => {
  if (+$("vel").value === 0) return;
  $("vel").value = 0; $("velval").textContent = "0 rpm";
  clearTimeout(velTimer); velTimer = null; api("vel", { rpm: 0 });
};
["pointerup", "pointercancel", "blur", "keyup"].forEach((ev) => $("vel").addEventListener(ev, velRelease));
// Torque control. The torque slider works like the velocity slider: drag to apply, release to return to 0 %.
let tqSent = 0, tqTimer = null;
const tqSend = () => { tqTimer = null; tqSent = Date.now(); api("foc", { mode: "torque", pct: +$("torq").value, max_rpm: +$("torqrpm").value }); };
$("torq").oninput = () => {
  $("torqval").textContent = `${$("torq").value} %`;
  if (!tqTimer) tqTimer = setTimeout(tqSend, Math.max(0, 100 - (Date.now() - tqSent)));
};
const tqRelease = () => {
  if (+$("torq").value === 0) return;
  $("torq").value = 0; $("torqval").textContent = "0 %";
  clearTimeout(tqTimer); tqTimer = null; api("foc", { mode: "torque", pct: 0, max_rpm: +$("torqrpm").value });
};
["pointerup", "pointercancel", "blur", "keyup"].forEach((ev) => $("torq").addEventListener(ev, tqRelease));
$("foccal").onclick = async () => {
  if (!confirm("Encoder calibration turns the shaft for about 30 s. Clear the pointer path, then OK.")) return;
  msg("calibrating the encoder (about 30 s) ..."); const r = await api("foc_cal"); if (r.ok) msg("encoder calibrated");
};
$("focoff").onclick = () => api("foc", { mode: "off" });
$("spring").onclick = () => { msg(""); api("foc", { mode: "spring", k: +$("sk").value, d: +$("sd").value,
                                                     detents: +$("sdet").value, detent_pct: +$("sdetp").value }); };
$("servo").onclick = () => { msg(""); api("foc", { mode: "servo", target: +$("servotgt").value, rpm: +$("rpm").value }); };
$("homeneg").onclick = () => { msg(""); api("home", { dir: -1 }); };
$("homepos").onclick = () => { msg(""); api("home", { dir: 1 }); };
$("standstill").onchange = () => api("standstill", { mode: $("standstill").value });
$("applyset").onclick = async () => {
  const r = await api("settings", { usteps: +$("usteps").value, accel: +$("accel").value, sgthrs: +$("sgthrs").value });
  if (r.ok) { cfgFilled = false; msg("settings applied"); }
};
$("savecfg").onclick = async () => { const r = await api("cfg_save"); if (r.ok) msg("saved on the board"); };
$("enable").onclick = async () => { msg(""); const r = await api("enable"); if (r.ok) msg("motor enabled"); };
$("disable").onclick = () => api("disable");
$("zero").onclick = () => api("zero");
$("clcal").onclick = async () => {
  if (!confirm("Calibration turns the shaft +1 rev and back. Clear the pointer path, then OK.")) return;
  msg("calibrating ..."); const r = await api("cl_cal"); if (r.ok) msg("calibrated");
};
$("clon").onclick = () => api("cl_set", { on: true });
$("cloff").onclick = () => api("cl_set", { on: false });
$("clsync").onclick = () => api("cl_sync");
$("setstall").onclick = () => { msg(""); api("cl_stall", { fullsteps: +$("stall").value }); };
$("goto").onclick = () => { msg(""); api("goto", { rev: +$("gototgt").value, rpm: +$("rpm").value }); };
$("clearalarm").onclick = () => api("clear_alarm");
document.querySelectorAll("[data-jog]").forEach((b) => (b.onclick = () => { msg(""); api("jog", { revs: +b.dataset.jog, rpm: +$("rpm").value }); }));
$("move").onclick = () => { msg(""); api("move", { revs: +$("target").value, rpm: +$("rpm").value }); };
$("setma").onclick = () => { msg(""); api("current", { ma: +$("ma").value }); };
$("setlim").onclick = async () => {
  const r = await api("limits", { max_ma: +$("lim_ma").value, max_rpm: +$("lim_rpm").value, soft_revs: +$("lim_rev").value,
                                   max_torque_pct: +$("lim_tq").value });
  if (r.ok) { limitsFilled = false; msg("limits applied"); }
};
$("conform").onsubmit = async (e) => {
  e.preventDefault();
  const line = $("conline").value.trim();
  if (!line) return;
  const r = await api("console", { line });
  $("console").textContent += `> ${line}\n` + (r.ok ? r.lines.join("\n") : `refused: ${r.error}`) + "\n";
  $("console").scrollTop = 1e9;
  $("conline").value = "";
};
$("exportlog").onclick = async () => {
  try {
    const r = await fetch(`${httpBase()}/api/log`, { headers: { "X-CM-Token": token } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = `ss17-v11-session-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.log`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (e) { msg(`log export failed: ${e.message || e}`); }
};

// ------------------------------------------------------------------ start
function start() {
  if (started) return;
  started = true;
  document.body.classList.remove("locked");
  if (MODE === "local") {
    $("paircode").hidden = false;
    $("paircode").textContent = `Pairing code ${token}`;
    $("paircode").title = "For the hosted app: it asks for this code. New every time the bridge starts.";
    openWs();
  } else {
    $("bport").value = port;
    findBridge();
  }
  setInterval(() => { if (wsReady || tokenGood) api("heartbeat"); }, 500);   // bridge stops the motor if this stops for 2 s
}

if (window.top !== window.self) {          // never run inside someone else's frame (no frame-ancestors on Pages)
  document.body.textContent = "This page can't run inside a frame.";
} else if (MODE === "hosted" && store.get("cm-gate") !== "ok") { $("gate").hidden = false; $("gatepw").focus(); }
else start();
