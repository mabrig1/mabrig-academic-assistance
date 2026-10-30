"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./filebridge.css";

type Role = "host" | "guest";
type Session = { roomId: string; role: Role; key: string; code?: string; expiresInMinutes: number };
type Signal = { id: string; from: Role; kind: "offer" | "answer"; sdp: string };
type StoredDownload = { name: string; bytes: number; url: string };

const MAX_FILE = 100 * 1024 * 1024; // The browser receiver assembles each file in memory.
const CHUNK = 16 * 1024;

function friendlyBytes(n: number) {
  return n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : (n / 1024).toFixed(1) + " KB";
}

function verifiedLocalAddress(value: string) {
  try {
    const url = new URL(value.startsWith("http://") ? value : "http://" + value);
    if (url.protocol !== "http:" || url.username || url.password || url.search || url.hash || !url.port) return null;
    const bits = url.hostname.split(".").map(Number);
    const privateIP = bits.length === 4 && bits.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (bits[0] === 10 || (bits[0] === 172 && bits[1] >= 16 && bits[1] <= 31) ||
       (bits[0] === 192 && bits[1] === 168));
    return privateIP ? url.origin + "/" : null;
  } catch { return null; }
}

async function iceReady(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => { peer.removeEventListener("icegatheringstatechange", onIce); resolve(); }, 12_000);
    function onIce() {
      if (peer.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", onIce);
        resolve();
      }
    }
    peer.addEventListener("icegatheringstatechange", onIce);
  });
}

