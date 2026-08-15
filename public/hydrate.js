// moecap price hydration — zero dependencies, progressive enhancement.
// Fetches the prices payload, patches price/PE/cap spans in place, and adds a
// freshness line. If the fetch fails or a ticker is absent, the authored build
// numbers remain exactly as rendered: the page never breaks because of this.
//
// Sources are tried in order: same-origin /prices.json first (in case a Pages
// Function is added later), then the moecap-prices Worker URL (rewritten by
// scripts/setup-cloudflare.sh at deploy time).
(function () {
  "use strict";

  var SOURCES = ["/prices.json", "https://moecap-prices.SETUP_PLACEHOLDER.workers.dev/prices"];

  function apply(payload) {
    var entries = (payload && payload.entries) || {};
    var keys = Object.keys(entries);
    if (keys.length === 0) return false;

    var patched = 0;
    document.querySelectorAll("details[data-ticker]").forEach(function (el) {
      var entry = entries[el.getAttribute("data-ticker").toUpperCase()];
      if (!entry) return;

      var price = el.querySelector('[data-field="price"]');
      var pe = el.querySelector('[data-field="pe"]');
      var cap = el.querySelector('[data-field="cap"]');
      if (price && entry.p) { price.textContent = entry.p; patched++; }
      if (pe && entry.pe) pe.textContent = entry.pe;
      if (cap && entry.cap) cap.textContent = entry.cap;

      if (entry.review) {
        var flag = document.createElement("span");
        flag.title = "Large price discontinuity detected — P/E and cap held at authored values pending review";
        flag.textContent = " ⚠";
        flag.style.color = "var(--accent)";
        if (price && price.parentNode) price.parentNode.appendChild(flag);
      }
    });
    if (patched === 0) return false;

    var asOf = payload.asOf ? new Date(payload.asOf) : null;
    var stamp = asOf
      ? asOf.toISOString().replace("T", " ").slice(0, 16) + " UTC"
      : "recent run";
    var line = document.createElement("p");
    line.textContent = "⟳ Prices auto-updated hourly from Binance/OKX/Bitget listings — last refresh: " + stamp;
    line.style.cssText = "font-size:0.75rem;color:var(--meta);margin:-1rem 0 1.5rem 0;";

    var first = document.getElementById("us-stocks-green") || document.getElementById("us-stocks");
    if (first) {
      var body = first.querySelector(".content-body") || first;
      body.insertBefore(line, body.firstChild);
    }
    return true;
  }

  function tryNext(i) {
    if (i >= SOURCES.length) return; // silent: authored numbers stand
    fetch(SOURCES[i], { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (payload) { if (!apply(payload)) tryNext(i + 1); })
      .catch(function () { tryNext(i + 1); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { tryNext(0); });
  } else {
    tryNext(0);
  }
})();
