/* =========================================================================
   PALCO — frontend (vanilla JS, sem build step)
   ========================================================================= */

const API = "";

const state = {
  token: localStorage.getItem("palco_token") || null,
  user: JSON.parse(localStorage.getItem("palco_user") || "null"),
  selectedTickets: new Map(), // ticketId -> {seatNumber, price}
  currentEventId: null,
  ws: null,
};

// ------------------------------------------------------------------ utils
function fmtMoney(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "USD" });
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function hueFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}
function artStyle(seed) {
  const h = hueFor(seed || "palco");
  const h2 = (h + 45) % 360;
  return `background: linear-gradient(135deg, hsl(${h} 70% 22%), hsl(${h2} 65% 14%));`;
}

function toast(message, type = "") {
  const host = document.getElementById("toast-host");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || `Erro (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

function setSession(authResponse) {
  state.token = authResponse.access_token;
  state.user = {
    id: authResponse.user_id,
    name: authResponse.name,
    email: authResponse.email,
    role: authResponse.role,
  };
  localStorage.setItem("palco_token", state.token);
  localStorage.setItem("palco_user", JSON.stringify(state.user));
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("palco_token");
  localStorage.removeItem("palco_user");
}

function isOrganizer() {
  return state.user && (state.user.role === "ADMIN" || state.user.role === "ORGANIZER");
}

// ------------------------------------------------------------------ router
const routes = {
  "/": viewHome,
  "/login": viewLogin,
  "/register": viewRegister,
  "/orders": viewOrders,
  "/create-event": viewCreateEvent,
};

function navigate(path) {
  window.location.hash = path;
}

async function router() {
  closeWs();
  const hash = window.location.hash.slice(1) || "/";
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;
  window.scrollTo(0, 0);
  renderNav();

  const eventMatch = hash.match(/^\/event\/([^/]+)$/);
  const checkoutMatch = hash.match(/^\/checkout\/([^/]+)$/);

  try {
    if (eventMatch) {
      await viewEventDetail(eventMatch[1]);
    } else if (checkoutMatch) {
      await viewCheckout(checkoutMatch[1]);
    } else if (routes[hash]) {
      await routes[hash]();
    } else {
      app.innerHTML = `<div class="empty-state"><h3>Página não encontrada</h3><p>O caminho "${escapeHtml(hash)}" não existe.</p></div>`;
    }
  } catch (err) {
    app.innerHTML = `<div class="container section"><div class="alert alert-error">${escapeHtml(err.message)}</div></div>`;
  }
}

window.addEventListener("hashchange", router);

// ------------------------------------------------------------------ nav
function renderNav() {
  const nav = document.getElementById("nav-dynamic");
  const hash = window.location.hash.slice(1) || "/";

  let links = `
    <span class="nav-link ${hash === "/" ? "active" : ""}" data-nav="/">Eventos</span>
  `;
  if (state.user) {
    links += `<span class="nav-link ${hash === "/orders" ? "active" : ""}" data-nav="/orders">Meus Ingressos</span>`;
    if (isOrganizer()) {
      links += `<span class="nav-link ${hash === "/create-event" ? "active" : ""}" data-nav="/create-event">Criar Evento</span>`;
    }
  }

  let userBlock;
  if (state.user) {
    userBlock = `
      <div class="nav-user">
        <div style="text-align:right;">
          <div class="nav-user-name">${escapeHtml(state.user.name)}</div>
        </div>
        <span class="nav-user-role">${state.user.role}</span>
        <button class="btn btn-ghost btn-sm" id="logout-btn">Sair</button>
      </div>`;
  } else {
    userBlock = `
      <div class="nav-user">
        <span class="nav-link" data-nav="/login">Entrar</span>
        <button class="btn btn-primary btn-sm" data-nav="/register">Criar conta</button>
      </div>`;
  }

  nav.innerHTML = `<div class="nav-links">${links}</div>${userBlock}`;

  nav.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.dataset.nav));
  });
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    clearSession();
    toast("Sessão encerrada.");
    renderNav();
    navigate("/");
  });
}

// ------------------------------------------------------------------ HOME
async function viewHome() {
  const app = document.getElementById("app");
  const events = await api("/api/events/upcoming", { auth: false });

  app.innerHTML = `
    <section class="hero container">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">● bilheteria ao vivo</span>
          <h1>Seu próximo <em>grande momento</em><br/>começa com um ingresso.</h1>
          <p class="hero-lede">Reserve assentos em tempo real, acompanhe a disponibilidade ao vivo e receba seu ingresso com QR code na hora — sem filas, sem complicação.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" id="hero-cta">Ver eventos</button>
            ${!state.user ? '<button class="btn btn-ghost" data-nav="/register">Criar conta grátis</button>' : ""}
          </div>
        </div>
        <div class="hero-stub">
          <div class="ticket-stub">
            <div class="stub-main">
              <span class="stub-label">Admissão geral</span>
              <h3 style="margin:10px 0 4px;">Palco ao vivo</h3>
              <p style="margin:0; font-size:13.5px;">Assentos numerados · confirmação instantânea</p>
            </div>
            <div class="stub-tear"></div>
            <div class="stub-foot">
              <span class="stub-code">#PLC-${new Date().getFullYear()}</span>
              <span class="stub-code">✦ ✦ ✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <h2>Em cartaz</h2>
        <div class="search-bar">
          <span>⌕</span>
          <input type="text" id="event-search" placeholder="Buscar por nome ou cidade..." />
        </div>
      </div>
      <div class="event-grid" id="event-grid"></div>
    </section>

    <footer class="site-footer">Palco — plataforma de eventos, 100% em Python (FastAPI).</footer>
  `;

  document.getElementById("hero-cta").addEventListener("click", () => {
    document.getElementById("event-grid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => navigate(el.dataset.nav)));

  const grid = document.getElementById("event-grid");
  function renderGrid(list) {
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Nenhum evento encontrado</h3><p>Tente outro termo de busca.</p></div>`;
      return;
    }
    grid.innerHTML = list.map(eventCardHtml).join("");
    grid.querySelectorAll(".event-card").forEach((card) => {
      card.addEventListener("click", () => navigate(`/event/${card.dataset.id}`));
    });
  }
  renderGrid(events);

  document.getElementById("event-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    renderGrid(events.filter((ev) => ev.title.toLowerCase().includes(q) || ev.location.toLowerCase().includes(q)));
  });
}

