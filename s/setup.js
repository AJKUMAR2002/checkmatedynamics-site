// Checkmate setup page (founder S-URL d): pair a board over Web Bluetooth and give it Wi-Fi. Nothing else.
// No motor control, no bridge, no network requests (CSP connect-src 'none'). Protocol logic lives in pair.js (tested).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const show = (id, on) => { $(id).hidden = !on; };
  const msg = (t) => { $("msg").textContent = t || ""; };
  const ARROWS = ["↑", "→", "↓", "←"];
  if (window.top !== window.self) { document.body.textContent = "This page can't run inside a frame."; return; }

  // The label QR opens /s#<key>: read it once, keep it in memory only, and take it out of the address bar.
  let labelKey = null;
  function readKey() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return false;
    try { SS17Pair.normaliseSetupKey(h); labelKey = h; } catch { /* not a key */ }
    history.replaceState(null, "", location.pathname + location.search);
    return !!labelKey;
  }
  readKey();
  window.addEventListener("hashchange", () => { if (readKey()) keyLoaded(); });   // page already open when scanned

  let session = null, code = [], lastJoin = {}, nets = {};

  function reset(text) {
    ["code", "net", "done", "retry"].forEach((id) => show(id, false));
    show("start", true);
    msg(text || "");
  }

  function onEvent(kind, m) {
    if (kind === "found") { msg(`Found ${m.name || "your board"}. Pairing ...`); session.pair(); }
    else if (kind === "code") {
      code = m.dirs;
      $("arrows").innerHTML = code.map((d) => `<span>${ARROWS[d]}</span>`).join("");
    } else if (kind === "pair") {
      if (m.state === "setup_checking") msg("Checking the setup key with the board ...");
      else if (m.state === "enter_code") {
        show("start", false); show("code", true);
        const dial = (m.inputs || []).includes("dial");
        $("dialnums").textContent = dial ? code.map((d) => d + 1).join(" · ") + " clicks" : "";
        msg(dial ? "Turn the shaft that many clicks for each number, changing direction between numbers, or press the arrows on the board's switch."
          : "Press these arrows on the board's switch, in order. CENTER removes the last one.");
      } else if (m.state === "entry") [...$("arrows").children].forEach((el, i) => el.classList.toggle("on", i < m.n));
      else if (m.state === "entered") msg("Checking the code with the board ...");
      else if (m.state === "confirmed") {
        show("start", false); show("code", false); show("net", true);
        msg(m.via === "setup" ? "Paired with the setup key. Choose the network for this motor." : "Paired. Choose the network for this motor.");
        nets = {}; $("netsel").innerHTML = '<option value="">scanning ...</option>'; session.scan();
      }
    } else if (kind === "net") {
      const prev = nets[m.ssid];
      if (m.ssid && (!prev || m.rssi > prev.rssi)) nets[m.ssid] = m;
    } else if (kind === "scan" && m.state === "done") {
      const opt = (n) => { const o = document.createElement("option"); o.value = n.ssid; o.textContent = `${n.ssid} · ${n.rssi} dBm · ${n.secure ? "secured" : "open"}`; return o; };
      $("netsel").replaceChildren(...Object.values(nets).sort((a, b) => b.rssi - a.rssi).map(opt));
      if (!$("netsel").options.length) $("netsel").innerHTML = '<option value="">no networks found</option>';
    } else if (kind === "wifi") {
      if (m.state === "joining") msg(`Joining ${m.ssid} ...`);
      else if (m.state === "connected") {
        session.done();
        show("net", false); show("done", true); msg("");
        $("donemsg").textContent = `${lastJoin.name || (session.info && session.info.name) || "Your board"} joined ${lastJoin.ssid} as ${m.ip}.`;
      } else if (m.state === "failed") msg(m.why === "decrypt" ? "The board couldn't decrypt the password: start again." : `Couldn't join (${m.why}). Check the password and try again.`);
    } else if (kind === "need_key") {
      reset(m.message); show("keyentry", true); $("setupkey").focus();
    } else if (kind === "failed" || kind === "rejected") {
      show("code", false); show("net", false); show("retry", true); msg(m.message);
      if (/setup key/.test(m.message || "")) { show("start", true); show("keyentry", true); }
    } else if (kind === "disconnected" && $("done").hidden) msg("Bluetooth disconnected. Try again.");
  }

  async function begin(key) {
    show("retry", false);
    if (!SS17Pair.PairSession.supported()) {
      msg("This browser can't use Bluetooth. Use Chrome on Android or a computer. On iPhone, join the board's own Wi-Fi network (SS17-XXXX: hold CENTER while powering it up) and follow the page it opens.");
      return;
    }
    if (session) session.disconnect();
    session = new SS17Pair.PairSession(onEvent, key);
    msg("Choose your board in the browser's list.");
    try { await session.find(); } catch (e) { msg(`No board chosen (${e.message || e}).`); }
  }

  $("go").onclick = () => {
    const typed = $("setupkey").value.trim();
    $("setupkey").value = "";
    let key = labelKey;
    labelKey = null;                                             // one setup per scan
    if (!key && typed) {
      try { SS17Pair.normaliseSetupKey(typed); key = typed; } catch (e) { msg(e.message); return; }
    }
    if (!key) { msg("Scan the QR on the motor's label or on the card in the box, or type the code printed under it."); show("keyentry", true); return; }
    begin(key);
  };
  $("lostlabel").onclick = () => {
    msg("Without the label or the card, hold CENTER on the board for 3 s first (this opens setup by hand), then continue. The code you'll enter on the board is weaker than the label key.");
    labelKey = null;
    begin(null);                                                 // v3: dial or arrows on the board
  };
  $("retry").onclick = () => reset("");
  $("join").onclick = async () => {
    const ssid = $("netsel").value, pass = $("netpass").value, name = $("boardname").value.trim();
    $("netpass").value = "";                                     // never keep the password on the page
    if (!ssid) { msg("Choose a network."); return; }
    lastJoin = { ssid, name };
    try { await session.join(ssid, pass, name); } catch (e) { msg(`Error: ${e.message || e}`); }
  };

  function keyLoaded() {
    $("keynote").textContent = "The setup key from your label is loaded. Tap below and pick the board: nothing to press on it.";
    show("keyentry", false);
  }
  show("start", true);
  if (labelKey) keyLoaded();
  else { $("keynote").textContent = "Scan the QR on the motor's label or on the card in the box with your phone camera, or type the code printed under it."; show("keyentry", true); }
})();
