(function () {
  var CONFIG = window.PULSE_CONFIG || {};
  var DATA = window.PULSE_DATA;
  var $ = function (id) { return document.getElementById(id); };

  var state = { lang: "en", category: "ALL", query: "", toolId: null };
  try {
    var saved = localStorage.getItem("pulse-lang");
    state.lang = saved === "en" ? "en" : "vi";
  } catch (e) { state.lang = "vi"; }

  // Bản dịch tiếng Anh: tra theo câu tiếng Việt (i18n-en.js)
  var EN = window.PULSE_EN || {};
  function tr(s) { return state.lang === "en" && typeof s === "string" && EN[s] ? EN[s] : s; }
  function L(vi, en) { return state.lang === "en" ? en : vi; }
  (function fillEn(o) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(fillEn); return; }
    if ("vi" in o && "en" in o) {
      if (typeof o.vi === "string") o.en = EN[o.vi] || (o.en && o.en !== o.vi ? o.en : o.vi);
      else if (Array.isArray(o.vi)) { var own = Array.isArray(o.en) ? o.en : []; o.en = o.vi.map(function (x, i) { return EN[x] || (own[i] && own[i] !== x ? own[i] : x); }); }
      else if (o.vi && typeof o.vi === "object") Object.keys(o.vi).forEach(function (k) {
        var v = o.vi[k];
        if (typeof v === "string" && EN[v]) o.en[k] = EN[v];
      });
      return;
    }
    Object.keys(o).forEach(function (k) { fillEn(o[k]); });
  })(DATA);

  function t(key) { return DATA.i18n[state.lang][key]; }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") node.textContent = props[k];
      else if (k === "style") node.setAttribute("style", props[k]);
      else if (k === "class") node.className = props[k];
      else node.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function formatDate(day) {
    var p = String(day).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : day;
  }

  var BOLT = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>';

  function matches(query, texts) {
    if (!query) return true;
    var q = query.toLowerCase();
    return texts.some(function (s) { return s.toLowerCase().indexOf(q) !== -1; });
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.title = t("pageTitle");
    document.querySelector('meta[name="description"]').setAttribute("content", t("metaDescription"));
    document.querySelectorAll("[data-i18n]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (n) { n.setAttribute("placeholder", t(n.getAttribute("data-i18n-placeholder"))); });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (n) { n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria"))); });
    document.querySelectorAll("[data-en]").forEach(function (n) {
      if (n.dataset.vi == null) n.dataset.vi = n.innerHTML;
      n.innerHTML = state.lang === "en" ? n.getAttribute("data-en") : n.dataset.vi;
    });
    ["aria-label", "alt"].forEach(function (a) {
      document.querySelectorAll("[data-en-" + a + "]").forEach(function (n) {
        var k = "vi" + a.replace("-", "");
        if (n.dataset[k] == null) n.dataset[k] = n.getAttribute(a);
        n.setAttribute(a, state.lang === "en" ? n.getAttribute("data-en-" + a) : n.dataset[k]);
      });
    });
    var lb = $("lang-btn");
    lb.textContent = state.lang === "en" ? "VI" : "EN";
    lb.setAttribute("aria-label", state.lang === "en" ? "Chuyển sang tiếng Việt" : "Switch to English");
    lb.setAttribute("title", lb.getAttribute("aria-label"));
  }

  function renderTabs() {
    var box = $("tabs");
    box.textContent = "";
    ["ALL"].concat(Object.keys(DATA.categories)).forEach(function (key) {
      var color = key === "ALL" ? "#0b4f9c" : DATA.categories[key].color;
      var label = key === "ALL" ? t("allTab") : DATA.categories[key].label[state.lang];
      var b = el("button", { class: "tab", type: "button", style: "--c:" + color, "aria-pressed": String(state.category === key), text: label });
      b.addEventListener("click", function () { state.category = key; renderTabs(); renderNews(); });
      box.appendChild(b);
    });
  }

  var newsAll = false;
  function renderNews() {
    var list = $("news-list");
    list.textContent = "";
    var shown = DATA.news.filter(function (n) {
      return (state.category === "ALL" || n.category === state.category) &&
        matches(state.query, [n.title[state.lang], n.summary[state.lang]]);
    });
    var nb = window.innerWidth < 640 ? 3 : 4;
    var lim = (newsAll || state.query) ? shown.length : nb;
    shown.slice(0, lim).forEach(function (n) { list.appendChild(newsCard(n)); });
    $("news-empty").hidden = shown.length > 0;
    var nm = $("news-more");
    if (nm) { nm.hidden = shown.length <= nb || !!state.query; nm.textContent = newsAll ? L("Thu gọn", "Show less") : L("Xem thêm " + (shown.length - nb) + " tin", "Show " + (shown.length - nb) + " more"); }
  }

  function newsCard(n) {
      var cat = DATA.categories[n.category];
      var thumb = el("div", { class: "news-thumb", "aria-hidden": "true" });
      thumb.innerHTML = cat.icon ? '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + cat.icon + '</svg>' : BOLT;
      var body = el("div", { class: "news-body" }, [
        el("div", { class: "news-meta" }, [
          el("span", { class: "tag", text: cat.label[state.lang] }),
          n.date ? el("time", { class: "news-time", datetime: n.date, text: formatDate(n.date) }) : null,
        ]),
        el("div", { class: "news-title", text: n.title[state.lang] }),
        el("div", { class: "news-summary", text: n.summary[state.lang] }),
      ]);
      var card = n.url
        ? (n.url.charAt(0) === "#" ? el("a", { class: "news-card", href: n.url, style: "--c:" + cat.color }, [thumb, body]) : el("a", { class: "news-card", href: n.url, target: "_blank", rel: "noopener noreferrer", style: "--c:" + cat.color }, [thumb, body]))
        : el("article", { class: "news-card", style: "--c:" + cat.color }, [thumb, body]);
      return card;
  }

  function latestNews() {
    return DATA.news.reduce(function (best, n) { return !best || (n.date || "") > (best.date || "") ? n : best; }, null);
  }

  function renderHot() {
    var n = latestNews();
    $("hot-title").textContent = n ? n.title[state.lang] : "";
    var link = $("hot-link");
    if (n && n.url) { link.setAttribute("href", n.url); link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer"); }
  }

  function money(v) {
    if (typeof v === "string") return v;
    var txt = v < 1 ? v.toFixed(2) : String(v);
    return "$" + (state.lang === "vi" ? txt.replace(".", ",") : txt);
  }

  function renderPricing() {
    var body = $("price-body");
    body.textContent = "";
    (DATA.pricing || []).forEach(function (r) {
      var src = r.url ? el("a", { href: r.url, target: "_blank", rel: "noopener noreferrer", class: "price-src", text: t("priceSource") }) : null;
      var noteCell = el("td", { class: "price-note" }, [r.note ? document.createTextNode(r.note[state.lang] + (src ? " · " : "")) : null, src]);
      body.appendChild(el("tr", {}, [
        el("th", { scope: "row" }, [document.createTextNode(tr(r.model)), el("span", { class: "maker-sm", text: tr(r.maker) })]),
        el("td", { class: "col-maker", text: tr(r.maker) }),
        el("td", { class: "num", "data-label": t("priceIn"), text: money(r.input) }),
        el("td", { class: "num", "data-label": t("priceOut"), text: money(r.output) }),
        t("priceNoteCol") ? noteCell : null,
      ]));
    });
    var noteHead = document.querySelector(".price-table thead th:last-child");
    if (noteHead) noteHead.hidden = !t("priceNoteCol");
    $("price-note").textContent = t("priceNote") + " " + formatDate(DATA.pricingUpdated) + ".";
  }

  function renderNotices() {
    var list = $("notice-list");
    list.textContent = "";
    (DATA.notices || []).forEach(function (x) {
      list.appendChild(el("li", {}, [
        el("time", { class: "news-time", datetime: x.date, text: formatDate(x.date) }),
        el("p", { text: x.text[state.lang] }),
      ]));
    });
  }


  // ---- Tin, thông báo từ Google Sheet (Ban biên tập) ----
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function plain(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim(); }
  function sheetDate(s) {
    s = String(s || "").trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    if (!m) return "";
    var a = +m[1], b = +m[2], d = a, mo = b;
    if (b > 12 && a <= 12) { d = b; mo = a; }
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
    return m[3] + "-" + ("0" + mo).slice(-2) + "-" + ("0" + d).slice(-2);
  }
  function safeUrl(u) { u = String(u || "").trim(); return /^(https:\/\/|#\/)/.test(u) ? u : ""; }
  function loadSheetNews() {
    var id = (window.PULSE_CONFIG || {}).newsSheetId;
    if (!id || !window.fetch) return;
    fetch("https://docs.google.com/spreadsheets/d/" + encodeURIComponent(id) + "/gviz/tq?tqx=out:csv&headers=1", { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (txt) {
        var rows = parseCSV(txt).slice(1), catByLabel = {}, addN = [], addT = [];
        Object.keys(DATA.categories).forEach(function (k) { catByLabel[plain(DATA.categories[k].label.vi)] = k; });
        var seen = {}; DATA.news.forEach(function (n) { seen[plain(n.title.vi)] = 1; });
        rows.forEach(function (r) {
          if (plain(r[6]) !== "da duyet") return;
          var date = sheetDate(r[0]), title = String(r[3] || "").trim();
          if (!date || !title) return;
          if (plain(r[1]) === "thong bao") { addT.push({ date: date, text: { vi: title, en: title } }); return; }
          if (seen[plain(title)]) return;
          var sum = String(r[4] || "").trim();
          addN.push({ category: catByLabel[plain(r[2])] || "HOATDONG", title: { vi: title, en: title }, summary: { vi: sum, en: sum }, url: safeUrl(r[5]), date: date });
        });
        if (!addN.length && !addT.length) return;
        var byDate = function (a, b) { return (b.date || "").localeCompare(a.date || ""); };
        DATA.news = addN.concat(DATA.news).sort(byDate);
        DATA.notices = addT.concat(DATA.notices || []).sort(byDate);
        renderNews(); renderNotices(); renderHot(); renderTopics();
      })
      .catch(function () { /* giữ nội dung sẵn có */ });
  }

  function renderTopics() {
    [["topic-list", true], ["footer-topics", false]].forEach(function (cfg) {
      var list = $(cfg[0]);
      list.textContent = "";
      Object.keys(DATA.categories).forEach(function (key) {
        var cat = DATA.categories[key];
        var count = DATA.news.filter(function (n) { return n.category === key; }).length;
        var a = el("a", { href: "#/topic/" + key.toLowerCase(), style: "--c:" + cat.color }, [
          cfg[1] ? el("span", { class: "topic-dot" }) : null,
          el("span", { class: "topic-name", text: cat.label[state.lang] }),
          cfg[1] ? el("span", { class: "topic-count", text: count + " " + t("topicStories") }) : null,
        ]);
        list.appendChild(el("li", {}, [a]));
      });
    });
  }

  var gdskGroup = "all", gdskAll = false; var gdskKhoa = "all";
  function renderGdsk() {
    var box = $("gdsk-list"), tabs = $("gdsk-tabs");
    if (!box || !DATA.gdsk) return;
    var G = DATA.gdsk.groups;
    tabs.textContent = "";
    [["all", L("Tất cả", "All"), "#0b4f9c"]].concat(Object.keys(G).map(function (k) { return [k, tr(G[k].label), G[k].color]; })).forEach(function (x) {
      var b = el("button", { class: "tab", style: "--c:" + x[2], type: "button", "aria-pressed": String(gdskGroup === x[0]), text: x[1] });
      b.addEventListener("click", function () { gdskGroup = x[0]; gdskAll = false; renderGdsk(); });
      tabs.appendChild(b);
    });
    var kt = $("gdsk-khoa");
    if (kt) {
      kt.textContent = "";
      var units = ["Phòng Điều dưỡng"];
      (DATA.departments || []).forEach(function (g) {
        if (["lamsang", "canlamsang", "bophan"].indexOf(g.group) >= 0) g.units.forEach(function (u) { units.push(u.name); });
      });
      var cnt = {};
      DATA.gdsk.topics.forEach(function (tp) { if (tp.khoa) cnt[tp.khoa] = (cnt[tp.khoa] || 0) + 1; });
      var sel = el("select", { id: "gdsk-khoa-select", class: "khoa-select" });
      sel.appendChild(el("option", { value: "all", text: L("Tất cả khoa, bộ phận (" + DATA.gdsk.topics.length + " bài)", "All departments (" + DATA.gdsk.topics.length + ")") }));
      units.forEach(function (u) {
        var n = cnt[u] || 0;
        var o = el("option", { value: u, text: tr(u) + (n ? " (" + n + ")" : L(" – sẽ bổ sung", " – coming soon")) });
        if (gdskKhoa === u) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () { gdskKhoa = sel.value; gdskAll = false; renderGdsk(); var s2 = $("gdsk-khoa-select"); if (s2) s2.focus(); });
      kt.appendChild(el("label", { class: "khoa-filter-label", for: "gdsk-khoa-select", text: L("Theo khoa, bộ phận:", "By department:") }));
      kt.appendChild(sel);
    }
    box.textContent = "";
    var list = DATA.gdsk.topics.filter(function (tp) {
      return (gdskGroup === "all" || tp.group === gdskGroup) && (gdskKhoa === "all" || tp.khoa === gdskKhoa) && matches(state.query, [tr(tp.title)].concat(tp.points.map(tr)));
    });
    if (!list.length && gdskKhoa !== "all") {
      box.appendChild(el("p", { class: "gdsk-empty", text: L("Bài truyền thông của " + gdskKhoa + " sẽ được bổ sung sau. Chọn \"Tất cả khoa, bộ phận\" để xem các bài hiện có.", "Articles from this department are coming soon.") }));
    }
    var base = window.innerWidth < 640 ? 3 : 6;
    var limit = (gdskAll || state.query) ? list.length : base;
    list.slice(0, limit).forEach(function (tp) {
      var g = G[tp.group];
      box.appendChild(el("article", { class: "gdsk-card", style: "--c:" + g.color }, [
        el("span", { class: "gdsk-tag", text: tr(g.label) }),
        el("h3", { class: "gdsk-title", text: tr(tp.title) }),
        tp.khoa ? el("p", { class: "gdsk-khoa", text: L("Phụ trách: ", "Responsible: ") + tr(tp.khoa) }) : null,
        el("ul", { class: "gdsk-points" }, tp.points.map(function (s) { return el("li", { text: tr(s) }); })),
        tp.slug ? el("a", { class: "gdsk-link", href: "#/gdsk/" + tp.slug, text: L("Xem chi tiết, mã QR →", "Details and QR code →") }) : null,
      ]));
    });
    var more = $("gdsk-more");
    if (more) { more.hidden = list.length <= base || !!state.query; more.textContent = gdskAll ? L("Thu gọn", "Show less") : L("Xem thêm " + (list.length - base) + " chủ đề", "Show " + (list.length - base) + " more topics"); }
  }

  var roleKey = null;
  function renderRoles() {
    var box = $("roles-list");
    if (!box || !DATA.roles) return;
    box.textContent = "";
    if (!roleKey) roleKey = DATA.roles[0].key;
    var searching = !!state.query;
    var tabs = el("div", { class: "tabs seg-tabs", role: "group", "aria-label": L("Chức danh", "Job title") });
    DATA.roles.forEach(function (r) {
      var b = el("button", { class: "tab", type: "button", style: "--c:#0b4f9c", "aria-pressed": String(!searching && roleKey === r.key), text: tr(r.label) });
      b.addEventListener("click", function () { roleKey = r.key; renderRoles(); });
      tabs.appendChild(b);
    });
    box.appendChild(tabs);
    DATA.roles.forEach(function (r) {
      if (!searching && r.key !== roleKey) return;
      var items = r.items.filter(function (it) { return matches(state.query, [tr(r.label), tr(it)]); });
      if (!items.length) return;
      box.appendChild(el("div", { class: "role-card role-" + r.key }, [
        searching ? el("h3", { class: "role-title", text: tr(r.label) }) : null,
        el("ul", { class: "role-items" }, items.map(function (it) { return el("li", { text: tr(it) }); })),
      ]));
    });
  }

  var deptGroup = null;
  function renderDepts() {
    var box = $("dept-list");
    if (!box || !DATA.departments) return;
    box.textContent = "";
    var total = 0;
    DATA.departments.forEach(function (g) { if (g.group !== "phong" && g.group !== "to") total += g.units.length; });
    var c = $("dept-count"); if (c) c.textContent = total;
    var searching = !!state.query;
    if (!deptGroup) deptGroup = DATA.departments[0].group;
    var tabs = el("div", { class: "tabs seg-tabs", role: "group", "aria-label": L("Nhóm đơn vị", "Unit group") });
    DATA.departments.forEach(function (g) {
      var b = el("button", { class: "tab", type: "button", style: "--c:#0b4f9c", "aria-pressed": String(!searching && deptGroup === g.group), text: tr(g.groupLabel) + " (" + g.units.length + ")" });
      b.addEventListener("click", function () { deptGroup = g.group; renderDepts(); });
      tabs.appendChild(b);
    });
    box.appendChild(tabs);
    var grid = el("div", { class: "dept-grid" });
    DATA.departments.forEach(function (g) {
      if (!searching && g.group !== deptGroup) return;
      g.units.filter(function (u) { return matches(state.query, [tr(u.name), tr(u.desc)]); }).forEach(function (u) {
        var card = el("button", { class: "dept-card dept-" + g.group, type: "button", "aria-expanded": "false" }, [
          el("span", { class: "dept-name", text: tr(u.name) }),
          (u.roles && u.roles.length) ? el("span", { class: "dept-roles" }, u.roles.map(function (r) { return el("span", { class: "role-tag", text: tr(r) }); })) : null,
          el("span", { class: "dept-desc", text: tr(u.desc) }),
        ]);
        if (u.page && DATA.khoa && DATA.khoa[u.page]) {
          card = el("a", { class: "dept-card dept-" + g.group + " dept-has-page", href: "#/khoa/" + u.page }, [
            el("span", { class: "dept-name", text: tr(u.name) }),
            (u.roles && u.roles.length) ? el("span", { class: "dept-roles" }, u.roles.map(function (r) { return el("span", { class: "role-tag", text: tr(r) }); })) : null,
            el("span", { class: "dept-page-link", text: L("Xem trang khoa →", "View department page →") }),
          ]);
        } else {
          card.addEventListener("click", function () { card.setAttribute("aria-expanded", String(card.getAttribute("aria-expanded") !== "true")); });
        }
        grid.appendChild(card);
      });
    });
    box.appendChild(grid);
    box.appendChild(el("p", { class: "dept-hint", text: L("Bấm vào từng đơn vị để xem mô tả.", "Tap a unit to see its description.") }));
  }

  function renderTools() {
    var list = $("tools-list");
    list.textContent = "";
    var shown = DATA.tools.filter(function (tool) {
      return matches(state.query, [tr(tool.name), tool.description[state.lang]]);
    });
    shown.forEach(function (tool) {
      var card = el("button", { class: "tool-card", type: "button" }, [
        el("div", { class: "tool-card-top" }, [
          (function () { var sw = el("div", { class: "tool-swatch" }); if (tool.icon) sw.innerHTML = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tool.icon + '</svg>'; else sw.setAttribute("style", "background:" + tool.gradient); return sw; })(),
          tool.tag ? el("span", { class: "tool-tag", style: "--c:" + tool.tag.color, text: tool.tag[state.lang] }) : null,
        ]),
        el("div", { class: "tool-name", text: tr(tool.name) }),
        el("div", { class: "tool-desc", text: tool.description[state.lang] }),
      ]);
      card.addEventListener("click", function () { openTool(tool.id); });
      list.appendChild(card);
    });
    $("tools-empty").hidden = shown.length > 0;
  }

  var dialog = $("tool-dialog");

  function fillDialog() {
    var tool = DATA.tools.find(function (x) { return x.id === state.toolId; });
    if (!tool) return;
    var dsw = $("dlg-swatch");
    if (tool.icon) { dsw.removeAttribute("style"); dsw.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tool.icon + '</svg>'; }
    else dsw.setAttribute("style", "background:" + tool.gradient);
    $("dlg-name").textContent = tr(tool.name);
    $("dlg-desc").textContent = tool.description[state.lang];
    $("dlg-detail").textContent = tool.detail[state.lang];
    var tag = $("dlg-tag");
    tag.hidden = !tool.tag;
    if (tool.tag) { tag.textContent = tool.tag[state.lang]; tag.setAttribute("style", "--c:" + tool.tag.color); }
    var visit = $("dlg-visit");
    visit.hidden = !tool.url;
    if (tool.url) visit.setAttribute("href", tool.url);
  }

  function openTool(id) {
    state.toolId = id;
    fillDialog();
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
  }
  function closeTool() {
    state.toolId = null;
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
  }
  $("dlg-x").addEventListener("click", closeTool);
  $("dlg-close").addEventListener("click", closeTool);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeTool(); });
  dialog.addEventListener("close", function () { state.toolId = null; });

  // Search
  var panel = $("search-panel"), searchBtn = $("search-btn"), searchInput = $("search-input");
  function setSearch(open) {
    panel.hidden = !open;
    searchBtn.setAttribute("aria-expanded", String(open));
    if (open) searchInput.focus();
    else { searchInput.value = ""; state.query = ""; renderNews(); renderTools(); renderDepts(); renderRoles(); renderGdsk(); }
  }
  searchBtn.addEventListener("click", function () { setSearch(panel.hidden); });
  $("search-close").addEventListener("click", function () { setSearch(false); });
  searchInput.addEventListener("input", function () { state.query = searchInput.value.trim(); renderNews(); renderTools(); renderDepts(); renderRoles(); renderGdsk(); });
  searchInput.addEventListener("keydown", function (e) { if (e.key === "Escape") setSearch(false); });

  // Theme (sáng mặc định)
  $("theme-btn").addEventListener("click", function () {
    var dark = document.documentElement.getAttribute("data-theme") !== "dark";
    if (dark) document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#0a0a10" : "#f6f7fb");
    try { localStorage.setItem("pulse-theme", dark ? "dark" : "light"); } catch (e) {}
  });

  // Language
  $("lang-btn").addEventListener("click", function () {
    state.lang = state.lang === "en" ? "vi" : "en";
    try { localStorage.setItem("pulse-lang", state.lang); } catch (e) {}
    renderAll();
    if (state.toolId) fillDialog();
    resetMessage();
  });

  // Subscribe
  var form = $("subscribe-form"), message = $("form-message"), submit = $("subscribe-submit");
  var lastMessage = null;
  function showMessage(kind, key) {
    lastMessage = { kind: kind, key: key };
    message.className = "form-message " + kind;
    message.textContent = t(key);
  }
  function resetMessage() { if (lastMessage) showMessage(lastMessage.kind, lastMessage.key); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("email-input").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("error", "errorInvalid");
    if (!CONFIG.subscribeEndpoint) return showMessage("error", "errorNotConfigured");

    submit.disabled = true;
    submit.textContent = t("sending");
    var body = new FormData();
    body.append("email", email);
    fetch(CONFIG.subscribeEndpoint, { method: "POST", body: body, headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.hidden = true;
        $("microcopy").hidden = true;
        showMessage("success", "subscribedMsg");
      })
      .catch(function () { showMessage("error", "errorFailed"); })
      .then(function () { submit.disabled = false; submit.textContent = t("getDigestBtn"); });
  });

  // Contact link
  var contact = $("contact-link");
  var contactTop = $("contact-top");
  if (CONFIG.contactEmail) { contact.setAttribute("href", "mailto:" + CONFIG.contactEmail); contactTop.setAttribute("href", "mailto:" + CONFIG.contactEmail); }
  else { contact.hidden = true; contactTop.hidden = true; }

  var studioLink = $("studio-link");
  if (CONFIG.studioUrl) { studioLink.setAttribute("href", CONFIG.studioUrl); studioLink.hidden = false; }

  // "View all" resets filters
  $("view-all").addEventListener("click", function () {
    state.category = "ALL";
    if (!panel.hidden) setSearch(false);
    renderTabs(); renderNews(); renderTools();
  });

  // Sub-pages (#/about, #/guides, #/privacy, #/terms)
  var PAGE_RE = /^#\/(about|guides|privacy|terms|nguoibenh|daotao|hoidap)$/;
  var GDSK_RE = /^#\/gdsk\/([a-z0-9-]+)$/;
  var TOPIC_RE = /^#\/topic\/([a-z]+)$/;
  var KHOA_RE = /^#\/khoa\/([a-z0-9-]+)$/;
  var homeView = $("home-view"), pageView = $("page-view");

  function currentPage() {
    var m = PAGE_RE.exec(location.hash);
    if (m) return m[1];
    var tm = TOPIC_RE.exec(location.hash);
    if (tm && DATA.categories[tm[1].toUpperCase()]) return "topic:" + tm[1].toUpperCase();
    var gm = GDSK_RE.exec(location.hash);
    if (gm && DATA.gdsk.topics.some(function (x) { return x.slug === gm[1]; })) return "gdsk:" + gm[1];
    var km = KHOA_RE.exec(location.hash);
    return km && DATA.khoa && DATA.khoa[km[1]] ? "khoa:" + km[1] : null;
  }

  function renderTopicPage(key) {
    var cat = DATA.categories[key];
    pageView.textContent = "";
    pageView.appendChild(el("a", { class: "back-link", href: "#top", text: t("backHome") }));
    pageView.appendChild(el("span", { class: "tag", style: "--c:" + cat.color, text: t("topicHeading") }));
    pageView.appendChild(el("h1", { class: "page-title", text: cat.label[state.lang] }));
    if (cat.intro) pageView.appendChild(el("p", { class: "page-intro", text: cat.intro[state.lang] }));
    var list = el("div", { class: "news-list page-news" });
    DATA.news.filter(function (n) { return n.category === key; }).forEach(function (n) { list.appendChild(newsCard(n)); });
    pageView.appendChild(list);
    document.title = cat.label[state.lang] + L(" — Điều dưỡng BV Nhật Tân", " — Nhat Tan Hospital Nursing");
  }

  function renderKhoaPage(key) {
    var k = DATA.khoa[key];
    pageView.textContent = "";
    pageView.appendChild(el("a", { class: "back-link", href: "#dept-section", text: L("← Danh sách khoa, phòng", "← Departments") }));
    pageView.appendChild(el("span", { class: "tag", style: "--c:#0b4f9c", text: L("Trang khoa", "Department page") }));
    pageView.appendChild(el("h1", { class: "page-title", text: tr(k.name) }));
    pageView.appendChild(el("p", { class: "page-intro", text: tr(k.intro) }));
    if (k.photos && k.photos[0]) {
      pageView.appendChild(el("figure", { class: "khoa-hero" }, [
        el("img", { src: k.photos[0][0], alt: tr(k.photos[0][1]), loading: "eager" }),
        el("figcaption", { text: tr(k.photos[0][1]) }),
      ]));
    }
    pageView.appendChild(el("dl", { class: "khoa-facts" }, [].concat.apply([], k.facts.map(function (f) { return [el("dt", { text: tr(f[0]) }), el("dd", { text: tr(f[1]) })]; }))));
    k.sections.forEach(function (s) {
      pageView.appendChild(el("section", { class: "page-section" }, [
        el("h2", { text: tr(s.h) }),
        el("ul", {}, s.items.map(function (txt) { return el("li", { text: tr(txt) }); })),
      ]));
    });
    if (k.photos && k.photos.length > 1) {
      pageView.appendChild(el("section", { class: "page-section" }, [
        el("h2", { text: L("Hình ảnh hoạt động", "Photos") }),
        el("div", { class: "khoa-gallery" }, k.photos.slice(1).map(function (p) {
          return el("figure", {}, [el("img", { src: p[0], alt: tr(p[1]), loading: "lazy" }), el("figcaption", { text: tr(p[1]) })]);
        })),
      ]));
    }
    if (k.qr) {
      pageView.appendChild(el("section", { class: "page-section khoa-qr" }, [
        el("h2", { text: tr(k.qr.title) }),
        el("img", { src: k.qr.img, alt: L("Mã QR Zalo ", "Zalo QR code ") + tr(k.name), loading: "lazy", width: "320" }),
        el("p", { text: tr(k.qr.text) }),
      ]));
    }
    if (k.message) pageView.appendChild(el("blockquote", { class: "khoa-message", text: tr(k.message) }));
    document.title = tr(k.name) + L(" — Điều dưỡng BV Nhật Tân", " — Nhat Tan Hospital Nursing");
  }

  function renderGdskPage(slug) {
    var tp = DATA.gdsk.topics.filter(function (x) { return x.slug === slug; })[0];
    var g = DATA.gdsk.groups[tp.group];
    pageView.textContent = "";
    pageView.appendChild(el("a", { class: "back-link", href: "#gdsk-section", text: L("← Góc giáo dục sức khỏe", "← Health education corner") }));
    pageView.appendChild(el("span", { class: "tag", style: "--c:" + g.color, text: tr(g.label) }));
    pageView.appendChild(el("h1", { class: "page-title", text: tr(tp.title) }));
    if (tp.khoa) pageView.appendChild(el("p", { class: "gdsk-khoa", text: L("Khoa, phòng phụ trách: ", "Responsible department: ") + tr(tp.khoa) }));
    var art = tp.article;
    if (art) {
      if (art.heading) pageView.appendChild(el("p", { class: "art-heading", text: art.heading }));
      pageView.appendChild(el("dl", { class: "art-info" }, [
        el("dt", { text: L("Đối tượng", "Audience") }), el("dd", { text: art.audience }),
        el("dt", { text: L("Mục tiêu", "Goal") }), el("dd", { text: art.goal }),
      ]));
      art.sections.forEach(function (sec) {
        var box = el("section", { class: "page-section art-section" }, [el("h2", { text: sec.h })]);
        sec.blocks.forEach(function (b) {
          if (b.p) box.appendChild(el("p", { text: b.p }));
          else if (b.items) box.appendChild(el(b.ordered ? "ol" : "ul", { class: b.ordered ? "art-steps" : "" }, b.items.map(function (s) { return el("li", { text: s }); })));
          else if (b.note) box.appendChild(el("p", { class: "art-note", text: b.note }));
        });
        pageView.appendChild(box);
      });
      if (art.key) pageView.appendChild(el("div", { class: "art-key" }, [el("strong", { text: L("Thông điệp cần nhớ", "Key message") }), el("p", { text: art.key })]));
    } else {
      pageView.appendChild(el("section", { class: "page-section" }, [
        el("h2", { text: L("Điều cần biết", "Key points") }),
        el("ul", {}, tp.points.map(function (s) { return el("li", { text: tr(s) }); })),
      ]));
      pageView.appendChild(el("p", { class: "art-pending", text: L("Bài truyền thông đầy đủ của chủ đề này đang được biên soạn theo cấu trúc chung và sẽ đăng sau khi bác sĩ duyệt.", "The full article for this topic is being prepared and will be published after medical review.") }));
    }
    if (tp.files && tp.files.length) {
      pageView.appendChild(el("section", { class: "page-section" }, [
        el("h2", { text: L("Tài liệu tải về", "Downloads") }),
        el("ul", {}, tp.files.map(function (f) { return el("li", {}, [el("a", { href: f.url, target: "_blank", rel: "noopener noreferrer", text: tr(f.name) })]); })),
      ]));
    }
    if (art && art.refs && art.refs.length) {
      pageView.appendChild(el("section", { class: "page-section art-refs" }, [
        el("h2", { text: L("Tài liệu tham khảo", "References") }),
        el("ol", {}, art.refs.map(function (r) { return el("li", { text: r }); })),
        el("p", { class: "art-meta", text: L("Mã ", "Code ") + art.code + L(" · Phiên bản ", " · Version ") + art.version + (art.approved ? L(" · Duyệt ngày ", " · Approved ") + formatDate(art.approved) : "") }),
      ]));
    }
    pageView.appendChild(el("section", { class: "page-section gdsk-qr" }, [
      el("h2", { text: L("Mã QR của chủ đề", "QR code for this topic") }),
      el("img", { src: "img/qr/gdsk-" + tp.slug + ".png", alt: L("Mã QR mở trang ", "QR code opening the page ") + tr(tp.title), width: "180", height: "180" }),
      el("p", { text: L("Quét mã để mở lại trang này trên điện thoại. Khoa có thể in mã này lên tờ bướm, poster.", "Scan to reopen this page on your phone. Wards can print this code on leaflets and posters.") }),
    ]));
    pageView.appendChild(el("p", { class: "page-note", text: L("Nội dung mang tính hướng dẫn chung, không thay thế chỉ định của bác sĩ. Khi có dấu hiệu nặng, đến bệnh viện, cơ sở y tế gần nhất ngay. Tổng đài: 0296 3562 357.", "General guidance only, not a substitute for medical advice. If warning signs appear, go to the nearest hospital or health facility immediately. Switchboard: 0296 3562 357.") }));
    document.title = tr(tp.title) + L(" — Điều dưỡng BV Nhật Tân", " — Nhat Tan Hospital Nursing");
  }

  function renderPage(name) {
    var page = DATA.pages[name];
    pageView.textContent = "";
    pageView.appendChild(el("a", { class: "back-link", href: "#top", text: t("backHome") }));
    pageView.appendChild(el("h1", { class: "page-title", text: page.title[state.lang] }));
    if (page.intro) pageView.appendChild(el("p", { class: "page-intro", text: page.intro[state.lang] }));
    if (page.updated) {
      var d = new Date(page.updated + "T00:00:00");
      pageView.appendChild(el("p", { class: "page-updated", text: t("lastUpdated") + ": " + d.toLocaleDateString(state.lang === "vi" ? "vi-VN" : "en-US", { year: "numeric", month: "long", day: "numeric" }) }));
    }
    page.sections.forEach(function (s) {
      var block = el("section", { class: "page-section" }, [el("h2", { text: s.h[state.lang] })]);
      if (s.p) block.appendChild(el("p", { text: s.p[state.lang] }));
      if (s.items) {
        block.appendChild(el(s.ordered ? "ol" : "ul", {}, s.items[state.lang].map(function (txt) { return el("li", { text: txt }); })));
      }
      pageView.appendChild(block);
    });
    document.title = page.title[state.lang] + L(" — Điều dưỡng BV Nhật Tân", " — Nhat Tan Hospital Nursing");
  }

  function route(scroll) {
    var name = currentPage();
    if (name) {
      homeView.hidden = true;
      pageView.hidden = false;
      if (name.indexOf("topic:") === 0) renderTopicPage(name.slice(6)); else if (name.indexOf("khoa:") === 0) renderKhoaPage(name.slice(5)); else if (name.indexOf("gdsk:") === 0) renderGdskPage(name.slice(5)); else renderPage(name);
      pageView.appendChild(el("div", { class: "page-home" }, [el("a", { class: "back-link home-btn", href: "#top", text: L("← Về trang chủ", "← Back to home") })]));
      if (scroll) window.scrollTo(0, 0);
    } else {
      var wasPage = !pageView.hidden;
      pageView.hidden = true;
      homeView.hidden = false;
      document.title = t("pageTitle");
      if (scroll && wasPage) {
        var target = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
        if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
      }
    }
  }
  window.addEventListener("hashchange", function () { route(true); });

  function renderAll() {
    applyI18n();
    renderTabs();
    renderNews();
    renderTools();
    renderDepts();
    renderRoles();
    renderGdsk();
    renderHot();
    renderPricing();
    renderNotices();
    renderTopics();
    route(false);
  }
  (function () {
    var gm = $("gdsk-more"); if (gm) gm.addEventListener("click", function () { gdskAll = !gdskAll; renderGdsk(); });
    var nm = $("news-more"); if (nm) nm.addEventListener("click", function () { newsAll = !newsAll; renderNews(); });
  })();

  renderAll();
  loadSheetNews();
})();
