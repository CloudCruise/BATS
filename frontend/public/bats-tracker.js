(function () {
  const qs = new URLSearchParams(location.search);
  const runId = qs.get("run") || "";
  const agent = qs.get("agent") || "unknown";
  if (!runId) return;

  // ---- batching ----
  let buf = [];
  function push(type, payload) {
    buf.push({ type, ts_ms: Date.now(), payload });
    if (buf.length >= 12) flush();
  }
  async function flush() {
    if (!buf.length) return;
    const batch = buf.splice(0, buf.length);
    try {
      await fetch(`/api/runs/${encodeURIComponent(runId)}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_name: agent, events: batch }),
        keepalive: true,
      });
    } catch {}
  }
  window.addEventListener("beforeunload", flush);

  // ---- last pointer position (page coords) ----
  let lastPt = null; // { x, y }
  let lastPtTs = 0;
  const STALE_MS = 5000; // consider pointer stale after 5s

  function setPointFromEvent(e) {
    // prefer pageX/pageY (already include scroll)
    const x = e.pageX != null ? e.pageX : e.clientX + window.scrollX;
    const y = e.pageY != null ? e.pageY : e.clientY + window.scrollY;
    lastPt = { x, y };
    lastPtTs = Date.now();
  }
  // pointermove covers mouse/touch/pen on modern browsers
  document.addEventListener("pointermove", setPointFromEvent, true);
  // fallback
  document.addEventListener("mousemove", setPointFromEvent, true);
  document.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches && e.touches[0];
      if (t) setPointFromEvent(t);
    },
    { passive: true, capture: true }
  );

  function pointFor(el) {
    // recent pointer?
    if (lastPt && Date.now() - lastPtTs < STALE_MS) return lastPt;
    // fallback to element center
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + window.scrollX + r.width / 2,
        y: r.top + window.scrollY + r.height / 2,
      };
    }
    // fallback to viewport center
    return {
      x: window.scrollX + window.innerWidth / 2,
      y: window.scrollY + window.innerHeight / 2,
    };
  }

  // ---- event logging ----
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target || {};
      logBasic("click", t);
      throttledShot(t, {
        x: e.pageX ?? e.clientX + window.scrollX,
        y: e.pageY ?? e.clientY + window.scrollY,
      });
    },
    true
  );

  ["change", "submit"].forEach((ev) =>
    document.addEventListener(
      ev,
      (e) => {
        const t = e.target || {};
        logBasic(ev, t);
        if (ev === "submit") throttledShot(t); // will use last pointer or element center
      },
      true
    )
  );

  // first input per field
  const seenInput = new WeakSet();
  document.addEventListener(
    "input",
    (e) => {
      const t = e.target;
      if (t && !seenInput.has(t)) {
        seenInput.add(t);
        push("input", {
          id: t.id || null,
          name: t.name || null,
          value: String(t.value || "").slice(0, 80),
        });
        throttledShot(t); // will use last pointer or element center
      }
    },
    true
  );

  function logBasic(type, t) {
    push(type, {
      tag: t.tagName || null,
      id: t.id || null,
      name: t.name || null,
      cls: t.className ? String(t.className) : null,
      value: t.value ? String(t.value).slice(0, 120) : null,
      href: t.href || null,
      text: (t.innerText || "").slice(0, 120),
    });
  }

  window.addEventListener("error", (e) =>
    push("error", { msg: e.message || "error", src: e.filename || null })
  );
  window.addEventListener("unhandledrejection", (e) =>
    push("error", { msg: String(e.reason || "rejection") })
  );

  // ---- screenshots ----
  let lastShot = 0;
  async function throttledShot(el, clickPt) {
    const now = Date.now();
    if (now - lastShot < 1200) return; // ≤1/sec
    lastShot = now;
    // If no explicit click point, use last pointer (or fallbacks)
    const pt = clickPt || pointFor(el);
    const dataUrl = await captureWithDot(pt);
    if (!dataUrl) return;
    push("screenshot", { dataUrl });
    flush();
  }

  async function captureWithDot(pt) {
    try {
      if (!window.html2canvas) return null;

      const pageW = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      );
      const pageH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const maxW = 1024;
      const scale = Math.min(0.6, maxW / pageW);

      const canvas = await window.html2canvas(document.body, {
        backgroundColor: null,
        useCORS: true,
        scale,
        logging: false,
        windowWidth: pageW,
        windowHeight: pageH,
        scrollX: 0,
        scrollY: 0,
        onclone(doc) {
          try {
            doc.defaultView && doc.defaultView.scrollTo(0, 0);
          } catch {}
          // Add a very visible orange dot at last-known pointer (page coords)
          if (pt && typeof pt.x === "number" && typeof pt.y === "number") {
            const dot = doc.createElement("div");
            Object.assign(dot.style, {
              position: "absolute",
              left: `${pt.x - 12}px`,
              top: `${pt.y - 12}px`,
              width: "24px",
              height: "24px",
              borderRadius: "9999px",
              background: "rgba(255,165,0,0.98)", // orange
              border: "3px solid white",
              boxShadow: "0 0 10px rgba(0,0,0,0.7)",
              pointerEvents: "none",
              zIndex: "2147483647",
            });
            doc.body.appendChild(dot);
          }
        },
      });

      let dataUrl = canvas.toDataURL("image/webp", 0.6);
      if (dataUrl.length > 350_000)
        dataUrl = canvas.toDataURL("image/webp", 0.45);
      return dataUrl;
    } catch {
      return null;
    }
  }

  // initial shot after load (uses last pointer or viewport center)
  function whenReady(fn) {
    if (window.html2canvas) fn();
    else {
      let tries = 0;
      const i = setInterval(() => {
        if (window.html2canvas || ++tries > 30) {
          clearInterval(i);
          if (window.html2canvas) fn();
        }
      }, 100);
    }
  }
  whenReady(() => throttledShot());

  // manual finish hook
  window.BATS = {
    async finish(extra) {
      await throttledShot();
      await flush();
      await fetch(`/api/runs/${encodeURIComponent(runId)}/finish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extra }),
        keepalive: true,
      });
    },
  };
})();
