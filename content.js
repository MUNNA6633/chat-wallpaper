(() => {
  "use strict";
  const DEF = { enabled: true, mode: "behind", opacity: 100 };
  const SKIP = new Set(["pre", "code", "table", "textarea", "input", "button", "img", "svg", "video", "canvas", "script", "style", "iframe", "select"]);
  const PROPS = ["background-color", "background-image"];
  const orig = new WeakMap();
  let cfg = { ...DEF }, hasMedia = false;
  let frame = null, observer = null, timer = 0, active = false, seen = new WeakSet();

  /* ---------- wallpaper frame ---------- */
  function ensureFrame() {
    if (frame && frame.isConnected) return frame;
    try {
      frame = document.createElement("iframe");
      frame.id = "cw-frame";
      frame.src = chrome.runtime.getURL("wallpaper.html");
      frame.setAttribute("allow", "autoplay");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      document.documentElement.appendChild(frame);
    } catch (e) { frame = null; }
    return frame;
  }

  function styleFrame() {
    const behind = cfg.mode === "behind";
    frame.style.cssText =
      "position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;" +
      "border:0!important;margin:0!important;padding:0!important;pointer-events:none!important;" +
      "background:transparent!important;display:block!important;" +
      `z-index:${behind ? -1 : 2147483646}!important;opacity:${cfg.opacity / 100}!important;`;
  }

  /* ---------- make big opaque page containers transparent ---------- */
  function alphaOf(c) {
    if (c === "transparent") return 0;
    const slash = c.match(/\/\s*([\d.]+)(%?)/);
    if (slash) return slash[2] ? parseFloat(slash[1]) / 100 : parseFloat(slash[1]);
    const m = c.match(/^rgba\(([^)]+)\)/);
    if (m) { const p = m[1].split(","); return p.length > 3 ? parseFloat(p[3]) : 1; }
    return 1;
  }

  function clearEl(el) {
    if (!orig.has(el)) orig.set(el, PROPS.map(p => [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]));
    el.style.setProperty("background-color", "transparent", "important");
    el.style.setProperty("background-image", "none", "important");
    el.setAttribute("data-cw-clear", "");
  }

  function restoreAll() {
    document.querySelectorAll("[data-cw-clear]").forEach(el => {
      const o = orig.get(el);
      PROPS.forEach((p, i) => {
        el.style.removeProperty(p);
        if (o && o[i][0]) el.style.setProperty(p, o[i][0], o[i][1]);
      });
      el.removeAttribute("data-cw-clear");
    });
  }

  function pass() {
    const body = document.body;
    if (!body) return;
    clearEl(document.documentElement);
    clearEl(body);
    const vw = innerWidth, vh = innerHeight;
    let budget = 3500;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT, {
      acceptNode(el) {
        if (--budget < 0) return NodeFilter.FILTER_REJECT;
        if (SKIP.has(el.localName)) return NodeFilter.FILTER_REJECT;
        if (el.getAttribute("role") === "dialog" || el.hasAttribute("aria-modal")) return NodeFilter.FILTER_REJECT;
        return el.getBoundingClientRect().width < vw * 0.5 ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    for (let el; (el = walker.nextNode());) {
      if (seen.has(el)) continue;
      seen.add(el);
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const hasImg = cs.backgroundImage !== "none";
      const opaque = alphaOf(cs.backgroundColor) >= 0.95;
      const bigPanel = r.height >= vh * 0.5 && (opaque || hasImg);
      const fadeStrip = r.width >= vw * 0.9 && cs.backgroundImage.includes("gradient");
      if (bigPanel || fadeStrip) clearEl(el);
    }
  }

  function schedule() {
    if (!active || timer) return;
    timer = setTimeout(() => {
      timer = 0;
      if (!active) return;
      if (!document.body) { document.addEventListener("DOMContentLoaded", schedule, { once: true }); return; }
      if (!observer) {
        observer = new MutationObserver(recs => {
          if (recs.some(r => r.type === "attributes")) seen = new WeakSet();
          schedule();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-mode", "data-color-scheme"] });
      }
      pass();
    }, 700);
  }

  /* ---------- state ---------- */
  function activate() {
    document.documentElement.classList.add("cw-on");
    active = true;
    schedule();
  }
  function deactivate() {
    active = false;
    clearTimeout(timer); timer = 0;
    observer && observer.disconnect(); observer = null;
    document.documentElement.classList.remove("cw-on");
    restoreAll();
    seen = new WeakSet();
  }
  function teardown() {
    if (frame) { frame.remove(); frame = null; }
    deactivate();
  }
  function apply() {
    if (!(cfg.enabled && hasMedia)) return teardown();
    if (!ensureFrame()) return;
    styleFrame();
    cfg.mode === "behind" ? activate() : deactivate();
  }

  chrome.storage.local.get(["settings", "mediaMeta"], r => {
    cfg = { ...DEF, ...r.settings };
    hasMedia = !!r.mediaMeta;
    apply();
  });
  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local") return;
    if (c.settings) cfg = { ...DEF, ...c.settings.newValue };
    if (c.mediaMeta) hasMedia = !!c.mediaMeta.newValue;
    apply();
  });
  addEventListener("resize", () => { seen = new WeakSet(); schedule(); }, { passive: true });
})();