function eventCardHtml(ev) {
  const ratio = ev.total_capacity ? ev.available_tickets / ev.total_capacity : 0;
  let availClass = "";
  let availText = `${ev.available_tickets} ingressos disponíveis`;
  if (ev.available_tickets === 0) { availClass = "sold-out"; availText = "Esgotado"; }
  else if (ratio < 0.2) { availClass = "low"; }

  return `
    <article class="event-card" data-id="${ev.id}">
      <div class="event-card-art" style="${artStyle(ev.id)}">
        <span class="event-card-badge">${fmtDate(ev.date)}</span>
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${escapeHtml(ev.title)}</h3>
        <div class="event-card-meta">
          <span>📍 ${escapeHtml(ev.location)}</span>
          <span>🎤 ${escapeHtml(ev.organizer_name)}</span>
        </div>
        <div class="event-card-foot">
          <span class="price-tag">${ev.ticket_price ? fmtMoney(ev.ticket_price) : "—"}</span>
          <span class="avail-tag ${availClass}">${availText}</span>
        </div>
      </div>
    </article>`;
}

// ------------------------------------------------------------------ EVENT DETAIL
async function viewEventDetail(eventId) {
  const app = document.getElementById("app");
  state.currentEventId = eventId;
  state.selectedTickets.clear();

  const [event, tickets] = await Promise.all([
    api(`/api/events/${eventId}`, { auth: false }),
    api(`/api/events/${eventId}/tickets`, { auth: false }),
  ]);

  app.innerHTML = `
    <div class="container" style="padding-top:28px;">
      <div class="event-detail-hero" style="${artStyle(event.id)}">
        <div class="event-detail-hero-content">
          <span class="eyebrow">${escapeHtml(event.location)}</span>
          <h1>${escapeHtml(event.title)}</h1>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="info-row">🗓 <strong>${fmtDateTime(event.date)}</strong></div>
          <div class="info-row">📍 ${escapeHtml(event.location)}</div>
          <div class="info-row">🎤 Organizado por <strong>${escapeHtml(event.organizer_name)}</strong></div>
          <p style="margin-top:18px; max-width:60ch;">${escapeHtml(event.description || "Sem descrição.")}</p>

          <div class="card" style="margin-top:26px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <h3 style="margin:0;">Escolha seus assentos</h3>
              <span class="live-badge"><span class="live-dot"></span>ao vivo</span>
            </div>
            <p style="margin:0 0 6px; font-size:13px;">
              <span id="avail-count">${tickets.length}</span> assentos disponíveis de ${event.total_capacity}. Selecione um ou mais abaixo.
            </p>
            <div class="seat-grid" id="seat-grid"></div>
          </div>
        </div>

        <div class="card" style="position:sticky; top:90px;">
          <h3 style="margin-top:0;">Seu pedido</h3>
          <div id="cart-rows"><p style="font-size:13.5px;">Nenhum assento selecionado ainda.</p></div>
          <div class="checkout-total">
            <span>Total</span>
            <span class="amount" id="cart-total">${fmtMoney(0)}</span>
          </div>
          <button class="btn btn-primary btn-block" style="margin-top:18px;" id="reserve-btn" disabled>
            ${state.user ? "Reservar e continuar" : "Entre para reservar"}
          </button>
          <p style="font-size:12px; margin-top:10px; text-align:center;">Assentos reservados ficam garantidos por 10 minutos.</p>
        </div>
      </div>
    </div>
  `;

  renderSeatGrid(tickets);
  connectWs(eventId);

  document.getElementById("reserve-btn").addEventListener("click", async () => {
    if (!state.user) { navigate("/login"); return; }
    await reserveSelectedAndGoToCheckout();
  });
}

