/* Glossary — tap-to-explain badges. Data in /glossary.json; works on every page. */
(function () {
  "use strict";
  var DATA = null;
  var POP = null;

  function ensureCss() {
    if (document.getElementById("gl-css")) return;
    var css = document.createElement("style");
    css.id = "gl-css";
    css.textContent = [
      ".gl{display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;",
      "margin-left:4px;border:1px solid var(--meta,#999);border-radius:50%;",
      "font-size:10px;color:var(--meta,#999);background:transparent;cursor:help;",
      "vertical-align:middle;padding:0;font-family:inherit;user-select:none;}",
      ".gl:hover{background:var(--meta,#999);color:var(--bg,#fff);}",
      ".gl-pop{position:absolute;z-index:9999;max-width:300px;background:#fffdf5;",
      "border:1px solid #c9b458;border-radius:8px;padding:12px 14px;",
      "box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:0.82rem;line-height:1.45;color:#333;",
      "font-family:Georgia,serif;}",
      ".gl-pop h4{margin:0 0 6px;font-size:0.85rem;color:#8a6d1a;}",
      ".gl-pop .ex{margin-top:8px;padding-top:8px;border-top:1px dashed #d8c98a;",
      "font-style:italic;color:#6b5d33;}"
    ].join("");
    document.head.appendChild(css);
  }

  function load(callback) {
    if (DATA) return callback(null, DATA);
    fetch("/glossary.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { DATA = j; callback(null, j); })
      .catch(function (e) { callback(e); });
  }

  function close() {
    if (POP) { POP.remove(); POP = null; }
  }

  function open(btn) {
    load(function (err, data) {
      if (err || !data) return;
      close();
      var key = btn.getAttribute("data-glossary");
      var entry = data[key];
      if (!entry) return;
      POP = document.createElement("div");
      POP.className = "gl-pop";
      var h = document.createElement("h4");
      h.textContent = entry.term;
      var p = document.createElement("div");
      p.textContent = entry.plain;
      POP.appendChild(h);
      POP.appendChild(p);
      if (entry.example) {
        var ex = document.createElement("div");
        ex.className = "ex";
        ex.textContent = entry.example;
        POP.appendChild(ex);
      }
      document.body.appendChild(POP);
      var r = btn.getBoundingClientRect();
      var pw = 300, ph = POP.offsetHeight || 120;
      var left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
      var top = r.bottom + window.scrollY + 6;
      if (r.bottom + ph > window.innerHeight) {
        top = r.top + window.scrollY - ph - 6;
      }
      POP.style.left = left + "px";
      POP.style.top = Math.max(window.scrollY + 8, top) + "px";
    });
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-glossary]") : null;
    if (btn) { ev.preventDefault(); ev.stopPropagation(); open(btn); return; }
    if (POP && !POP.contains(ev.target)) close();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") close();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureCss);
  } else { ensureCss(); }
})();
