// SS17 Bluetooth pairing v2 (firmware API.md "Bluetooth pairing"): Web Bluetooth + Web Crypto, no libraries.
// 1 pair{commit = SHA-256(clientPub)}  ->  pair{state:key, pub: boardPub}
// 2 reveal{pub: clientPub}             ->  pair{state:enter_code}; the user presses 6 arrows on the board's switch
// 3 confirmed -> scan -> wifi{ssid, iv, ct = AES-256-GCM(key, iv, password, AAD = ssid)} -> connected + ip
// key = HKDF-SHA256(ECDH P-256 x-coordinate, salt = uid64 (8 bytes BE), info = "ss17-pair-v2").
// The passkey (6 directions from SHA-256(clientPub || boardPub)) authenticates the key exchange; the password only
// leaves this page encrypted, and is never logged.
(function (root) {
  "use strict";
  const SVC = "c4d10001-5517-4a8e-9b1e-7e0c2f6a1701";
  const INFO = "c4d10002-5517-4a8e-9b1e-7e0c2f6a1701";
  const CTRL = "c4d10003-5517-4a8e-9b1e-7e0c2f6a1701";
  const STATUS = "c4d10004-5517-4a8e-9b1e-7e0c2f6a1701";
  const HKDF_INFO = "ss17-pair-v2";
  const subtle = () => (root.crypto || globalThis.crypto).subtle;
  const enc = new TextEncoder();
  const b64 = (u8) => btoa(String.fromCharCode(...u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hexBytes = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));

  // ---------------------------------------------------------------- crypto (pure; unit-tested against a Python board)
  async function newClientKey() {
    const keyPair = await subtle().generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    const pub = new Uint8Array(await subtle().exportKey("raw", keyPair.publicKey));
    return { keyPair, pub };
  }
  async function commitOf(pub) {
    return new Uint8Array(await subtle().digest("SHA-256", pub));
  }
  async function passkey(clientPub, boardPub) {   // six directions 0 up, 1 right, 2 down, 3 left
    const both = new Uint8Array(clientPub.length + boardPub.length);
    both.set(clientPub, 0); both.set(boardPub, clientPub.length);
    const h = new Uint8Array(await subtle().digest("SHA-256", both));
    const bits = (h[0] << 4) | (h[1] >> 4);
    return [0, 1, 2, 3, 4, 5].map((i) => (bits >> (10 - 2 * i)) & 3);
  }
  async function sessionKey(privateKey, boardPub, uid64hex) {
    const pub = await subtle().importKey("raw", boardPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const bits = await subtle().deriveBits({ name: "ECDH", public: pub }, privateKey, 256);
    const hk = await subtle().importKey("raw", bits, "HKDF", false, ["deriveKey"]);
    return subtle().deriveKey({ name: "HKDF", hash: "SHA-256", salt: hexBytes(uid64hex), info: enc.encode(HKDF_INFO) },
      hk, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  }
  async function encryptPassword(key, ssid, password) {
    const iv = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(ssid) },
      key, enc.encode(password)));
    return { iv: b64(iv), ct: b64(ct) };
  }

  // ---------------------------------------------------------------- Bluetooth session
  class PairSession {
    constructor(onEvent) {
      this.onEvent = onEvent;          // (kind, data) -> UI
      this.ctrl = null; this.info = null; this.client = null; this.key = null; this.boardPub = null; this.dev = null;
      this.waiters = [];               // [pred, resolve] for replies the flow must wait on (e.g. name saved)
    }
    static supported() { return !!(root.navigator && root.navigator.bluetooth); }
    async find() {
      this.dev = await navigator.bluetooth.requestDevice({ filters: [{ services: [SVC] }] });
      this.dev.addEventListener("gattserverdisconnected", () => this.onEvent("disconnected", {}));
      const gatt = await this.dev.gatt.connect();
      const svc = await gatt.getPrimaryService(SVC);
      this.info = JSON.parse(new TextDecoder().decode(await (await svc.getCharacteristic(INFO)).readValue()));
      this.ctrl = await svc.getCharacteristic(CTRL);
      const st = await svc.getCharacteristic(STATUS);
      st.addEventListener("characteristicvaluechanged", (e) => {
        let m;
        try { m = JSON.parse(new TextDecoder().decode(e.target.value)); } catch { return; }
        this.handle(m).catch((err) => this.onEvent("error", { message: String(err) }));
      });
      await st.startNotifications();
      this.onEvent("found", this.info);
      return this.info;
    }
    async send(obj) {
      await this.ctrl.writeValueWithResponse(enc.encode(JSON.stringify(obj)));
    }
    async pair() {
      this.client = await newClientKey();
      this.key = null; this.boardPub = null;
      await this.send({ cmd: "pair", commit: b64(await commitOf(this.client.pub)) });
    }
    waitFor(pred, ms) {
      return new Promise((resolve, reject) => {
        const w = [pred, resolve];
        this.waiters.push(w);
        setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); reject(new Error("the board didn't answer")); }, ms);
      });
    }
    async handle(m) {
      for (const w of this.waiters.filter(([pred]) => pred(m))) { this.waiters = this.waiters.filter((x) => x !== w); w[1](m); }
      if (m.t === "pair" && m.state === "key") {
        this.boardPub = unb64(m.pub);
        this.key = await sessionKey(this.client.keyPair.privateKey, this.boardPub, this.info.uid64);
        this.onEvent("code", { dirs: await passkey(this.client.pub, this.boardPub) });
        await this.send({ cmd: "reveal", pub: b64(this.client.pub) });
      } else if (m.t === "pair") {
        this.onEvent("pair", m);          // enter_code, entry{n}, wrong_code{tries_left}, confirmed, failed{why}, timeout
      } else if (m.t === "net") {
        this.onEvent("net", m);
      } else if (m.t === "scan" || m.t === "wifi" || m.t === "name" || m.t === "error") {
        this.onEvent(m.t, m);
      }
    }
    scan() { return this.send({ cmd: "scan" }); }
    async join(ssid, password, name) {
      if (name) {                      // name first, and wait for it: the board's first UDP HELLO then carries it
        const saved = this.waitFor((m) => m.t === "name" && m.state === "saved", 3000);
        await this.send({ cmd: "name", name });
        await saved;
      }
      if (!password) return this.send({ cmd: "wifi", ssid });             // open network
      if (!this.key) throw new Error("not paired yet");
      const { iv, ct } = await encryptPassword(this.key, ssid, password);
      return this.send({ cmd: "wifi", ssid, iv, ct });
    }
    done() { return this.send({ cmd: "done" }).catch(() => {}); }
    disconnect() { try { if (this.dev && this.dev.gatt.connected) this.dev.gatt.disconnect(); } catch { /* ignore */ } }
  }

  const api = { SVC, HKDF_INFO, b64, unb64, newClientKey, commitOf, passkey, sessionKey, encryptPassword, PairSession };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SS17Pair = api;
})(typeof window !== "undefined" ? window : globalThis);
