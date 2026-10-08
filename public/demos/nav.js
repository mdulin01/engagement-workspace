// Shared navigation strip for the FCBOH demo pages. Loaded by every page under /demos/.
(function () {
  var pages = [
    { id: "index", href: "/demos/", label: "All demos" },
    { id: "clinical", href: "/demos/clinical/", label: "Clinical services" },
    { id: "hiv", href: "/demos/hiv/", label: "HIV / EHE" },
    { id: "neighborhoods", href: "/demos/neighborhoods/", label: "Neighborhoods" }
  ];
  var path = location.pathname.replace(/index\.html$/, "");
  var cur = pages.find(function (p) { return p.id !== "index" && path.indexOf(p.href) === 0; }) || pages[0];
  var i = pages.indexOf(cur), prev = i > 1 ? pages[i - 1] : null, next = i > 0 && i < pages.length - 1 ? pages[i + 1] : null;

  var css = "" +
    ".dnav{font-family:Geist,ui-sans-serif,system-ui,sans-serif;background:#14283a;color:#fff;font-size:12.5px;display:flex;align-items:center;gap:4px;padding:0 18px;height:38px;flex-wrap:wrap}" +
    ".dnav a{color:rgba(255,255,255,.72);text-decoration:none;padding:5px 10px;border-radius:7px;line-height:1}" +
    ".dnav a:hover{color:#fff;background:rgba(255,255,255,.1)}" +
    ".dnav a.cur{color:#fff;background:rgba(255,255,255,.14);font-weight:600}" +
    ".dnav .home{font-weight:600;color:#fff;padding-left:0}" +
    ".dnav .sep{color:rgba(255,255,255,.3);margin:0 4px}" +
    ".dnav .side{margin-left:auto;display:flex;gap:4px}" +
    ".dnav .pill{background:#fde68a;color:#78350f;font-weight:600;font-size:10.5px;padding:3px 8px;border-radius:999px;margin-left:8px}" +
    "@media (max-width:640px){.dnav .side{display:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var h = '<a class="home" href="/demos/">← FCBOH demos</a><span class="sep">|</span>';
  pages.slice(1).forEach(function (p) { h += '<a href="' + p.href + '"' + (p === cur ? ' class="cur"' : "") + ">" + p.label + "</a>"; });
  h += '<span class="pill">DEMO</span><span class="side">';
  if (prev) h += '<a href="' + prev.href + '">‹ ' + prev.label + "</a>";
  if (next) h += '<a href="' + next.href + '">' + next.label + " ›</a>";
  h += "</span>";
  var nav = document.createElement("nav"); nav.className = "dnav"; nav.setAttribute("aria-label", "Demo navigation"); nav.innerHTML = h;
  document.body.insertBefore(nav, document.body.firstChild);
})();
