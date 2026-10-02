"use strict";
const DEF = { enabled: true, mode: "behind", opacity: 100, dim: 25, blur: 0, speed: 1, fit: "cover", paused: false };
const MAX_VIDEO = 20 * 1024 * 1024;
const MAX_IMAGE = 40 * 1024 * 1024;
const $ = id => document.getElementById(id);
let settings = { ...DEF }, meta = null, saveTimer = 0;

// [element id, settings key, ui-units per stored unit, formatter]
const SLIDERS = [
  ["opacity", "opacity", 1, v => v + "%"],
  ["dim", "dim", 1, v => v + "%"],
  ["blur", "blur", 1, v => v + "px"],
  ["speed", "speed", 100, v => v.toFixed(2) + "×"],
];

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => chrome.storage.local.set({ settings }), 50);
}
function status(msg, err = false) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (err ? " err" : "");
}
function syncSliders() {
  for (const [id, key, k, fmt] of SLIDERS) {
    $(id).value = Math.round(settings[key] * k);
    $(id + "V").textContent = fmt(settings[key]);
  }
}
function render() {
  $("enabled").checked = settings.enabled;
  $("play").checked = !settings.paused;
  $("mode").value = settings.mode;
  $("fit").value = settings.fit;
  syncSliders();
  $("thumb").style.backgroundImage = meta && meta.thumb ? `url("${meta.thumb}")` : "";
  $("dropText").textContent = meta ? `${meta.type === "video" ? "Video" : "Image"}: ${meta.name}` : "Click or drop an image / video";
  document.querySelectorAll("[data-video-only]").forEach(e => { e.hidden = !(meta && meta.type === "video"); });
  $("fit").querySelector('[value="tile"]').disabled = !!(meta && meta.type === "video");
}

/* ---------- file handling ---------- */
const readDataUrl = f => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

function scaleToDataUrl(src, w, h, max, type, q) {
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * s));
  c.height = Math.max(1, Math.round(h * s));
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL(type, q);
}

async function videoThumb(file) {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("unsupported")); });
    const seeked = new Promise(res => { v.onseeked = res; setTimeout(res, 1500); });
    v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    await seeked;
    return scaleToDataUrl(v, v.videoWidth, v.videoHeight, 360, "image/webp", 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handleFile(file) {
  if (!file) return;
  const video = file.type.startsWith("video/");
  const image = file.type.startsWith("image/");
  if (!video && !image) return status("Please choose an image or a video file.", true);
  if (video && file.size > MAX_VIDEO)
    return status(`That video is ${(file.size / 1048576).toFixed(1)} MB. Keep it under 20 MB (a 10–15 s 720p loop is ideal).`, true);
  if (image && file.size > MAX_IMAGE) return status("That image is too large (max 40 MB).", true);
  status("Processing…");
  try {
    let media, thumb;
    if (video) {
      thumb = await videoThumb(file);
      media = await readDataUrl(file);
    } else {
      const bmp = await createImageBitmap(file);
      thumb = scaleToDataUrl(bmp, bmp.width, bmp.height, 360, "image/webp", 0.7);
      media = file.type === "image/gif"
        ? await readDataUrl(file)
        : scaleToDataUrl(bmp, bmp.width, bmp.height, 2560, "image/webp", 0.9);
      if (bmp.close) bmp.close();
    }
    meta = { type: video ? "video" : "image", name: file.name, size: file.size, ts: Date.now(), thumb };
    settings.enabled = true;
    await chrome.storage.local.set({ media, mediaMeta: meta, settings });
    render();
    status("Wallpaper applied. Reload open chat tabs if you don't see it.");
  } catch (e) {
    status(video ? "Couldn't read this video. Try MP4 (H.264) or WebM." : "Couldn't read this image.", true);
  }
}

/* ---------- wiring ---------- */
const inTab = new URLSearchParams(location.search).has("tab");
if (inTab) { document.body.classList.add("tab"); $("openTab").hidden = true; }
$("openTab").onclick = e => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html?tab=1") });
  window.close();
};

for (const [id, key, k] of SLIDERS) {
  $(id).addEventListener("input", e => {
    settings[key] = +e.target.value / k;
    syncSliders();
    save();
  });
}
$("enabled").onchange = e => { settings.enabled = e.target.checked; save(); };
$("play").onchange = e => { settings.paused = !e.target.checked; save(); };
$("fit").onchange = e => { settings.fit = e.target.value; save(); };
$("mode").onchange = e => {
  settings.mode = e.target.value;
  if (settings.mode === "overlay" && settings.opacity > 60) settings.opacity = 30;
  syncSliders();
  save();
};

const drop = $("drop");
drop.onclick = $("choose").onclick = () => $("file").click();
drop.onkeydown = e => { if (e.key === "Enter") $("file").click(); };
$("file").onchange = e => { handleFile(e.target.files[0]); e.target.value = ""; };
drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
drop.ondragleave = () => drop.classList.remove("over");
drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); handleFile(e.dataTransfer.files[0]); };
$("remove").onclick = async () => {
  await chrome.storage.local.remove(["media", "mediaMeta"]);
  meta = null;
  render();
  status("Wallpaper removed.");
};

chrome.storage.local.get(["settings", "mediaMeta"], r => {
  settings = { ...DEF, ...r.settings };
  meta = r.mediaMeta || null;
  render();
});
