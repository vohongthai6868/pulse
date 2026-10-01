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
    return new Date(day + "T12:00:00").toLocaleDateString(state.lang === "vi" ? "vi-VN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
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
      var color = key === "ALL" ? "#a855f7" : DATA.categories[key].color;
      var label = key === "ALL" ? t("allTab") : DATA.categories[key].label[state.lang];
      var b = el("button", { class: "tab", type: "button", style: "--c:" + color, "aria-pressed": String(state.category === key), text: label });
      b.addEventListener("click", function () { state.category = key; renderTabs(); renderNews(); });
      box.appendChild(b);
    });
  }

  function renderNews() {
    var list = $("news-list");
    list.textContent = "";
    var shown = DATA.news.filter(function (n) {
      return (state.category === "ALL" || n.category === state.category) &&
        matches(state.query, [n.title[state.lang], n.summary[state.lang]]);
    });
    shown.forEach(function (n) {
      var cat = DATA.categories[n.category];
      var thumb = el("div", { class: "news-thumb", "aria-hidden": "true" });
      thumb.innerHTML = BOLT;
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
      list.appendChild(card);
    });
    $("news-empty").hidden = shown.length > 0;
  }

  function renderTools() {
    var list = $("tools-list");
    list.textContent = "";
    var shown = DATA.tools.filter(function (tool) {
      return matches(state.query, [tool.name, tool.description[state.lang]]);
    });
    shown.forEach(function (tool) {
      var swatch = el("div", { class: "tool-swatch", style: "background:" + tool.gradient });
      var row = el("button", { class: "tool-row", type: "button" }, [
        swatch,
        el("div", { class: "tool-text" }, [
          el("div", { class: "tool-name", text: tool.name }),
          el("div", { class: "tool-desc", text: tool.description[state.lang] }),
        ]),
        tool.tag ? el("span", { class: "tool-tag", style: "--c:" + tool.tag.color, text: tool.tag[state.lang] }) : null,
      ]);
      row.addEventListener("click", function () { openTool(tool.id); });
      list.appendChild(row);
    });
    $("tools-empty").hidden = shown.length > 0;
  }

  var dialog = $("tool-dialog");

  function fillDialog() {
    var tool = DATA.tools.find(function (x) { return x.id === state.toolId; });
    if (!tool) return;
    $("dlg-swatch").setAttribute("style", "background:" + tool.gradient);
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
    else { searchInput.value = ""; state.query = ""; renderNews(); renderTools(); }
  }
  searchBtn.addEventListener("click", function () { setSearch(panel.hidden); });
  $("search-close").addEventListener("click", function () { setSearch(false); });
  searchInput.addEventListener("input", function () { state.query = searchInput.value.trim(); renderNews(); renderTools(); });
  searchInput.addEventListener("keydown", function (e) { if (e.key === "Escape") setSearch(false); });

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
  if (CONFIG.contactEmail) contact.setAttribute("href", "mailto:" + CONFIG.contactEmail);
  else contact.hidden = true;

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
  var homeView = $("home-view"), pageView = $("page-view");

  function currentPage() {
    var m = PAGE_RE.exec(location.hash);
    return m ? m[1] : null;
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
    document.title = page.title[state.lang] + " — Pulse";
  }

  function route(scroll) {
    var name = currentPage();
    if (name) {
      homeView.hidden = true;
      pageView.hidden = false;
      renderPage(name);
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
    route(false);
  }
  renderAll();
})();
