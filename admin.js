/* Blue Heron Records — admin (artists + music). Static page, talks to Supabase via REST.
   Gated by a simple client password (music2026), per the owner's choice. */
(function () {
  "use strict";

  var SB = "https://ofolxqldojhifnqmmsws.supabase.co";
  var KEY = "sb_publishable_zRFhmQ8qwrJygM4P9WT8sA_dBxP14c0";
  var PASS = "music2026";

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }

  /* ---------- Supabase REST helpers ---------- */
  function H(extra) {
    var h = { apikey: KEY, Authorization: "Bearer " + KEY };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function jget(path) { return fetch(SB + "/rest/v1/" + path, { headers: H() }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
  function listArtists() { return jget("artists?select=*&order=sort.asc,name.asc"); }
  function saveArtist(a, id) {
    var isUpd = !!id;
    return fetch(SB + "/rest/v1/artists" + (isUpd ? "?id=eq." + id : ""), {
      method: isUpd ? "PATCH" : "POST",
      headers: H({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(a)
    }).then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t || "save failed"); }); return r.json(); });
  }
  function delArtist(id) { return fetch(SB + "/rest/v1/artists?id=eq." + id, { method: "DELETE", headers: H({ Prefer: "return=minimal" }) }); }
  function listTracks(aid) { return jget("tracks?select=*&artist_id=eq." + aid + "&order=sort.asc,created_at.asc"); }
  function addTrack(t) { return fetch(SB + "/rest/v1/tracks", { method: "POST", headers: H({ "Content-Type": "application/json" }), body: JSON.stringify(t) }); }
  function delTrack(id) { return fetch(SB + "/rest/v1/tracks?id=eq." + id, { method: "DELETE", headers: H({ Prefer: "return=minimal" }) }); }
  function uploadFile(bucket, file) {
    var safe = (file.name || "file").toLowerCase().replace(/[^a-z0-9.\-_]/g, "_");
    var obj = Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36) + "-" + safe;
    return fetch(SB + "/storage/v1/object/" + bucket + "/" + obj, {
      method: "POST",
      headers: H({ "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }),
      body: file
    }).then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t || "upload failed"); }); return SB + "/storage/v1/object/public/" + bucket + "/" + obj; });
  }
  function slugify(s) { return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

  /* ---------- Password gate ---------- */
  var gate = $("gate"), app = $("app");
  function unlock() { hide(gate); show(app); loadList(); }
  if (sessionStorage.getItem("bhr_admin") === "1") unlock();
  $("gateForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("gatePass").value === PASS) { sessionStorage.setItem("bhr_admin", "1"); unlock(); }
    else { $("gateMsg").textContent = "Wrong password."; $("gatePass").value = ""; }
  });
  $("logoutBtn").addEventListener("click", function () { sessionStorage.removeItem("bhr_admin"); location.reload(); });

  /* ---------- List view ---------- */
  var listView = $("listView"), editView = $("editView");
  function loadList() {
    $("listEmpty").textContent = "Loading…";
    $("artistList").innerHTML = "";
    listArtists().then(function (rows) {
      if (!rows || !rows.length) { $("listEmpty").textContent = "No profiles yet — add your first one."; return; }
      $("listEmpty").textContent = "";
      $("artistList").innerHTML = rows.map(function (a) {
        var img = a.photo ? '<img src="' + esc(a.photo) + '" alt="" />' : '<img alt="" />';
        var pill = a.published ? '<span class="pill">live</span>' : '<span class="pill draft">draft</span>';
        return '<div class="artist-row" data-id="' + esc(a.id) + '">' + img +
          '<div class="meta"><h3>' + esc(a.name || "(no name)") + " " + pill + "</h3><p>" + esc(a.tagline || a.role || "") + "</p></div>" +
          '<button class="btn btn-outline btn-sm edit-btn" type="button">Edit</button></div>';
      }).join("");
      Array.prototype.forEach.call(document.querySelectorAll(".edit-btn"), function (b) {
        b.addEventListener("click", function () {
          var id = b.closest(".artist-row").getAttribute("data-id");
          var a = rows.filter(function (x) { return String(x.id) === String(id); })[0];
          openEditor(a);
        });
      });
    }).catch(function () { $("listEmpty").textContent = "Couldn't load — check your connection."; });
  }
  $("newBtn").addEventListener("click", function () { openEditor(null); });
  $("backBtn").addEventListener("click", function () { hide(editView); show(listView); loadList(); });

  /* ---------- Editor ---------- */
  var current = null;     // current artist row (null = new)
  var photoUrl = "";      // staged photo url

  var LINKS = ["spotify", "apple", "youtube", "instagram", "facebook", "website"];

  function openEditor(a) {
    current = a;
    photoUrl = (a && a.photo) || "";
    $("editTitle").textContent = a ? "Edit — " + (a.name || "") : "New profile";
    $("f-name").value = (a && a.name) || "";
    $("f-slug").value = (a && a.slug) || "";
    $("f-tagline").value = (a && a.tagline) || "";
    $("f-role").value = (a && a.role) || "";
    $("f-bio").value = (a && a.bio) || "";
    $("f-theme").value = (a && a.theme) || "navy";
    $("f-sort").value = (a && a.sort != null) ? a.sort : 100;
    $("f-pub").checked = a ? !!a.published : true;
    var links = (a && a.links) || {};
    LINKS.forEach(function (k) { $("l-" + k).value = links[k] || ""; });
    // photo preview
    var pp = $("photoPrev");
    if (photoUrl) { pp.src = photoUrl; show(pp); } else { pp.removeAttribute("src"); hide(pp); }
    $("f-photo").value = "";
    $("saveStatus").textContent = "";
    $("deleteBtn").style.display = a ? "" : "none";
    // tracks
    renderTracks();
    hide(listView); show(editView);
    window.scrollTo(0, 0);
  }

  // photo upload on file pick
  $("f-photo").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return;
    $("saveStatus").textContent = "Uploading photo…";
    uploadFile("photos", f).then(function (url) {
      photoUrl = url; var pp = $("photoPrev"); pp.src = url; show(pp); $("saveStatus").textContent = "Photo ready — click Save to keep it.";
    }).catch(function () { $("saveStatus").textContent = "Photo upload failed."; });
  });

  function gather() {
    var name = $("f-name").value.trim();
    var slug = slugify($("f-slug").value) || slugify(name);
    var links = {};
    LINKS.forEach(function (k) { var v = $("l-" + k).value.trim(); if (v) links[k] = v; });
    return {
      name: name, slug: slug,
      tagline: $("f-tagline").value.trim() || null,
      role: $("f-role").value.trim() || null,
      bio: $("f-bio").value.trim() || null,
      theme: $("f-theme").value,
      photo: photoUrl || null,
      links: links,
      sort: parseInt($("f-sort").value, 10) || 100,
      published: $("f-pub").checked
    };
  }

  $("saveBtn").addEventListener("click", function () {
    var a = gather();
    if (!a.name) { $("saveStatus").textContent = "Name is required."; return; }
    if (!a.slug) { $("saveStatus").textContent = "Add a web address (slug)."; return; }
    $("saveStatus").textContent = "Saving…";
    saveArtist(a, current && current.id).then(function (rows) {
      var saved = (rows && rows[0]) || a; current = saved;
      $("editTitle").textContent = "Edit — " + (saved.name || "");
      $("deleteBtn").style.display = "";
      $("saveStatus").textContent = "Saved ✓";
      toast("Saved");
    }).catch(function (e) {
      var msg = (e && e.message || "").indexOf("duplicate") > -1 ? "That web address (slug) is already used." : "Save failed.";
      $("saveStatus").textContent = msg;
    });
  });

  $("deleteBtn").addEventListener("click", function () {
    if (!current || !current.id) return;
    if (!window.confirm("Delete this profile for good?")) return;
    delArtist(current.id).then(function () { toast("Deleted"); hide(editView); show(listView); loadList(); });
  });

  /* ---------- Tracks (music) ---------- */
  function renderTracks() {
    var box = $("trackList");
    if (!current || !current.id) { box.innerHTML = '<p class="muted" style="font-size:.85rem">Save the profile first, then you can add music.</p>'; return; }
    box.innerHTML = '<p class="muted" style="font-size:.85rem">Loading music…</p>';
    listTracks(current.id).then(function (rows) {
      if (!rows || !rows.length) { box.innerHTML = '<p class="muted" style="font-size:.85rem">No tracks yet.</p>'; return; }
      box.innerHTML = rows.map(function (t) {
        return '<div class="track" data-id="' + esc(t.id) + '"><span class="t-title">' + esc(t.title || "Untitled") + "</span>" +
          (t.audio ? '<audio controls preload="none" src="' + esc(t.audio) + '"></audio>' : "") +
          '<button class="btn btn-danger btn-sm t-del" type="button">&times;</button></div>';
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".t-del"), function (b) {
        b.addEventListener("click", function () {
          var id = b.closest(".track").getAttribute("data-id");
          if (!window.confirm("Remove this track?")) return;
          delTrack(id).then(renderTracks);
        });
      });
    }).catch(function () { box.innerHTML = '<p class="muted" style="font-size:.85rem">Couldn’t load tracks.</p>'; });
  }

  $("addTrackBtn").addEventListener("click", function () {
    if (!current || !current.id) { $("trackStatus").textContent = "Save the profile first."; return; }
    var f = $("t-file").files && $("t-file").files[0];
    var title = $("t-title").value.trim();
    if (!f) { $("trackStatus").textContent = "Pick an audio file."; return; }
    $("trackStatus").textContent = "Uploading…";
    uploadFile("music", f).then(function (url) {
      return addTrack({ artist_id: current.id, title: title || f.name.replace(/\.[^.]+$/, ""), audio: url, sort: 100 });
    }).then(function () {
      $("t-title").value = ""; $("t-file").value = ""; $("trackStatus").textContent = "Added ✓"; renderTracks();
    }).catch(function () { $("trackStatus").textContent = "Upload failed."; });
  });

  /* ---------- Tabs ---------- */
  function setTab(name) {
    $("tab-artists").classList.toggle("hidden", name !== "artists");
    $("tab-shows").classList.toggle("hidden", name !== "shows");
    $("tab-subs").classList.toggle("hidden", name !== "subs");
    $("tab-listen").classList.toggle("hidden", name !== "listen");
    $("tab-bands").classList.toggle("hidden", name !== "bands");
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) { var on = b.getAttribute("data-tab") === name; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    if (name === "artists") { show(listView); hide(editView); loadList(); }
    else if (name === "shows") { var sf = $("s-form"); if (sf) sf.classList.add("hidden"); loadShows(); fillArtistDropdown(); }
    else if (name === "subs") { loadSubs(); }
    else if (name === "listen") { loadListen(); }
    else if (name === "bands") { var bf = $("b-form"); if (bf) bf.classList.add("hidden"); loadBands(); }
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
    b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
  });

  /* ---------- House Band acts ---------- */
  var bandRows = [];
  var editingBandId = null;
  function bandFormReset() {
    editingBandId = null;
    ["b-name", "b-desc", "b-tag", "b-sort"].forEach(function (id) { if ($(id)) $(id).value = ""; });
    if ($("b-add")) $("b-add").textContent = "Add act";
    if ($("b-formTitle")) $("b-formTitle").textContent = "Add an act";
    if ($("b-status")) $("b-status").textContent = "";
  }
  function bandEdit(id) {
    var b = bandRows.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!b) return;
    editingBandId = b.id;
    $("b-name").value = b.name || "";
    $("b-desc").value = b.description || "";
    $("b-tag").value = b.tag || "";
    if ($("b-sort")) $("b-sort").value = (b.sort == null ? "" : b.sort);
    if ($("b-add")) $("b-add").textContent = "Save changes";
    if ($("b-formTitle")) $("b-formTitle").textContent = "Edit act";
    $("b-status").textContent = "";
    $("b-form").classList.remove("hidden");
    $("b-form").scrollIntoView({ block: "nearest" });
    $("b-name").focus();
  }
  function loadBands() {
    var box = $("b-list");
    jget("bands?select=*&order=sort.asc,created_at.asc").then(function (rows) {
      bandRows = rows || [];
      if (!bandRows.length) { $("b-empty").textContent = "No acts yet — add one."; box.innerHTML = ""; return; }
      $("b-empty").textContent = "";
      box.innerHTML = bandRows.map(function (b) {
        var meta = ["Order " + (b.sort == null ? 100 : b.sort), b.description, b.tag].filter(Boolean).map(esc).join(" · ");
        return '<div class="artist-row" data-id="' + esc(b.id) + '"><div class="meta"><h3>' + esc(b.name || "Untitled") + "</h3><p>" + meta + '</p></div><button class="btn btn-outline btn-sm b-edit" type="button">Edit</button><button class="btn btn-danger btn-sm b-del" type="button">Remove</button></div>';
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".b-edit"), function (btn) {
        btn.addEventListener("click", function () { bandEdit(btn.closest("[data-id]").getAttribute("data-id")); });
      });
      Array.prototype.forEach.call(box.querySelectorAll(".b-del"), function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.closest("[data-id]").getAttribute("data-id");
          if (!window.confirm("Remove this act?")) return;
          fetch(SB + "/rest/v1/bands?id=eq." + id, { method: "DELETE", headers: H({ Prefer: "return=minimal" }) }).then(function () { if (String(editingBandId) === String(id)) bandFormReset(); loadBands(); });
        });
      });
    }).catch(function () { box.innerHTML = '<p class="muted">Couldn’t load acts.</p>'; });
  }
  if ($("b-newBtn")) $("b-newBtn").addEventListener("click", function () {
    bandFormReset();
    $("b-form").classList.remove("hidden");
    $("b-name").focus();
  });
  if ($("b-cancel")) $("b-cancel").addEventListener("click", function () { $("b-form").classList.add("hidden"); bandFormReset(); });
  if ($("b-add")) $("b-add").addEventListener("click", function () {
    var name = $("b-name").value.trim();
    if (!name) { $("b-status").textContent = "Name is required."; return; }
    var sortVal = parseInt(($("b-sort").value || "").trim(), 10);
    var row = { name: name, description: $("b-desc").value.trim() || null, tag: $("b-tag").value.trim() || null, sort: isNaN(sortVal) ? 100 : sortVal };
    var editing = editingBandId;
    $("b-status").textContent = editing ? "Saving…" : "Adding…";
    var url = editing ? SB + "/rest/v1/bands?id=eq." + editing : SB + "/rest/v1/bands";
    var method = editing ? "PATCH" : "POST";
    fetch(url, { method: method, headers: H({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(row) })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); $("b-status").textContent = editing ? "Saved ✓" : "Added ✓"; $("b-form").classList.add("hidden"); bandFormReset(); loadBands(); })
      .catch(function () { $("b-status").textContent = editing ? "Save failed." : "Add failed."; });
  });

  /* ---------- Listen: featured-song streaming links ---------- */
  var LS_KEYS = { "ls-spotify": "listen_spotify", "ls-apple": "listen_apple", "ls-amazon": "listen_amazon", "ls-youtube": "listen_youtube" };
  function loadListen() {
    if ($("ls-status")) $("ls-status").textContent = "";
    jget("settings?select=key,value&key=in.(listen_spotify,listen_apple,listen_amazon,listen_youtube)").then(function (rows) {
      var map = {};
      (rows || []).forEach(function (r) { map[r.key] = r.value || ""; });
      Object.keys(LS_KEYS).forEach(function (id) { if ($(id)) $(id).value = map[LS_KEYS[id]] || ""; });
    }).catch(function () { if ($("ls-status")) $("ls-status").textContent = "Couldn’t load links."; });
  }
  if ($("ls-save")) $("ls-save").addEventListener("click", function () {
    var rows = Object.keys(LS_KEYS).map(function (id) { return { key: LS_KEYS[id], value: ($(id).value || "").trim() }; });
    $("ls-status").textContent = "Saving…";
    fetch(SB + "/rest/v1/settings?on_conflict=key", {
      method: "POST",
      headers: H({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
      $("ls-status").textContent = "Saved ✓";
    }).catch(function () { $("ls-status").textContent = "Save failed."; });
  });

  /* ---------- Shows / events ---------- */
  var showRows = [];
  var editingShowId = null;
  function showFormReset() {
    editingShowId = null;
    ["s-date", "s-time", "s-ticket", "s-phone", "s-loc", "s-desc", "s-artist"].forEach(function (id) { if ($(id)) $(id).value = ""; });
    if ($("s-add")) $("s-add").textContent = "Add show";
    if ($("s-formTitle")) $("s-formTitle").textContent = "Add a show";
    if ($("s-status")) $("s-status").textContent = "";
  }
  function showEdit(id) {
    var e = showRows.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!e) return;
    editingShowId = e.id;
    $("s-date").value = e.date || ""; $("s-time").value = e.time || ""; $("s-ticket").value = e.ticket_url || "";
    $("s-phone").value = e.phone || ""; $("s-loc").value = e.location || ""; $("s-desc").value = e.description || "";
    if ($("s-artist")) $("s-artist").value = e.artist_slug || "";
    if ($("s-add")) $("s-add").textContent = "Save changes";
    if ($("s-formTitle")) $("s-formTitle").textContent = "Edit show";
    $("s-status").textContent = "";
    $("s-form").classList.remove("hidden");
    $("s-form").scrollIntoView({ block: "nearest" });
    $("s-date").focus();
  }
  function loadShows() {
    var box = $("s-list"); box.innerHTML = '<p class="muted">Loading…</p>';
    jget("shows?select=*&order=date.asc").then(function (rows) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      showRows = (rows || []).filter(function (e) { return e.date && new Date(e.date + "T23:59:59") >= today; });
      if (!showRows.length) { box.innerHTML = '<p class="muted">No upcoming shows.</p>'; return; }
      box.innerHTML = showRows.map(function (e) {
        var dt = new Date(e.date + "T00:00:00");
        var when = isNaN(dt) ? esc(e.date) : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        var meta = [e.location, e.time, e.phone, e.ticket_url].filter(Boolean).map(esc).join(" · ");
        return '<div class="artist-row" data-id="' + esc(e.id) + '"><div class="meta"><h3>' + when + " · " + esc(e.description || "Show") + "</h3><p>" + meta + '</p></div><button class="btn btn-outline btn-sm s-remind" data-ch="email" type="button">Email the list</button><button class="btn btn-outline btn-sm s-edit" type="button">Edit</button><button class="btn btn-danger btn-sm s-del" type="button">Remove</button></div>';
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".s-del"), function (b) {
        b.addEventListener("click", function () {
          var id = b.closest("[data-id]").getAttribute("data-id");
          if (!window.confirm("Remove this show?")) return;
          fetch(SB + "/rest/v1/shows?id=eq." + id, { method: "DELETE", headers: H({ Prefer: "return=minimal" }) }).then(function () { if (String(editingShowId) === String(id)) showFormReset(); loadShows(); });
        });
      });
      Array.prototype.forEach.call(box.querySelectorAll(".s-edit"), function (b) {
        b.addEventListener("click", function () { showEdit(b.closest("[data-id]").getAttribute("data-id")); });
      });
      Array.prototype.forEach.call(box.querySelectorAll(".s-remind"), function (b) {
        b.addEventListener("click", function () {
          var id = b.closest("[data-id]").getAttribute("data-id");
          var show = showRows.filter(function (x) { return String(x.id) === String(id); })[0];
          if (show) sendReminder(show);
        });
      });
    }).catch(function () { box.innerHTML = '<p class="muted">Couldn’t load shows.</p>'; });
  }
  function sendReminder(show) {
    jget("subscribers?select=email").then(function (subs) {
      subs = subs || [];
      var dt = new Date(show.date + "T00:00:00");
      var when = isNaN(dt) ? show.date : dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      var body = [
        "Hi from Blue Heron Records!", "",
        "Don't miss this show:",
        (show.description || "Live show"),
        when + (show.time ? " · " + show.time : ""),
        (show.location || ""),
        (show.ticket_url ? "Tickets: " + show.ticket_url : ""),
        "", "See you there!", "— Blue Heron Records"
      ].filter(Boolean).join("\n");
      var emails = subs.map(function (s) { return s.email; }).filter(Boolean);
      if (!emails.length) { toast("No email subscribers yet"); return; }
      var subject = "Blue Heron Records — " + (show.description || "Upcoming show") + " (" + when + ")";
      toast("Opening your email — " + emails.length + " BCC'd (hidden)");
      window.location.href = "mailto:joeleduc@blueheronrecords.com?bcc=" + encodeURIComponent(emails.join(",")) + "&subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }).catch(function () { toast("Couldn’t load the mailing list"); });
  }
  $("s-add").addEventListener("click", function () {
    var row = {
      date: $("s-date").value, time: $("s-time").value.trim() || null,
      ticket_url: $("s-ticket").value.trim() || null, phone: $("s-phone").value.trim() || null,
      description: $("s-desc").value.trim() || null,
      location: $("s-loc").value.trim() || null,
      artist_slug: $("s-artist").value || null
    };
    if (!row.date || !row.description) { $("s-status").textContent = "Date and event are required."; return; }
    var editing = editingShowId;
    $("s-status").textContent = editing ? "Saving…" : "Adding…";
    var url = editing ? SB + "/rest/v1/shows?id=eq." + editing : SB + "/rest/v1/shows";
    var method = editing ? "PATCH" : "POST";
    fetch(url, { method: method, headers: H({ "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify(row) })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); return r.json(); })
      .then(function (data) {
        if (editing && (!data || !data.length)) { $("s-status").textContent = "Couldn’t save — the database needs the shows ‘update’ permission (run the one-line SQL)."; return; }
        $("s-status").textContent = editing ? "Saved ✓" : "Added ✓"; $("s-form").classList.add("hidden"); showFormReset(); loadShows();
      })
      .catch(function () { $("s-status").textContent = editing ? "Save failed." : "Add failed."; });
  });
  if ($("s-newBtn")) $("s-newBtn").addEventListener("click", function () {
    showFormReset();
    $("s-form").classList.remove("hidden");
    var i = $("s-form").querySelector("select,input,textarea"); if (i) i.focus();
  });
  if ($("s-cancel")) $("s-cancel").addEventListener("click", function () { $("s-form").classList.add("hidden"); showFormReset(); });

  /* ---------- Artist dropdown (links a show to a profile) ---------- */
  function fillArtistDropdown() {
    var sel = $("s-artist"); if (!sel) return;
    listArtists().then(function (rows) {
      var opts = '<option value="">Choose from the roster…</option>';
      (rows || []).forEach(function (a) { opts += '<option value="' + esc(a.slug || "") + '">' + esc(a.name || "") + "</option>"; });
      sel.innerHTML = opts;
    }).catch(function () {});
  }
  if ($("s-artist")) {
    $("s-artist").addEventListener("change", function () {
      var o = this.options[this.selectedIndex];
      if (this.value && o) $("s-desc").value = o.text;
    });
  }

  /* ---------- Mailing list ---------- */
  var subsRows = [];
  function loadSubs() {
    var box = $("subsList"); if (!box) return;
    box.innerHTML = '<p class="muted">Loading…</p>'; $("subsCount").textContent = "";
    jget("subscribers?select=*&order=created_at.desc").then(function (rows) {
      subsRows = rows || [];
      if (!subsRows.length) { box.innerHTML = '<p class="muted">No subscribers yet.</p>'; return; }
      $("subsCount").textContent = subsRows.length + (subsRows.length === 1 ? " subscriber" : " subscribers");
      box.innerHTML = subsRows.map(function (s) {
        var when = s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
        var title = s.name ? esc(s.name) : esc(s.email || "");
        var sub = [s.name ? esc(s.email || "") : "", s.phone ? esc(s.phone) : "", esc(when)].filter(Boolean).join(" · ");
        return '<div class="artist-row" data-id="' + esc(s.id) + '"><div class="meta"><h3 style="font-size:1rem">' + title + '</h3><p>' + sub + "</p></div><button class=\"btn btn-danger btn-sm sub-del\" type=\"button\">Remove</button></div>";
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".sub-del"), function (b) {
        b.addEventListener("click", function () {
          var id = b.closest("[data-id]").getAttribute("data-id");
          if (!window.confirm("Remove this subscriber?")) return;
          fetch(SB + "/rest/v1/subscribers?id=eq." + id, { method: "DELETE", headers: H({ Prefer: "return=minimal" }) }).then(loadSubs);
        });
      });
    }).catch(function () { box.innerHTML = '<p class="muted">Couldn’t load the list.</p>'; });
  }
  if ($("subsCopy")) {
    $("subsCopy").addEventListener("click", function () {
      var emails = subsRows.map(function (s) { return s.email; }).filter(Boolean).join(", ");
      if (!emails) { toast("No emails yet"); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(emails).then(function () { toast("Copied " + subsRows.length + " emails"); }, function () { toast("Copy failed"); });
      else toast("Copy not supported");
    });
  }
  if ($("subsCopyPhones")) {
    $("subsCopyPhones").addEventListener("click", function () {
      var phones = subsRows.map(function (s) { return s.phone; }).filter(Boolean).join(", ");
      if (!phones) { toast("No phone numbers yet"); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(phones).then(function () { toast("Copied phone numbers"); }, function () { toast("Copy failed"); });
      else toast("Copy not supported");
    });
  }
  function parseContactsCSV(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var cells = line.split(",").map(function (c) { return c.trim().replace(/^"|"$/g, ""); });
      var email = cells.filter(function (c) { return /@/.test(c); })[0];
      if (!email || /^email$/i.test(email)) return;
      var phone = cells.filter(function (c) { return !/@/.test(c) && /\d{3}/.test(c); })[0] || null;
      var name = cells.filter(function (c) { return c && c !== email && c !== phone; })[0] || null;
      out.push({ email: email, name: name, phone: phone });
    });
    return out;
  }
  if ($("subsUploadBtn")) {
    $("subsUploadBtn").addEventListener("click", function () { $("subsFile").click(); });
    $("subsFile").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = parseContactsCSV(String(reader.result || ""));
        var existing = {}; subsRows.forEach(function (s) { if (s.email) existing[s.email.toLowerCase()] = 1; });
        var toAdd = parsed.filter(function (r) { return r.email && !existing[r.email.toLowerCase()]; });
        if (!toAdd.length) { toast("No new contacts found in the file"); $("subsFile").value = ""; return; }
        fetch(SB + "/rest/v1/subscribers", { method: "POST", headers: H({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(toAdd) })
          .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); toast("Added " + toAdd.length + " contact" + (toAdd.length === 1 ? "" : "s")); $("subsFile").value = ""; loadSubs(); })
          .catch(function () { toast("Upload failed — check the file format"); $("subsFile").value = ""; });
      };
      reader.readAsText(f);
    });
  }
})();
