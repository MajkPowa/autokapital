/* Videomanuál: seznam kapitol s časy, skok na kapitolu a zvýraznění té, která právě běží. */
(function () {
  "use strict";
  var CH = [{"n": 1, "title": "Přihlášení", "t": 0.0}, {"n": 2, "title": "Orientace v administraci", "t": 52.3}, {"n": 3, "title": "Pipeline", "t": 89.7}, {"n": 4, "title": "Detail případu", "t": 140.9}, {"n": 5, "title": "Smlouvy a e-maily", "t": 194.1}, {"n": 6, "title": "Reklama a výkon", "t": 255.1}, {"n": 7, "title": "Další sekce", "t": 309.3}, {"n": 8, "title": "Žádost z webu", "t": 357.8}, {"n": 9, "title": "Klientská zóna na mobilu", "t": 421.4}, {"n": 10, "title": "Administrace na mobilu", "t": 456.5}];
  var v = document.getElementById("mnVideo"), ol = document.getElementById("mnChapters");
  if (!v || !ol) return;
  function mmss(s) { s = Math.round(s); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  CH.forEach(function (c, i) {
    var li = document.createElement("li"), b = document.createElement("button");
    b.type = "button";
    var n = document.createElement("span"); n.className = "n"; n.textContent = ("0" + c.n).slice(-2);
    var t = document.createElement("span"); t.textContent = c.title;
    var d = document.createElement("span"); d.className = "t"; d.textContent = mmss(c.t);
    b.appendChild(n); b.appendChild(t); b.appendChild(d);
    b.addEventListener("click", function () { v.currentTime = c.t + 0.05; var p = v.play(); if (p && p.catch) p.catch(function () { }); });
    li.appendChild(b); ol.appendChild(li);
  });
  var btns = ol.querySelectorAll("button");
  function mark() {
    var cur = 0; CH.forEach(function (c, i) { if (v.currentTime >= c.t - 0.1) cur = i; });
    [].forEach.call(btns, function (b, i) { if (i === cur && (v.currentTime > 0 || !v.paused)) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
  }
  v.addEventListener("timeupdate", mark); v.addEventListener("seeked", mark);
  // odkaz typu manual.html#k4 spustí rovnou čtvrtou kapitolu
  var m = /^#k(\d+)$/.exec(location.hash);
  if (m && CH[m[1] - 1]) v.addEventListener("loadedmetadata", function () { v.currentTime = CH[m[1] - 1].t + 0.05; }, { once: true });
})();
