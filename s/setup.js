// Checkmate setup page (founder S-URL d): pair a board over Web Bluetooth and give it Wi-Fi. Nothing else.
// No motor control, no bridge, no network requests (CSP connect-src 'none'). Protocol logic lives in pair.js (tested).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const show = (id, on) => { $(id).hidden = !on; };
  const msg = (t) => { $("msg").textContent = t || ""; };
  const ARROWS = ["↑", "→", "↓", "←"];
  if (window.top !== window.self) { document.body.textContent = "This page can't run inside a frame."; return; }

  // The label QR opens /s?p=<product>#<key>: read the key once, keep it in memory only, and take it out of the address bar.
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

  let session = null, code = [], lastJoin = {}, nets = {}, joined = false;
  // AP2/R2 (pairing v5): the label names the product; public, so it may stay in the address bar
  const PRODUCT_NAMES = { ss17: "SmartStepper 17", ss23: "SmartStepper 23", ssg: "SmartServo G", hub4: "Hub 4", hub8: "Hub 8 Pro" };
  const params = new URLSearchParams(location.search);
  const product = params.get("p");
  const productName = PRODUCT_NAMES[product] || null;
  // Pairing v5 guest invite (10.4.9): the owner's QR is /s?p=<product>&i=1#<G>. G is used like a label key, once.
  const invite = params.get("i") === "1";
  const hold = SS17Pair.holdText(product);
  if (invite) $("title").textContent = `Join ${productName ? "a " + productName : "a board"}`;
  else if (productName) $("title").textContent = `Set up your ${productName}`;
  // R5 (founder, Oct 14): remember ONLY the last network name, never a password. The one storage key on this page.
  const SSID_KEY = "cm.lastSsid";
  const lastSsid = () => { try { return localStorage.getItem(SSID_KEY); } catch { return null; } };
  const rememberSsid = (s) => { try { localStorage.setItem(SSID_KEY, s); } catch { /* private mode: fine */ } };

  function reset(text) {
    ["code", "net", "done", "retry"].forEach((id) => show(id, false));
    show("start", true);
    msg(text || "");
  }

  function onEvent(kind, m) {
    if (kind === "found") { msg(`Found ${m.name || "your board"}. Pairing ...`); session.pair(); }
    else if (kind === "invite" && m.state === "committed") {   // 10.4.9a r15: added; the guest link ends here
      ["code", "net", "invitecode", "start", "retry"].forEach((id) => show(id, false));
      joined = true; session.disconnect();
      msg("Added: this phone is now an owner of the board. This page keeps no keys, so set up Wi-Fi from the Checkmate app or the owner's phone.");
    }
    else if (kind === "invite") {                       // the guest fp as four words, the same on the owner's screen
      show("start", false); show("invitecode", true);
      $("words").textContent = (m.words || []).join(" ");
      msg("Waiting for the owner to approve this phone.");
    }
    else if (kind === "code") {
      code = m.dirs;
      $("arrows").innerHTML = code.map((d) => `<span>${ARROWS[d]}</span>`).join("");
    } else if (kind === "pair") {
      if (m.state === "setup_checking") msg("Checking the setup key with the board ...");
      else if (m.state === "invite_checking") msg("Checking the invite with the board ...");
      else if (m.state === "invite_accepted") msg("The board accepted the invite. Asking the owner to approve this phone ...");
      else if (m.state === "enter_code" && !m.ready) { show("start", false); show("code", false); msg("Getting the board ready ..."); }
      else if (m.state === "enter_code") {
        show("start", false); show("code", true);
        const dial = (m.inputs || []).includes("dial");
        $("dialnums").textContent = dial ? code.map((d) => d + 1).join(" · ") + " clicks" : "";
        msg(dial ? "Turn the shaft that many clicks for each number, changing direction between numbers, or press the arrows on the board's switch."
          : "Press these arrows on the board's switch, in order. CENTER removes the last one.");
      } else if (m.state === "entry") [...$("arrows").children].forEach((el, i) => el.classList.toggle("on", i < m.n));
      else if (m.state === "entered") msg("Checking the code with the board ...");
      else if (m.state === "confirmed") {
        show("start", false); show("code", false); show("invitecode", false); show("net", true);
        msg(m.via === "invite" ? "Approved: this phone can set the board up. Choose its network."
          : m.via === "setup" ? "Paired with the setup key. Choose the network for this motor." : "Paired. Choose the network for this motor.");
        nets = {}; $("netsel").innerHTML = '<option value="">scanning ...</option>'; session.scan();
      }
    } else if (kind === "net") {
      const prev = nets[m.ssid];
      if (m.ssid && (!prev || m.rssi > prev.rssi)) nets[m.ssid] = m;
    } else if (kind === "scan" && m.state === "done") {
      const opt = (n) => { const o = document.createElement("option"); o.value = n.ssid; o.textContent = `${n.ssid} · ${n.rssi} dBm · ${n.secure ? "secured" : "open"}`; return o; };
      $("netsel").replaceChildren(...Object.values(nets).sort((a, b) => b.rssi - a.rssi).map(opt));
      const prev = lastSsid();
      if (prev && nets[prev]) { $("netsel").value = prev; msg(`Same Wi-Fi as last time (${prev})? Type its password and tap Join.`); }
      if (!$("netsel").options.length) $("netsel").innerHTML = '<option value="">no networks found</option>';
    } else if (kind === "wifi") {
      if (m.state === "joining") msg(`Joining ${m.ssid} ...`);
      else if (m.state === "connected") {
        if (lastJoin.ssid) rememberSsid(lastJoin.ssid);
        session.done();
        show("net", false); show("done", true); msg("");
        $("donemsg").textContent = `${lastJoin.name || (session.info && session.info.name) || "Your board"} joined ${lastJoin.ssid} as ${m.ip}.`;
      } else if (m.state === "failed") msg(m.why === "decrypt" ? "The board couldn't decrypt the password: start again." : `Couldn't join (${m.why}). Check the password and try again.`);
    } else if (kind === "invite_ended") {               // single use: a retry needs a new QR from the owner
      ["code", "net", "invitecode", "start", "retry"].forEach((id) => show(id, false));
      msg(m.message);
    } else if (kind === "need_key") {
      reset(m.message); show("keyentry", true); $("setupkey").focus();
    } else if (kind === "failed" || kind === "rejected" || kind === "motor_enabled") {   // every pair.js fail() state
      show("code", false); show("net", false); show("retry", true); msg(m.message);
      if (/setup key/.test(m.message || "")) { show("start", true); show("keyentry", true); }
    } else if (kind === "disconnected" && $("done").hidden && !joined) msg("Bluetooth disconnected. Try again.");
  }

  async function begin(key) {
    show("retry", false);
    if (!SS17Pair.PairSession.supported()) {
      if (invite) msg("This browser can't use Bluetooth, and invites work over Bluetooth only. Open the link in Chrome on Android or on a computer.");
      else msg(`This browser can't use Bluetooth. Use Chrome on Android or a computer.${softap()}`);
      return;
    }
    if (session) session.disconnect();
    session = new SS17Pair.PairSession(onEvent, key, product,
      invite ? { invite: true, name: $("guestname").value.trim().slice(0, 24) } : {});
    msg(key ? "Choose your board in the browser's list." : `First ${hold} (that opens setup by hand). Then choose your board in the browser's list.`);
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
    if (invite && !key) { msg("This invite link has no code, or it was used already: ask the owner for a new QR."); return; }
    if (!key) { msg("Scan the QR on the motor's label or on the card in the box, or type the code printed under it."); show("keyentry", true); return; }
    begin(key);
  };
  $("lostlabel").onclick = () => {
    msg(`Without the label or the card, first ${hold} (this opens setup by hand), then continue. The code you'll enter on the board is weaker than the label key.`);
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

  // The SS17 / SS23 Wi-Fi setup network is for phones without Web Bluetooth (label key only, never an invite).
  function softap() {
    if (product === "ss17") return " On iPhone, join the motor's own Wi-Fi network (SS17-XXXX: hold CENTER while powering it up, release within 2 s) and follow the page it opens.";
    if (product === "ss23") return " On iPhone, join the motor's own Wi-Fi network (SS23-XXXX: hold the PAIR button while powering it up, release within 2 s) and follow the page it opens.";
    return "";
  }

  function keyLoaded() {
    if (invite) {
      $("keynote").textContent = `An owner invited this phone to their ${productName || "board"}. Name this phone, tap below and pick the board. The owner then approves it on their screen.`;
      show("guestrow", true); show("lostlabel", false); $("go").textContent = "Join this board";
    } else {
      $("keynote").textContent = `The setup key from your label is loaded. If the ${productName || "motor"} is new, plug it in (that opens setup), then tap below and pick it: nothing to press on it.`;
    }
    show("keyentry", false);
  }
  show("start", true);
  if (SS17Pair.NO_RADIO[product] && !invite) {         // SS-G and Hub 8 Pro have no radio: they set up over a hub or USB
    show("start", false);
    msg(`The ${productName} has no Bluetooth: it sets up through a hub or a USB cable. A new one opens setup by itself when you plug it into a Hub 4, a Hub 8 Pro or a computer running Checkmate Link. Already owned? First ${hold}, then add it in the Checkmate app.`);
  } else if (labelKey) keyLoaded();
  else if (invite) { msg("This invite link has no code, or it was used already: ask the owner for a new QR."); show("start", false); }
  else { $("keynote").textContent = `Scan the QR on the ${productName ? productName + "'s" : "motor's"} label or on the card in the box with your phone camera, or type the code printed under it.`; show("keyentry", true); }
})();
