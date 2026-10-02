"use strict";
const DEF = { dim: 25, blur: 0, speed: 1, fit: "cover", paused: false };
const stage = document.getElementById("stage");
const dimEl = document.getElementById("dim");
let s = { ...DEF }, node = null, objUrl = null, currentTs = 0;

function applyStyle() {
  dimEl.style.opacity = s.dim / 100;
  if (!node) return;
  const blurred = s.blur > 0;
  node.style.filter = blurred ? `blur(${s.blur}px)` : "";
  node.style.transform = blurred ? "scale(1.08)" : "";
  if (node.tagName === "VIDEO") {
    node.style.objectFit = s.fit === "tile" ? "cover" : s.fit;
    node.playbackRate = s.speed;
    syncPlayback();
  } else {
    node.style.backgroundSize = s.fit === "tile" ? "auto" : s.fit === "fill" ? "100% 100%" : s.fit;
    node.style.backgroundRepeat = s.fit === "tile" ? "repeat" : "no-repeat";
  }
}

function syncPlayback() {
  if (!node || node.tagName !== "VIDEO") return;
  if (s.paused || document.hidden) node.pause();
  else node.play().catch(() => {});
}

function unload() {
  if (node && node.tagName === "VIDEO") {
    node.pause();
    node.removeAttribute("src");
    node.load(); // releases the decoder
  }
  stage.replaceChildren();
  if (objUrl) URL.revokeObjectURL(objUrl);
  node = objUrl = null;
}

async function load(meta) {
  if (!meta) { unload(); currentTs = 0; return; }
  if (meta.ts === currentTs) return;
  currentTs = meta.ts;
  const { media } = await chrome.storage.local.get("media");
  if (!media || currentTs !== meta.ts) return;
  const blob = await (await fetch(media)).blob();
  if (currentTs !== meta.ts) return;
  unload();
  objUrl = URL.createObjectURL(blob);
  if (meta.type === "video") {
    const v = document.createElement("video");
    v.muted = v.defaultMuted = v.loop = v.autoplay = v.playsInline = true;
    v.disablePictureInPicture = v.disableRemotePlayback = true;
    v.preload = "auto";
    v.src = objUrl;
    node = v;
  } else {
    node = document.createElement("div");
    node.style.backgroundImage = `url("${objUrl}")`;
    node.style.backgroundPosition = "center";
  }
  stage.append(node);
  applyStyle();
}

document.addEventListener("visibilitychange", syncPlayback);

chrome.storage.local.get(["settings", "mediaMeta"], r => {
  s = { ...DEF, ...r.settings };
  applyStyle();
  load(r.mediaMeta);
});

chrome.storage.onChanged.addListener((c, area) => {
  if (area !== "local") return;
  if (c.settings) { s = { ...DEF, ...c.settings.newValue }; applyStyle(); }
  if (c.mediaMeta) load(c.mediaMeta.newValue);
});
