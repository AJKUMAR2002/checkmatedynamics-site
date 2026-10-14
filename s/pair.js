// SS17 Bluetooth pairing in the browser (Web Bluetooth + Web Crypto, no libraries). Mirrors the bridge's blepair.py.
// v3 (inbox #93): the page draws a RANDOM code (founder: 4 arrows; the length comes from enter_code.len); the user presses
//   it on the board; one commitment round per arrow (HMAC-SHA256, Bluetooth SC passkey-entry style) proves both sides saw
//   the same arrows. "confirmed" alone is never trusted: a fake or relaying board must guess every arrow (1 in 256 for 4).
// v2 (older firmware): code derived from both public keys, unauthenticated confirm: marked authenticated=false.
// key = HKDF-SHA256(ECDH P-256 x-coordinate, salt = uid64 (8 bytes BE), info = "ss17-pair-v3" | "ss17-pair-v2").
// The password only leaves this page encrypted (AES-256-GCM, AAD = SSID) and is never logged.
(function (root) {
  "use strict";
  const SVC = "c4d10001-5517-4a8e-9b1e-7e0c2f6a1701";
  const INFO = "c4d10002-5517-4a8e-9b1e-7e0c2f6a1701";
  const CTRL = "c4d10003-5517-4a8e-9b1e-7e0c2f6a1701";
  const STATUS = "c4d10004-5517-4a8e-9b1e-7e0c2f6a1701";
  const cr = () => root.crypto || globalThis.crypto;
  const subtle = () => cr().subtle;
  const enc = new TextEncoder();
  const b64 = (u8) => btoa(String.fromCharCode(...u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hexBytes = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));
  const cat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
  const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  // ---------------------------------------------------------------- crypto (pure; unit-tested against Python)
  async function newClientKey() {
    const keyPair = await subtle().generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    return { keyPair, pub: new Uint8Array(await subtle().exportKey("raw", keyPair.publicKey)) };
  }
  const sha256 = async (u8) => new Uint8Array(await subtle().digest("SHA-256", u8));
  const commitOf = (pub) => sha256(pub);
  async function passkey(clientPub, boardPub) {          // v2: derived from public keys (not secret)
    const h = await sha256(cat(clientPub, boardPub));
    const bits = (h[0] << 4) | (h[1] >> 4);
    return [0, 1, 2, 3, 4, 5].map((i) => (bits >> (10 - 2 * i)) & 3);
  }
  function randomCode(n = 4) {                           // v3: secret, from the CSPRNG
    const b = cr().getRandomValues(new Uint8Array(n));
    return Array.from(b, (x) => x & 3);
  }
  async function roundCommit(nonce, x, y, r) {          // C(N, X, Y, r) = HMAC-SHA256(key = N, X || Y || [r])
    const k = await subtle().importKey("raw", nonce, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await subtle().sign("HMAC", k, cat(x, y, Uint8Array.of(r))));
  }
  async function sessionKey(privateKey, boardPub, uid64hex, version = 3) {
    const pub = await subtle().importKey("raw", boardPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const bits = await subtle().deriveBits({ name: "ECDH", public: pub }, privateKey, 256);
    const hk = await subtle().importKey("raw", bits, "HKDF", false, ["deriveKey"]);
    return subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt: hexBytes(uid64hex), info: enc.encode(version >= 3 ? "ss17-pair-v3" : "ss17-pair-v2") },
      hk, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  }
  async function encryptPassword(key, ssid, password, aad) {
    const iv = cr().getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv, additionalData: aad || enc.encode(ssid) }, key, enc.encode(password)));
    return { iv: b64(iv), ct: b64(ct) };
  }


  // ---------------------------------------------------------------- v4: printed setup key (docs/pairing-v4-setup-key.md)
  const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  function normaliseSetupKey(code) {           // -> 20 ASCII bytes, or throws
    const c = String(code).toUpperCase().replace(/[-\s]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
    if (c.length !== 20 || [...c].some((ch) => !CROCKFORD.includes(ch))) throw new Error("a setup key is 20 characters: 0-9 and A-Z without I, L, O, U");
    return enc.encode(c);
  }
  function checkPoint(pub) {
    if (pub.length !== 65 || pub[0] !== 4) throw new Error("bad public key");   // importKey also rejects off-curve points
    return pub;
  }
  async function v4Keys(privateKey, pka, pkb, uid64hex, s) {
    const peer = await subtle().importKey("raw", pkb, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const x = new Uint8Array(await subtle().deriveBits({ name: "ECDH", public: peer }, privateKey, 256));
    const salt = await sha256(cat(hexBytes(uid64hex), pka, pkb));
    const hk = await subtle().importKey("raw", cat(x, s), "HKDF", false, ["deriveKey"]);
    const conf = await subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("ss17-pair-v4 conf") }, hk,
      { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign"]);
    const sess = await subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("ss17-pair-v4 sess") }, hk,
      { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    return { conf, sess };
  }
  async function v4Mac(conf, label, uid64hex, first, second) {
    return new Uint8Array(await subtle().sign("HMAC", conf, cat(enc.encode(label), hexBytes(uid64hex), Uint8Array.of(4), first, second)));
  }
  const v4WifiAad = (uid64hex, ssid) => cat(enc.encode("ss17-v4 wifi"), hexBytes(uid64hex), enc.encode(ssid));
  // Pairing v5 advert (platform-spec §10.4.1, AP3): tag = trunc24(HMAC(K_adv, nonce)), K_adv = HKDF(S, "", "cmd-adv-v5").
  // UX only (it narrows the chooser); the v4 exchange is the proof.
  const PRODUCTS = { ss17: 1, ss23: 2, ssg: 3, hub4: 4, hub8: 5 };
  async function advTag(setupKey, nonce) {
    const hk = await subtle().importKey("raw", normaliseSetupKey(setupKey), "HKDF", false, ["deriveKey"]);   // 20 ASCII bytes
    const k = await subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode("cmd-adv-v5") }, hk,
      { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign"]);
    return new Uint8Array(await subtle().sign("HMAC", k, nonce)).slice(0, 3);
  }
  function deviceFilters(product) {      // serviceData is ignored where unsupported: the services match still applies
    const f = { services: [SVC] };
    if (PRODUCTS[product]) f.serviceData = [{ service: SVC, dataPrefix: Uint8Array.of(1, PRODUCTS[product]), mask: Uint8Array.of(0x07, 0xff) }];
    return [f];
  }

  // ---------------------------------------------------------------- protocol (transport-agnostic; `send(obj)` is async)
  class PairCore {
    constructor(send, uid64, onEvent, setupKey) {
      this.send = send; this.uid64 = uid64; this.onEvent = onEvent || (() => {});
      this.setupKey = setupKey ? normaliseSetupKey(setupKey) : null;      // v4: from the label, kept in memory only
      this.state = "idle"; this.version = 0; this.authenticated = false; this.attempts = 0;
    }
    async start(notice = "") {
      this.client = await newClientKey();
      this.boardPub = null; this.key = null; this.code = []; this.rounds = 0; this.roundsOk = false;
      this.na = []; this.cb = []; this.authenticated = false; this.notice = notice; this.attempts += 1;
      this.state = "pairing"; this.wifiSent = false; this.via = "";
      await this.send({ cmd: "pair", v: this.setupKey ? 4 : 3, commit: b64(await commitOf(this.client.pub)) });
    }
    async useKey(code) { this.setupKey = normaliseSetupKey(code); return this.start("Using the setup key."); }
    async lostLabel() { this.setupKey = null; return this.start("Using the dial code (weaker than the label key)."); }
    async _v4key(m) {
      try { this.boardPub = checkPoint(unb64(m.pub)); } catch { await this.send({ cmd: "cancel" }).catch(() => {}); return this.fail("rejected", "The board sent an invalid key. Stop."); }
      // Holding the label key means v4 or nothing: never let a board talk us down (validator finding 1).
      if (m.v !== 4 || m.setup !== true) { await this.send({ cmd: "cancel" }).catch(() => {}); return this.fail("rejected", "This board didn't offer setup-key pairing, so it may not be your board. Stop."); }
      this.version = 4;
      const k = await v4Keys(this.client.keyPair.privateKey, this.client.pub, this.boardPub, this.uid64, this.setupKey);
      this.kconf = k.conf; this.key = k.sess; this.state = "setup";
      this.onEvent("pair", { state: "setup_checking" });
      await this.send({ cmd: "reveal", pub: b64(this.client.pub), auth: "setup" });
    }
    fail(state, message) {
      this.state = state; this.key = null;
      this.onEvent(state, { message });
    }
    async handle(m) {
      const t = m.t, st = m.state;
      if (t === "pair" && st === "key" && this.state === "pairing" && !this.boardPub && this.setupKey) {
        await this._v4key(m);
      } else if (t === "pair" && st === "setup_wait" && this.state === "setup") {
        // Our mac goes to a board that hasn't proved itself yet: fine only because S has 100 bits (2^100 offline).
        await this.send({ cmd: "setup_auth", mac: b64(await v4Mac(this.kconf, "ss17-v4-c", this.uid64, this.client.pub, this.boardPub)) });
      } else if (t === "pair" && st === "confirmed" && this.state === "setup") {
        const want = await v4Mac(this.kconf, "ss17-v4-b", this.uid64, this.boardPub, this.client.pub);
        if (!m.mac || !eq(unb64(m.mac), want)) { await this.send({ cmd: "cancel" }).catch(() => {}); return this.fail("rejected", "This board couldn't prove it knows the setup key. Stop: it isn't your board."); }
        this.authenticated = true; this.state = "confirmed"; this.via = "setup"; this.kconf = null;
        this.onEvent("pair", { state: "confirmed", authenticated: true, version: 4, via: "setup" });
      } else if (t === "pair" && st === "failed" && m.why === "motor_enabled") {     // spec §10.4.0 item 3
        this.fail("motor_enabled", "The motor is on. Disable the motor first (press CENTER or Stop), then try again: pairing never runs while the motor is enabled.");
      } else if (t === "pair" && st === "failed" && m.why === "setup") {
        this.fail("failed", "The board didn't accept this setup key. Check the code on the label or card (or scan its QR).");
      } else if (t === "pair" && st === "failed" && m.why === "needs_setup_key") {
        this.fail("need_key", "This board needs its setup key: scan the QR on the motor's label or the box card, or type the code. Lost the label? Hold CENTER 3 s on the board, then choose the dial code.");
      } else if (t === "pair" && st === "key" && this.state === "pairing" && !this.boardPub) {   // once per key
        this.boardPub = unb64(m.pub);
        this.version = m.v === 3 ? 3 : 2;
        this.code = this.version >= 3 ? [] : await passkey(this.client.pub, this.boardPub);   // v3: drawn at enter_code
        this.key = await sessionKey(this.client.keyPair.privateKey, this.boardPub, this.uid64, this.version);
        if (this.version < 3) this.onEvent("code", { dirs: this.code, version: this.version, notice: this.notice });
        await this.send({ cmd: "reveal", pub: b64(this.client.pub) });
      } else if (t === "pair" && st === "enter_code") {
        if (this.version >= 3 && !this.code.length) {
          const n = m.len || 4;
          if (n < 3 || n > 12) return this.fail("failed", `Unexpected code length ${n}: try again.`);
          this.code = randomCode(n);
          this.onEvent("code", { dirs: this.code, version: this.version, notice: this.notice });
        }
        this.state = "enter_code"; this.lastEnter = m;
        this.onEvent("pair", { ...m, ready: m.ready !== false });          // v5 boards send ready:false, then entry_ready
      } else if (t === "pair" && st === "entry_ready" && this.state === "enter_code") {
        this.onEvent("pair", { ...(this.lastEnter || {}), state: "enter_code", ready: true });
      } else if (t === "pair" && st === "entry") {
        this.onEvent("pair", { state: "entry", n: m.n });                                // never show right/wrong (v3)
      } else if (t === "pair" && st === "entered" && this.version >= 3) {
        this.state = "checking"; this.onEvent("pair", m);
        await this.round(0);
      } else if (t === "pk" && this.state === "checking") {
        if (m.i !== this.rounds) return this.fail("failed", "Pairing out of step: try again.");
        this.cb[m.i] = unb64(m.cb);
        await this.send({ cmd: "pk_open", i: m.i, na: b64(this.na[m.i]) });
      } else if (t === "pk_open" && this.state === "checking") {
        if (m.i !== this.rounds || !this.cb[m.i]) return this.fail("failed", "Pairing out of step: try again.");
        const ok = eq(await roundCommit(unb64(m.nb), this.boardPub, this.client.pub, this.code[m.i]), this.cb[m.i]);
        if (!ok) { await this.send({ cmd: "cancel" }).catch(() => {}); return this.fail("rejected", "This board couldn't prove the code. Stop: it may not be the board in front of you."); }
        if (m.i < this.code.length - 1) await this.round(m.i + 1); else this.roundsOk = true;
      } else if (t === "pair" && st === "confirmed") {
        if (this.version >= 3 && !this.roundsOk) { await this.send({ cmd: "cancel" }).catch(() => {}); return this.fail("rejected", "The board said 'confirmed' without proving the code. Stop."); }
        this.authenticated = this.version >= 3; this.state = "confirmed";
        this.onEvent("pair", { state: "confirmed", authenticated: this.authenticated, version: this.version });
      } else if (t === "pair" && st === "wrong_code") {
        if (this.version >= 3) return this.start("Wrong arrows. Here's a new code.");    // never reuse a code
        this.state = "enter_code"; this.onEvent("pair", m);
      } else if (t === "pair" && st === "cancelled") {
        /* our own cancel acknowledged */
      } else if (t === "pair" && (st === "failed" || st === "timeout")) {
        this.fail("failed", st === "timeout" ? "Time ran out. Try again." : `Pairing failed (${m.why || "?"}). Try again.`);
      } else {
        this.onEvent(t, m);                                                            // net, scan, wifi, name, error
      }
    }
    async round(i) {
      this.rounds = i;
      if (!this.na[i]) this.na[i] = cr().getRandomValues(new Uint8Array(16));
      await this.send({ cmd: "pk", i, ca: b64(await roundCommit(this.na[i], this.client.pub, this.boardPub, this.code[i])) });
    }
    async wifiMessage(ssid, password) {
      if (this.state !== "confirmed" || !this.key) throw new Error("not paired");
      if (this.wifiSent) throw new Error("Wi-Fi already sent in this session");
      this.wifiSent = true;
      if (!password) return { cmd: "wifi", ssid };
      return { cmd: "wifi", ssid, ...(await encryptPassword(this.key, ssid, password, this.version >= 4 ? v4WifiAad(this.uid64, ssid) : null)) };
    }
  }

  // ---------------------------------------------------------------- Web Bluetooth session
  class PairSession {
    constructor(onEvent, setupKey, product) { this.onEvent = onEvent; this.setupKey = setupKey || null; this.product = product || null; this.ctrl = null; this.info = null; this.dev = null; this.waiters = []; this.queue = Promise.resolve(); }
    static supported() { return !!(root.navigator && root.navigator.bluetooth); }
    async find() {
      this.dev = await navigator.bluetooth.requestDevice({ filters: deviceFilters(this.product) });
      this.dev.addEventListener("gattserverdisconnected", () => this.onEvent("disconnected", {}));
      const gatt = await this.dev.gatt.connect();
      const svc = await gatt.getPrimaryService(SVC);
      this.info = JSON.parse(new TextDecoder().decode(await (await svc.getCharacteristic(INFO)).readValue()));
      if (this.setupKey && this.info.adv && this.info.adv.nonce && this.info.adv.tag) {     // v5 board: is it the label's board?
        const want = await advTag(this.setupKey, hexBytes(this.info.adv.nonce));
        if (!eq(want, hexBytes(this.info.adv.tag))) {
          try { this.dev.gatt.disconnect(); } catch { /* ignore */ }
          throw new Error("That isn't the board on your label. Try again and pick the other one.");
        }
      }
      this.ctrl = await svc.getCharacteristic(CTRL);
      const st = await svc.getCharacteristic(STATUS);
      this.core = new PairCore((o) => this.send(o), this.info.uid64, this.onEvent, this.setupKey);
      this.listener = (e) => {
        let m;
        try { m = JSON.parse(new TextDecoder().decode(e.target.value)); } catch { return; }
        for (const w of this.waiters.filter(([pred]) => pred(m))) { this.waiters = this.waiters.filter((x) => x !== w); w[1](m); }
        this.core.handle(m).catch((err) => this.onEvent("error", { message: String(err) }));
      };
      st.addEventListener("characteristicvaluechanged", this.listener);                // one listener per connection
      this.status = st;
      await st.startNotifications();
      this.onEvent("found", this.info);
      return this.info;
    }
    send(obj) {     // one GATT write at a time ("GATT operation already in progress" otherwise)
      this.queue = this.queue.then(() => this.ctrl.writeValueWithResponse(enc.encode(JSON.stringify(obj))));
      return this.queue;
    }
    waitFor(pred, ms) {
      return new Promise((resolve, reject) => {
        const w = [pred, resolve];
        this.waiters.push(w);
        setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); reject(new Error("the board didn't answer")); }, ms);
      });
    }
    pair() { return this.core.start(); }
    scan() { return this.send({ cmd: "scan" }); }
    async join(ssid, password, name) {
      if (name) {                      // name first, and wait for it: the board's first UDP HELLO then carries it
        const saved = this.waitFor((m) => m.t === "name" && m.state === "saved", 3000);
        await this.send({ cmd: "name", name });
        await saved;
      }
      return this.send(await this.core.wifiMessage(ssid, password));
    }
    done() { return this.send({ cmd: "done" }).catch(() => {}); }
    disconnect() {
      try { if (this.status && this.listener) this.status.removeEventListener("characteristicvaluechanged", this.listener); } catch { /* ignore */ }
      try { if (this.dev && this.dev.gatt.connected) this.dev.gatt.disconnect(); } catch { /* ignore */ }
    }
  }

  const api = { SVC, b64, unb64, newClientKey, commitOf, passkey, randomCode, roundCommit, sessionKey, encryptPassword,
    normaliseSetupKey, v4Keys, v4Mac, v4WifiAad, advTag, deviceFilters, PRODUCTS, PairCore, PairSession };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SS17Pair = api;
})(typeof window !== "undefined" ? window : globalThis);
