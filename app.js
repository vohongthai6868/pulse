(function () {
  var CONFIG = window.PULSE_CONFIG || {};
  var DATA = window.PULSE_DATA;
  var $ = function (id) { return document.getElementById(id); };

  var state = { lang: "en", category: "ALL", query: "", toolId: null };
  try {
    var saved = localStorage.getItem("pulse-lang");
    state.lang = saved === "vi" || saved === "en" ? saved : (navigator.language || "").toLowerCase().indexOf("vi") === 0 ? "vi" : "en";
  } catch (e) {}

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

  var BOLT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>';

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
    $("lang-btn").textContent = state.lang === "en" ? "VI" : "EN";
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
    if (nm) { nm.hidden = shown.length <= nb || !!state.query; nm.textContent = newsAll ? "Thu gọn" : "Xem thêm " + (shown.length - nb) + " tin"; }
  }

  function newsCard(n) {
      var cat = DATA.categories[n.category];
      var thumb = el("div", { class: "news-thumb", "aria-hidden": "true" });
      thumb.innerHTML = cat.icon ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + cat.icon + '</svg>' : BOLT;
      var body = el("div", { class: "news-body" }, [
        el("div", { class: "news-meta" }, [
          el("span", { class: "tag", text: cat.label[state.lang] }),
          n.date ? el("time", { class: "news-time", datetime: n.date, text: formatDate(n.date) }) : null,
        ]),
        el("div", { class: "news-title", text: n.title[state.lang] }),
        el("div", { class: "news-summary", text: n.summary[state.lang] }),
      ]);
      var card = n.url
        ? el("a", { class: "news-card", href: n.url, target: "_blank", rel: "noopener noreferrer", style: "--c:" + cat.color }, [thumb, body])
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
        el("th", { scope: "row" }, [document.createTextNode(r.model), el("span", { class: "maker-sm", text: r.maker })]),
        el("td", { class: "col-maker", text: r.maker }),
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

  var gdskGroup = "all", gdskAll = false;
  function renderGdsk() {
    var box = $("gdsk-list"), tabs = $("gdsk-tabs");
    if (!box || !DATA.gdsk) return;
    var G = DATA.gdsk.groups;
    tabs.textContent = "";
    [["all", "Tất cả", "#0b4f9c"]].concat(Object.keys(G).map(function (k) { return [k, G[k].label, G[k].color]; })).forEach(function (x) {
      var b = el("button", { class: "tab", style: "--c:" + x[2], type: "button", "aria-pressed": String(gdskGroup === x[0]), text: x[1] });
      b.addEventListener("click", function () { gdskGroup = x[0]; gdskAll = false; renderGdsk(); });
      tabs.appendChild(b);
    });
    box.textContent = "";
    var list = DATA.gdsk.topics.filter(function (tp) {
      return (gdskGroup === "all" || tp.group === gdskGroup) && matches(state.query, [tp.title].concat(tp.points));
    });
    var base = window.innerWidth < 640 ? 3 : 6;
    var limit = (gdskAll || state.query) ? list.length : base;
    list.slice(0, limit).forEach(function (tp) {
      var g = G[tp.group];
      box.appendChild(el("article", { class: "gdsk-card", style: "--c:" + g.color }, [
        el("span", { class: "gdsk-tag", text: g.label }),
        el("h3", { class: "gdsk-title", text: tp.title }),
        el("ul", { class: "gdsk-points" }, tp.points.map(function (s) { return el("li", { text: s }); })),
      ]));
    });
    var more = $("gdsk-more");
    if (more) { more.hidden = list.length <= base || !!state.query; more.textContent = gdskAll ? "Thu gọn" : "Xem thêm " + (list.length - base) + " chủ đề"; }
  }

  var roleKey = null;
  function renderRoles() {
    var box = $("roles-list");
    if (!box || !DATA.roles) return;
    box.textContent = "";
    if (!roleKey) roleKey = DATA.roles[0].key;
    var searching = !!state.query;
    var tabs = el("div", { class: "tabs seg-tabs", role: "group", "aria-label": "Chức danh" });
    DATA.roles.forEach(function (r) {
      var b = el("button", { class: "tab", type: "button", style: "--c:#0b4f9c", "aria-pressed": String(!searching && roleKey === r.key), text: r.label });
      b.addEventListener("click", function () { roleKey = r.key; renderRoles(); });
      tabs.appendChild(b);
    });
    box.appendChild(tabs);
    DATA.roles.forEach(function (r) {
      if (!searching && r.key !== roleKey) return;
      var items = r.items.filter(function (it) { return matches(state.query, [r.label, it]); });
      if (!items.length) return;
      box.appendChild(el("div", { class: "role-card role-" + r.key }, [
        searching ? el("h3", { class: "role-title", text: r.label }) : null,
        el("ul", { class: "role-items" }, items.map(function (it) { return el("li", { text: it }); })),
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
    var tabs = el("div", { class: "tabs seg-tabs", role: "group", "aria-label": "Nhóm đơn vị" });
    DATA.departments.forEach(function (g) {
      var b = el("button", { class: "tab", type: "button", style: "--c:#0b4f9c", "aria-pressed": String(!searching && deptGroup === g.group), text: g.groupLabel + " (" + g.units.length + ")" });
      b.addEventListener("click", function () { deptGroup = g.group; renderDepts(); });
      tabs.appendChild(b);
    });
    box.appendChild(tabs);
    var grid = el("div", { class: "dept-grid" });
    DATA.departments.forEach(function (g) {
      if (!searching && g.group !== deptGroup) return;
      g.units.filter(function (u) { return matches(state.query, [u.name, u.desc]); }).forEach(function (u) {
        var card = el("button", { class: "dept-card dept-" + g.group, type: "button", "aria-expanded": "false" }, [
          el("span", { class: "dept-name", text: u.name }),
          (u.roles && u.roles.length) ? el("span", { class: "dept-roles" }, u.roles.map(function (r) { return el("span", { class: "role-tag", text: r }); })) : null,
          el("span", { class: "dept-desc", text: u.desc }),
        ]);
        card.addEventListener("click", function () { card.setAttribute("aria-expanded", String(card.getAttribute("aria-expanded") !== "true")); });
        grid.appendChild(card);
      });
    });
    box.appendChild(grid);
    box.appendChild(el("p", { class: "dept-hint", text: "Bấm vào từng đơn vị để xem mô tả." }));
  }

  function renderTools() {
    var list = $("tools-list");
    list.textContent = "";
    var shown = DATA.tools.filter(function (tool) {
      return matches(state.query, [tool.name, tool.description[state.lang]]);
    });
    shown.forEach(function (tool) {
      var card = el("button", { class: "tool-card", type: "button" }, [
        el("div", { class: "tool-card-top" }, [
          (function () { var sw = el("div", { class: "tool-swatch" }); if (tool.icon) sw.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tool.icon + '</svg>'; else sw.setAttribute("style", "background:" + tool.gradient); return sw; })(),
          tool.tag ? el("span", { class: "tool-tag", style: "--c:" + tool.tag.color, text: tool.tag[state.lang] }) : null,
        ]),
        el("div", { class: "tool-name", text: tool.name }),
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
    $("dlg-name").textContent = tool.name;
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
  var PAGE_RE = /^#\/(about|guides|privacy|terms)$/;
  var TOPIC_RE = /^#\/topic\/([a-z]+)$/;
  var homeView = $("home-view"), pageView = $("page-view");

  function currentPage() {
    var m = PAGE_RE.exec(location.hash);
    if (m) return m[1];
    var tm = TOPIC_RE.exec(location.hash);
    return tm && DATA.categories[tm[1].toUpperCase()] ? "topic:" + tm[1].toUpperCase() : null;
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
    document.title = cat.label[state.lang] + " — Điều dưỡng BV Nhật Tân";
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
    document.title = page.title[state.lang] + " — Điều dưỡng BV Nhật Tân";
  }

  function route(scroll) {
    var name = currentPage();
    if (name) {
      homeView.hidden = true;
      pageView.hidden = false;
      if (name.indexOf("topic:") === 0) renderTopicPage(name.slice(6)); else renderPage(name);
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
})();