function renderSeatGrid(tickets) {
  const grid = document.getElementById("seat-grid");
  if (!tickets.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1; padding:30px;"><h3>Esgotado</h3><p>Não há mais assentos disponíveis para este evento.</p></div>`;
    return;
  }
  grid.innerHTML = tickets.map((t) => {
    const selected = state.selectedTickets.has(t.id);
    return `<div class="seat ${selected ? "selected" : ""}" data-id="${t.id}" data-seat="${escapeHtml(t.seat_number)}" data-price="${t.price}">${escapeHtml(t.seat_number.replace("SEAT-", "#"))}</div>`;
  }).join("");

  grid.querySelectorAll(".seat").forEach((seatEl) => {
    seatEl.addEventListener("click", () => {
      const id = seatEl.dataset.id;
      if (state.selectedTickets.has(id)) {
        state.selectedTickets.delete(id);
        seatEl.classList.remove("selected");
      } else {
        state.selectedTickets.set(id, { seatNumber: seatEl.dataset.seat, price: parseFloat(seatEl.dataset.price) });
        seatEl.classList.add("selected");
      }
      renderCart();
    });
  });
}

function renderCart() {
  const rows = document.getElementById("cart-rows");
  const totalEl = document.getElementById("cart-total");
  const btn = document.getElementById("reserve-btn");
  if (!rows) return;

  if (state.selectedTickets.size === 0) {
    rows.innerHTML = `<p style="font-size:13.5px;">Nenhum assento selecionado ainda.</p>`;
    totalEl.textContent = fmtMoney(0);
    btn.disabled = true;
    return;
  }

  let total = 0;
  rows.innerHTML = [...state.selectedTickets.entries()].map(([id, t]) => {
    total += t.price;
    return `<div class="checkout-summary-row"><span>Assento ${escapeHtml(t.seatNumber.replace("SEAT-", "#"))}</span><span>${fmtMoney(t.price)}</span></div>`;
  }).join("");
  totalEl.textContent = fmtMoney(total);
  btn.disabled = false;
}