export default function FileBridgeTransfer() {
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<Session | null>(null);
  const [message, setMessage] = useState("Start a room on one device, then join from another device.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [downloads, setDownloads] = useState<StoredDownload[]>([]);
  const [localAddress, setLocalAddress] = useState("");
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const roomRef = useRef<Session | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollBusyRef = useRef(false);
  const processedRef = useRef(new Set<string>());
  const processingRef = useRef(false);
  const receiverRef = useRef<{ name: string; size: number; received: number; chunks: ArrayBuffer[] } | null>(null);
  const downloadsRef = useRef<StoredDownload[]>([]);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const code = new URLSearchParams(window.location.search).get("code") || "";
    if (/^\d{8}$/.test(code)) setJoinCode(code);
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      peerRef.current?.close();
      downloadsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    channelRef.current = null;
    receiverRef.current = null;
    roomRef.current = null;
    processedRef.current.clear();
    processingRef.current = false;
    pollBusyRef.current = false;
    setConnected(false);
    setRoom(null);
  }, []);

  function handleIncoming(event: MessageEvent) {
    if (typeof event.data === "string") {
      let packet: { type?: string; name?: string; size?: number };
      try { packet = JSON.parse(event.data) as typeof packet; }
      catch { setError("Unrecognised transfer packet received."); return; }
      if (packet.type === "start") {
        if (typeof packet.name !== "string" || !Number.isSafeInteger(packet.size) ||
            !packet.size || packet.size < 1 || packet.size > MAX_FILE) {
          receiverRef.current = null;
          setError("Transfer rejected: invalid file or over 100 MB.");
          return;
        }
        receiverRef.current = {
          name: packet.name.replace(/[\/\\<>:"|?*\x00-\x1f]/g, "_").slice(0, 180) || "download",
          size: packet.size, received: 0, chunks: [],
        };
        setProgress("Receiving " + packet.name + " (0%)");
      } else if (packet.type === "end") {
        const item = receiverRef.current;
        receiverRef.current = null;
        if (!item || item.received !== item.size) {
          setError("Incomplete file received. Ask the sender to retry.");
          return;
        }
        const url = URL.createObjectURL(new Blob(item.chunks));
        const receivedFile = { name: item.name, bytes: item.size, url };
        downloadsRef.current = [receivedFile, ...downloadsRef.current].slice(0, 20);
        setDownloads([...downloadsRef.current]);
        setProgress("Received " + item.name + ". Tap Download to save.");
      }
      return;
    }
    const item = receiverRef.current;
    if (!item || !(event.data instanceof ArrayBuffer)) return;
    if (item.received + event.data.byteLength > item.size) {
      receiverRef.current = null;
      setError("Transfer aborted: received more bytes than expected.");
      return;
    }
    item.chunks.push(event.data);
    item.received += event.data.byteLength;
    if (item.received === item.size || item.received % (256 * 1024) < CHUNK) {
      setProgress("Receiving " + item.name + " (" + Math.round(100 * item.received / item.size) + "%)");
    }
  }

  function attachChannel(channel: RTCDataChannel) {
    channelRef.current = channel;
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = 256 * 1024;
    channel.onopen = () => {
      if (!aliveRef.current) return;
      setConnected(true);
      setMessage("Devices connected. Choose files on either device.");
      setError("");
    };
    channel.onclose = () => { if (aliveRef.current) { setConnected(false); setMessage("Connection closed. Start a new room to reconnect."); } };
    channel.onerror = () => setError("FileBridge data channel failed.");
    channel.onmessage = handleIncoming;
  }

  function newPeer(role: Role) {
    // No TURN or cloud relay. Files travel directly, encrypted by WebRTC DTLS.
    // Local Wi-Fi/hotspot works best; some NAT/firewall combinations will fail.
    const pc = new RTCPeerConnection({ iceServers: [] });
    peerRef.current = pc;
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("Direct connection failed. Put both devices on the same Wi-Fi and retry.");
      }
    };
    if (role === "host") attachChannel(pc.createDataChannel("files", { ordered: true }));
    else pc.ondatachannel = (event) => attachChannel(event.channel);
    return pc;
  }

  const request = useCallback(async (payload: Record<string, unknown>, key?: string) => {
    const response = await fetch("/api/filebridge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: "Bearer " + key } : {}),
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });
    const json = await response.json() as { error?: string; [key: string]: unknown };
    if (!response.ok) throw new Error(json.error || "Connection failed.");
    return json;
  }, []);

  async function sendSdp(session: Session, kind: "offer" | "answer", sdp: string) {
    await request({
      action: "signal", roomId: session.roomId, role: session.role, kind, sdp,
    }, session.key);
  }

  async function handleSignal(session: Session, signal: Signal) {
    const pc = peerRef.current;
    if (!pc || processingRef.current) return;
    if (session.role === "host" && signal.kind === "answer" && pc.signalingState === "have-local-offer") {
      processingRef.current = true;
      try { await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp }); }
      finally { processingRef.current = false; }
    } else if (session.role === "guest" && signal.kind === "offer" && pc.signalingState === "stable") {
      processingRef.current = true;
      try {
        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await iceReady(pc);
        await sendSdp(session, "answer", pc.localDescription?.sdp || answer.sdp || "");
      } finally { processingRef.current = false; }
    }
  }

  function beginPolling(session: Session) {
    async function poll() {
      if (pollBusyRef.current || !aliveRef.current || roomRef.current?.roomId !== session.roomId) return;
      pollBusyRef.current = true;
      try {
        const response = await fetch("/api/filebridge?roomId=" + encodeURIComponent(session.roomId), {
          headers: { Authorization: "Bearer " + session.key, "X-Filebridge-Role": session.role },
          cache: "no-store",
        });
        const data = await response.json() as { paired?: boolean; signals?: Signal[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Pairing session expired.");
        if (!data.paired && session.role === "host" && !channelRef.current?.readyState.includes("open")) {
          setMessage("Room created. Enter the pairing code on the second device.");
        }
        for (const signal of data.signals || []) {
          if (processedRef.current.has(signal.id)) continue;
          await handleSignal(session, signal);
          processedRef.current.add(signal.id);
        }
      } catch (err) {
        if (aliveRef.current) setError(err instanceof Error ? err.message : "Could not check pairing.");
      } finally { pollBusyRef.current = false; }
    }
    timerRef.current = setInterval(() => { void poll(); }, 1500);
    void poll();
  }

  async function createRoom() {
    if (busy) return;
    setBusy(true);
    setError("");
    cleanup();
    try {
      const data = await request({ action: "create" }) as unknown as Session;
      roomRef.current = data;
      setRoom(data);
      setMessage("Room created. Enter the pairing code on the second device.");
      const pc = newPeer("host");
      beginPolling(data);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await iceReady(pc);
      await sendSdp(data, "offer", pc.localDescription?.sdp || offer.sdp || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room.");
      cleanup();
    } finally { setBusy(false); }
  }

  async function joinRoom() {
    if (busy) return;
    if (!/^\d{8}$/.test(joinCode.trim())) { setError("Enter the 8-digit code from the other device."); return; }
    setBusy(true);
    setError("");
    cleanup();
    try {
      const data = await request({ action: "join", code: joinCode.trim() }) as unknown as Session;
      roomRef.current = data;
      setRoom(data);
      newPeer("guest");
      setMessage("Paired. Establishing a direct connection…");
      beginPolling(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join.");
      cleanup();
    } finally { setBusy(false); }
  }

  async function sendFiles() {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") { setError("Connect your two devices first."); return; }
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of files) {
        if (file.size < 1 || file.size > MAX_FILE) throw new Error("Each file must be between 1 byte and 100 MB.");
        channel.send(JSON.stringify({ type: "start", name: file.name, size: file.size }));
        for (let offset = 0; offset < file.size; offset += CHUNK) {
          if (channel.readyState !== "open") throw new Error("Connection lost during transfer.");
          while (channel.bufferedAmount > 512 * 1024) {
            if (channel.readyState !== "open") throw new Error("Connection lost during transfer.");
            await new Promise((resolve) => window.setTimeout(resolve, 40));
          }
          channel.send(await file.slice(offset, offset + CHUNK).arrayBuffer());
          if (offset % (256 * 1024) < CHUNK || offset + CHUNK >= file.size) {
            setProgress("Sending " + file.name + " (" + Math.min(100, Math.round(100 * (offset + CHUNK) / file.size)) + "%)");
          }
        }
        // Ensure the final control packet is queued after the binary chunks.
        channel.send(JSON.stringify({ type: "end" }));
      }
      setProgress("Sent " + files.length + " file(s). The recipient can download them.");
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
    } finally { setBusy(false); }
  }

  async function copyLink() {
    if (!room?.code) return;
    const link = window.location.origin + "/filebridge?code=" + room.code;
    try { await navigator.clipboard.writeText(link); setMessage("Pairing link copied. Open it on the other device."); }
    catch { setMessage("Share this link: " + link); }
  }

  function openLocalReceiver() {
    const url = verifiedLocalAddress(localAddress.trim());
    if (!url) { setError("Enter the private Wi-Fi address printed by your Windows receiver, e.g. http://192.168.1.10:8765"); return; }
    window.location.assign(url);
  }

  return <div className="fb">
    <div className="fb-intro">
      <span className="badge">FileBridge • Phone ↔ Laptop</span>
      <h1>Transfer files between your devices.</h1>
      <p className="lead">On both devices, open this page. Create a room on one, enter its eight-digit code on the other, and send files directly between browsers. No cloud file upload.</p>
    </div>
    <div className="fb-grid">
      <section className="card fb-panel">
        <h2>1. Connect two devices</h2>
        {!room ? <>
          <button className="btn primary" onClick={() => void createRoom()} disabled={busy}>Create pairing room</button>
          <div className="fb-divider">OR JOIN AN EXISTING ROOM</div>
          <label htmlFor="fb-code">Eight-digit pairing code</label>
          <input id="fb-code" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} autoComplete="one-time-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="00000000" />
          <button className="btn secondary" onClick={() => void joinRoom()} disabled={busy}>Join room</button>
        </> : <>
          {room.code && <div className="fb-code"><span>Pairing code</span><strong>{room.code}</strong><button className="btn secondary" onClick={() => void copyLink()}>Copy pairing link</button></div>}
          <p className="fb-note">Room expires after {room.expiresInMinutes} minutes. Only one joining device is allowed.</p>
          <div className={connected ? "fb-status ready" : "fb-status"}>{connected ? "● Connected" : "◌ Waiting for secure connection"}</div>
          <button className="btn secondary" onClick={cleanup}>Disconnect / new room</button>
        </>}
        <p className="fb-note" role="status">{message}</p>
      </section>
      <section className="card fb-panel">
        <h2>2. Send files</h2>
        <label htmlFor="fb-files">Select documents, photos or videos</label>
        <input id="fb-files" type="file" multiple disabled={!connected || busy} onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        <p className="fb-note">Maximum 100 MB per file in browser-to-browser mode. Files travel through an encrypted WebRTC connection, not through our servers.</p>
        {files.length > 0 && <p className="fb-note">{files.length} file(s) selected • {friendlyBytes(files.reduce((sum, f) => sum + f.size, 0))}</p>}
        <button className="btn primary" disabled={!connected || busy || !files.length} onClick={() => void sendFiles()}>Send to other device</button>
        <p className="fb-status" aria-live="polite">{progress}</p>
      </section>
    </div>
    {downloads.length > 0 && <section className="card fb-panel fb-downloads">
      <h2>3. Download received files</h2>
      <p>Files are held temporarily in this browser until you save them. Save them before closing this tab.</p>
      {downloads.map((file) => <div className="fb-received" key={file.url}>
        <span>{file.name} • {friendlyBytes(file.bytes)}</span>
        <a className="btn primary" href={file.url} download={file.name}>Download</a>
      </div>)}
    </section>}
    {error && <p className="fb-error" role="alert">{error}</p>}
    <section className="card fb-local">
      <h2>Using the Windows FileBridge receiver?</h2>
      <p>For larger files or transfers without internet, open the FileBridge Windows application and connect your phone to the <strong>same private Wi-Fi</strong>. Enter the local address shown by the Windows receiver to open its upload/download screen.</p>
      <div className="fb-local-row">
        <label htmlFor="fb-local">Local receiver address</label>
        <input id="fb-local" placeholder="http://192.168.1.10:8765" value={localAddress} onChange={(e) => setLocalAddress(e.target.value)} />
        <button className="btn secondary" onClick={openLocalReceiver}>Open local receiver</button>
      </div>
      <p className="fb-note">The local Windows application works independently of this website. Browser-to-browser pairing requires internet access to reach the signaling service and an available database; the direct peer connection may fail on restrictive networks. The LAN receiver does not require a cloud bucket.</p>
    </section>
  </div>;
}