function connectWs(eventId) {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/events/${eventId}/tickets`);
  state.ws = ws;
  ws.onmessage = (msg) => {
    try {
      const update = JSON.parse(msg.data);
      const availCount = document.getElementById("avail-count");
      if (availCount) availCount.textContent = update.available_count;
      const seatEl = document.querySelector(`.seat[data-id="${update.ticket_id}"]`);
      if (seatEl && update.status !== "AVAILABLE" && !state.selectedTickets.has(update.ticket_id)) {
        seatEl.classList.add("unavailable");
        seatEl.style.pointerEvents = "none";
      }
      if (seatEl && update.status === "AVAILABLE") {
        seatEl.classList.remove("unavailable");
        seatEl.style.pointerEvents = "";
      }
    } catch { /* ignore malformed frames */ }
  };
}

function closeWs() {
  if (state.ws) {
    try { state.ws.close(); } catch { /* noop */ }
    state.ws = null;
  }
}

async function reserveSelectedAndGoToCheckout() {
  const btn = document.getElementById("reserve-btn");
  btn.disabled = true;
  btn.textContent = "Reservando...";
  const heldIds = [];
  try {
    for (const ticketId of state.selectedTickets.keys()) {
      await api("/api/tickets/hold", { method: "POST", body: { ticket_id: ticketId } });
      heldIds.push(ticketId);
    }
    const order = await api("/api/orders", { method: "POST", body: { ticket_ids: heldIds } });
    toast("Assentos reservados! Finalize o pagamento.", "success");
    navigate(`/checkout/${order.order_id}`);
  } catch (err) {
    toast(err.message, "error");
    for (const ticketId of heldIds) {
      try { await api(`/api/tickets/${ticketId}/release`, { method: "POST" }); } catch { /* best-effort */ }
    }
    btn.disabled = false;
    btn.textContent = "Reservar e continuar";
  }
}

// ------------------------------------------------------------------ CHECKOUT
async function viewCheckout(orderId) {
  const app = document.getElementById("app");
  if (!state.user) { navigate("/login"); return; }

  const order = await api(`/api/orders/${orderId}`);

  const isPaid = order.status === "PAID";
  app.innerHTML = `
    <div class="container form-page wide">
      <span class="eyebrow">pedido #${order.order_id.slice(0, 8)}</span>
      <h2 style="margin-top:10px;">${isPaid ? "Pagamento confirmado" : "Finalizar pagamento"}</h2>

      <div class="card">
        <div class="checkout-summary-row"><span>Evento</span><span>${escapeHtml(order.event_title || "")}</span></div>
        <div class="checkout-summary-row"><span>Assentos</span><span>${(order.seats || []).map((s) => s.replace("SEAT-", "#")).join(", ")}</span></div>
        <div class="checkout-summary-row"><span>Status</span><span class="order-status ${order.status}">${order.status}</span></div>
        <div class="checkout-total"><span>Total</span><span class="amount">${fmtMoney(order.total_amount)}</span></div>
      </div>

      ${isPaid ? `
        <div class="alert alert-success" style="margin-top:20px;">Seu pagamento foi confirmado. Os ingressos com QR code já estão em "Meus Ingressos".</div>
        <button class="btn btn-primary btn-block" data-nav="/orders">Ver meus ingressos</button>
      ` : `
        <div class="card" style="margin-top:18px;">
          <p style="font-size:13px;">
            ${order.demo_mode
              ? "Modo demonstração: nenhuma cobrança real será feita. Clique abaixo para simular a confirmação do pagamento."
              : "Pagamento processado via Stripe."}
          </p>
          <button class="btn btn-primary btn-block" id="pay-btn">Confirmar pagamento · ${fmtMoney(order.total_amount)}</button>
        </div>
      `}
    </div>
  `;

  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => navigate(el.dataset.nav)));

  const payBtn = document.getElementById("pay-btn");
  if (payBtn) {
    payBtn.addEventListener("click", async () => {
      payBtn.disabled = true;
      payBtn.textContent = "Processando...";
      try {
        await api(`/api/orders/${orderId}/confirm`, { method: "POST" });
        toast("Pagamento confirmado!", "success");
        navigate("/orders");
      } catch (err) {
        toast(err.message, "error");
        payBtn.disabled = false;
        payBtn.textContent = `Confirmar pagamento · ${fmtMoney(order.total_amount)}`;
      }
    });
  }
}

// ------------------------------------------------------------------ ORDERS
async function viewOrders() {
  const app = document.getElementById("app");
  if (!state.user) { navigate("/login"); return; }

  const orders = await api("/api/orders/me");

  if (!orders.length) {
    app.innerHTML = `
      <div class="container section">
        <div class="empty-state">
          <h3>Você ainda não tem ingressos</h3>
          <p>Explore os eventos em cartaz e garanta seu lugar.</p>
          <button class="btn btn-primary" data-nav="/">Ver eventos</button>
        </div>
      </div>`;
    document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => navigate(el.dataset.nav)));
    return;
  }

  app.innerHTML = `
    <div class="container section">
      <div class="section-head"><h2>Meus ingressos</h2></div>
      <div class="orders-list">
        ${orders.map(orderStubHtml).join("")}
      </div>
    </div>`;

  document.querySelectorAll("[data-checkout]").forEach((el) => {
    el.addEventListener("click", () => navigate(`/checkout/${el.dataset.checkout}`));
  });
}

function orderStubHtml(order) {
  const firstQr = order.items.find((i) => i.qr_code_base64)?.qr_code_base64;
  return `
    <div class="order-stub">
      <div class="order-stub-info">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <span class="order-status ${order.status}">${order.status}</span>
          <span class="stub-code">#${order.order_id.slice(0, 8)}</span>
        </div>
        <h3 style="margin:0 0 4px;">${escapeHtml(order.event_title || "Evento")}</h3>
        ${order.items[0]?.event_date ? `<div class="info-row" style="margin-bottom:6px;">🗓 ${fmtDateTime(order.items[0].event_date)}</div>` : ""}
        ${order.items[0]?.event_location ? `<div class="info-row" style="margin-bottom:10px;">📍 ${escapeHtml(order.items[0].event_location)}</div>` : ""}
        <div>${order.seats.map((s) => `<span class="seat-chip">${escapeHtml(s.replace("SEAT-", "#"))}</span>`).join("")}</div>
        <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
          <span class="price-tag">${fmtMoney(order.total_amount)}</span>
          ${order.status === "PENDING" ? `<button class="btn btn-primary btn-sm" data-checkout="${order.order_id}">Finalizar pagamento</button>` : ""}
        </div>
      </div>
      <div class="order-stub-qr">
        ${firstQr
          ? `<img src="data:image/png;base64,${firstQr}" alt="QR code do ingresso" /><span class="stub-label">apresente na entrada</span>`
          : `<span class="stub-label">QR disponível<br/>após pagamento</span>`}
      </div>
    </div>`;
}

// ------------------------------------------------------------------ AUTH
async function viewLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="container form-page">
      <span class="eyebrow">bem-vindo de volta</span>
      <h2 style="margin-top:10px;">Entrar</h2>
      <div id="form-alert"></div>
      <form id="login-form">
        <div class="field"><label>E-mail</label><input type="email" name="email" required autocomplete="email" /></div>
        <div class="field"><label>Senha</label><input type="password" name="password" required autocomplete="current-password" /></div>
        <button class="btn btn-primary btn-block" type="submit">Entrar</button>
      </form>
      <p class="form-foot">Não tem conta? <a data-nav="/register">Criar conta</a></p>
      <p class="form-foot" style="font-size:12px;">Demo: organizador@eventos.com / organiza123</p>
    </div>`;

  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => navigate(el.dataset.nav)));

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api("/api/auth/login", { method: "POST", auth: false, body: { email: fd.get("email"), password: fd.get("password") } });
      setSession(res);
      toast(`Bem-vindo(a), ${res.name}!`, "success");
      renderNav();
      navigate("/");
    } catch (err) {
      document.getElementById("form-alert").innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

async function viewRegister() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="container form-page">
      <span class="eyebrow">novo por aqui</span>
      <h2 style="margin-top:10px;">Criar conta</h2>
      <div id="form-alert"></div>
      <form id="register-form">
        <div class="field"><label>Nome</label><input type="text" name="name" required minlength="2" /></div>
        <div class="field"><label>E-mail</label><input type="email" name="email" required /></div>
        <div class="field"><label>Senha</label><input type="password" name="password" required minlength="6" /></div>
        <button class="btn btn-primary btn-block" type="submit">Criar conta</button>
      </form>
      <p class="form-foot">Já tem conta? <a data-nav="/login">Entrar</a></p>
    </div>`;

  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => navigate(el.dataset.nav)));

  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api("/api/auth/register", {
        method: "POST", auth: false,
        body: { name: fd.get("name"), email: fd.get("email"), password: fd.get("password") },
      });
      setSession(res);
      toast(`Conta criada! Bem-vindo(a), ${res.name}.`, "success");
      renderNav();
      navigate("/");
    } catch (err) {
      document.getElementById("form-alert").innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

// ------------------------------------------------------------------ CREATE EVENT
async function viewCreateEvent() {
  const app = document.getElementById("app");
  if (!isOrganizer()) {
    app.innerHTML = `<div class="container section"><div class="alert alert-error">Apenas organizadores podem criar eventos.</div></div>`;
    return;
  }

  app.innerHTML = `
    <div class="container form-page wide">
      <span class="eyebrow">novo evento</span>
      <h2 style="margin-top:10px;">Criar evento</h2>
      <div id="form-alert"></div>
      <form id="event-form">
        <div class="field"><label>Título</label><input type="text" name="title" required minlength="2" /></div>
        <div class="field"><label>Descrição</label><textarea name="description"></textarea></div>
        <div class="field-row">
          <div class="field"><label>Data e hora</label><input type="datetime-local" name="date" required /></div>
          <div class="field"><label>Local</label><input type="text" name="location" required /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Capacidade total</label><input type="number" name="total_capacity" min="1" max="100000" required /></div>
          <div class="field"><label>Preço do ingresso (USD)</label><input type="number" name="ticket_price" min="0.01" step="0.01" required /></div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Publicar evento</button>
      </form>
    </div>`;

  document.getElementById("event-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const isoDate = new Date(fd.get("date")).toISOString();
      const res = await api("/api/events", {
        method: "POST",
        body: {
          title: fd.get("title"),
          description: fd.get("description") || null,
          date: isoDate,
          location: fd.get("location"),
          total_capacity: parseInt(fd.get("total_capacity"), 10),
          ticket_price: parseFloat(fd.get("ticket_price")),
        },
      });
      toast("Evento publicado com sucesso!", "success");
      navigate(`/event/${res.id}`);
    } catch (err) {
      document.getElementById("form-alert").innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

// ------------------------------------------------------------------ boot
document.getElementById("brand-home").addEventListener("click", () => navigate("/"));
router();
