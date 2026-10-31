/* js/auth.js - Quản lý cấu hình Google Gemini API & Tiến trình học tập */

let ME = null;          // { email, state, ai, server: true|false }
let BACKEND = false;    // máy chủ Flask có kết nối được hay không
let SERVER_AI = { available: false, limit: 30 };

const currentAccountId = () => (ME && ME.email) ? ME.email : (localStorage.getItem("apt_user_email") || "hoc-sinh@adapt.edu");

function saveLocalState() {
  const email = currentAccountId();
  const state = {
    level: S.level, done: S.done, p: S.mastery, history: S.history || [],
    settings: { llm: $("#llm") ? $("#llm").checked : true, dkt: $("#dkt") ? $("#dkt").checked : true }
  };
  try { localStorage.setItem("apt_state_" + email, JSON.stringify(state)); } catch (e) { }
}

function applyLocalUser(email) {
  const cleanEmail = (email || "hoc-sinh@adapt.edu").trim().toLowerCase();
  localStorage.setItem("apt_user_email", cleanEmail);
  let state = {
    level: 1, done: 0,
    p: { Algebra: 0.85, Geometry: 0.62, Calculus: 0.40, Arithmetic: 0.95, Mechanics: 0.85, Thermodynamics: 0.65, Electromagnetism: 0.50, Optics: 0.70 },
    history: [], settings: { llm: true, dkt: true }
  };
  try {
    const raw = localStorage.getItem("apt_state_" + cleanEmail);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (e) { }

  ME = { email: cleanEmail, state, server: false, ai: {} };

  const meBtn = $("#me");
  if (meBtn) {
    meBtn.style.display = "inline-flex";
    meBtn.innerHTML = '<span class="ms" style="font-size:18px">vpn_key</span>';
  }
  S.level = state.level || 1;
  S.done = state.done || 0;
  Object.assign(S.mastery, state.p || {});
  S.history = state.history || [];
}

function updateAiStatus(ai) {
  if (ai) SERVER_AI = ai;
  ai = SERVER_AI || {};
  const st = $("#aist");
  if (!st) return;

  const clientKey = typeof getClientGeminiKey === "function" ? getClientGeminiKey() : "";
  const acct = Boolean(BACKEND && ai.has_account_key);
  const serverOk = Boolean(BACKEND && ai.server_available);
  const isReady = Boolean(clientKey) || acct || serverOk;
  const model = acct ? `${ai.model || "Gemini"} (Khóa của tài khoản)` : (clientKey ? "gemini-3.5-flash-lite (Khóa cá nhân)" : (ai.model || "gemini-3.5-flash-lite"));
  const who = (ME && ME.server) ? ` · ${esc(ME.email)}` : "";

  const meBtn = $("#me");
  if (isReady) {
    st.innerHTML = `<span style="color:var(--sec);font-size:16px">●</span> <b>Gia sư AI sẵn sàng:</b> <span class="chip g" style="font-size:12px;padding:2px 8px">Google Gemini · ${esc(model)}</span>${who}.`;
    st.style.background = "var(--secc)";
    st.style.color = "var(--sec)";
    if (meBtn) {
      meBtn.title = (ME && ME.server) ? `Tài khoản ${ME.email} (Nhấn để quản lý)` : "AI đã sẵn sàng (Nhấn để cấu hình / đăng nhập)";
      meBtn.style.border = "2px solid var(--sec)";
    }
  } else {
    const hint = (ME && ME.server)
      ? "Bấm vào nút chìa khóa để lưu API key AI vào tài khoản của bạn"
      : (BACKEND ? "Đăng nhập email rồi lưu API key vào tài khoản, hoặc dán key cá nhân" : "Bấm vào nút chìa khóa để nhập Gemini API Key");
    st.innerHTML = `<span style="color:var(--err)">●</span> <b>Chưa có AI:</b> ${hint} <span class="ms" style="font-size:15px;vertical-align:middle">vpn_key</span> ở góc trên bên phải (36 dạng chuẩn Toán, Lý, Hóa vẫn giải ngoại tuyến 100%).`;
    st.style.background = "var(--errc)";
    st.style.color = "var(--err)";
    if (meBtn) {
      meBtn.title = "Chưa có AI (Nhấn để cấu hình)";
      meBtn.style.border = "none";
    }
  }
}

/* ---------- Tài khoản (đăng nhập email) ---------- */
function showLoginMsg(msg, ok) {
  const m = $("#loginMsg");
  if (!m) return;
  m.style.display = msg ? "block" : "none";
  m.textContent = msg || "";
  m.style.background = ok ? "var(--secc)" : "var(--errc)";
  m.style.color = ok ? "var(--sec)" : "var(--err)";
}

function renderLoginState() {
  const box = $("#loginBox");
  if (!box) return;
  box.style.display = (BACKEND && !STATIC_HOST) ? "grid" : "none";
  const logged = Boolean(ME && ME.server);
  $("#loginOut").style.display = logged ? "flex" : "none";
  $("#loginIn").style.display = logged ? "none" : "grid";
  if (logged) $("#loginEmailShow").textContent = ME.email;
}

function applyServerState(r) {
  const st = r.state || {};
  ME = { email: r.email, state: st, server: true, ai: r.ai || {} };
  S.level = st.level || 1;
  S.done = st.done || 0;
  Object.assign(S.mastery, st.p || {});
  S.history = st.history || [];
  const s = st.settings || {};
  if ($("#llm") && "llm" in s) $("#llm").checked = Boolean(s.llm);
  if ($("#dkt") && "dkt" in s) $("#dkt").checked = Boolean(s.dkt);
  SERVER_AI = r.ai || SERVER_AI;
}

/* Khôi phục phiên đăng nhập từ token đã lưu; token hết hạn/bị thu hồi thì xóa */
async function refreshAccount() {
  if (!TOKEN) return false;
  const r = await apiCall("/api/me");
  if (r && r.email) { applyServerState(r); return true; }
  if (LAST_STATUS === 401) setToken(null);
  return false;
}

async function refreshAi() {
  const ai = await apiCall("/api/ai");
  if (ai) SERVER_AI = ai;
  updateAiStatus();
}

function openAuthModal() {
  const modal = $("#auth");
  if (!modal) return;
  const inp = $("#clientKeyInp");
  const curKey = typeof getClientGeminiKey === "function" ? getClientGeminiKey() : "";
  const acct = Boolean(ME && ME.server && SERVER_AI && SERVER_AI.has_account_key);
  if (inp) {
    inp.value = curKey;
    inp.placeholder = acct ? "Đã lưu key trong tài khoản (dán key mới để thay)" : "Dán Gemini API Key (AQ... hoặc AIza...)";
  }
  const clearBtn = $("#clearClientKey");
  if (clearBtn) {
    clearBtn.style.display = (curKey || acct) ? "inline-flex" : "none";
  }
  const amsg = $("#amsg");
  if (amsg) {
    amsg.style.display = "none";
    amsg.textContent = "";
  }
  showLoginMsg("");
  renderLoginState();
  modal.classList.add("on");
  if (inp) setTimeout(() => inp.focus(), 80);
}

function closeAuthModal() {
  const modal = $("#auth");
  if (modal) modal.classList.remove("on");
}

function showKeyMsg(msg, ok) {
  const m = $("#amsg");
  if (!m) return;
  m.style.display = msg ? "block" : "none";
  m.textContent = msg || "";
  m.style.background = ok ? "var(--secc)" : "var(--errc)";
  m.style.color = ok ? "var(--sec)" : "var(--err)";
}

async function boot() {
  // 1. Khôi phục môn học đã chọn
  const savedSubject = localStorage.getItem("apt_subject") || "math";
  if (typeof setSubject === "function") {
    setSubject(savedSubject, false);
  }

  // 2. Khôi phục tiến trình học tập cục bộ
  const savedEmail = localStorage.getItem("apt_user_email") || "hoc-sinh@adapt.edu";
  applyLocalUser(savedEmail);

  // 3. Kiểm tra kết nối backend
  try {
    const h = await apiCall("/api/health", { timeout: 3000 });
    BACKEND = Boolean(h);
  } catch (e) {
    BACKEND = false;
  }

  // 4. Có máy chủ: khôi phục phiên đăng nhập và lấy trạng thái AI THẬT từ máy chủ (key tài khoản / key hệ thống)
  if (BACKEND) {
    await refreshAccount();
    await refreshAi();
  } else {
    updateAiStatus({});
  }
  renderLoginState();

  // 5. Chỉ tự mở hộp thoại khi CHƯA có AI nào dùng được
  const clientKey = typeof getClientGeminiKey === "function" ? getClientGeminiKey() : "";
  const ready = Boolean(clientKey) || Boolean(BACKEND && SERVER_AI && (SERVER_AI.has_account_key || SERVER_AI.server_available));
  if (!ready && !sessionStorage.getItem("apt_skip_key_prompt")) {
    openAuthModal();
  }
}

// Bấm vào nút icon chìa khóa góc trên bên phải
const meBtn = $("#me");
if (meBtn) {
  meBtn.onclick = () => openAuthModal();
}

// Đóng hộp thoại
const authClose = $("#authClose");
if (authClose) {
  authClose.onclick = () => {
    closeAuthModal();
    sessionStorage.setItem("apt_skip_key_prompt", "1");
  };
}

// Click ra ngoài backdrop
const authModal = $("#auth");
if (authModal) {
  authModal.addEventListener("click", e => {
    if (e.target === authModal) {
      closeAuthModal();
      sessionStorage.setItem("apt_skip_key_prompt", "1");
    }
  });
}

// Nút dùng ngoại tuyến (bỏ qua nhập key)
const guestBtn = $("#guest");
if (guestBtn) {
  guestBtn.onclick = () => {
    closeAuthModal();
    sessionStorage.setItem("apt_skip_key_prompt", "1");
    toast("Đang dùng chế độ ngoại tuyến (36 dạng Toán, Lý, Hóa tiêu chuẩn)");
  };
}

// Nút lưu API Key: đã đăng nhập -> lưu vào TÀI KHOẢN (mã hóa trên máy chủ); chưa đăng nhập -> lưu trong trình duyệt
const saveClientKey = $("#saveClientKey");
if (saveClientKey) {
  saveClientKey.onclick = async () => {
    const inp = $("#clientKeyInp");
    const k = (inp ? inp.value : "").trim();
    const logged = Boolean(BACKEND && ME && ME.server);
    if (logged && k) {
      saveClientKey.disabled = true;
      showKeyMsg("Đang kiểm tra key...", true);
      const r = await sendJson("PUT", "/api/ai", { provider: "gemini", key: k }, 30000);
      saveClientKey.disabled = false;
      if (!r || !r.ok) { showKeyMsg((r && r.error) || "Không lưu được key", false); return; }
      setClientGeminiKey("");   // key đã nằm ở tài khoản, không giữ thêm bản trong trình duyệt
      SERVER_AI = r.ai; updateAiStatus();
      closeAuthModal();
      sessionStorage.setItem("apt_skip_key_prompt", "1");
      toast(r.warning ? "✓ Đã lưu key vào tài khoản (chưa kiểm tra được: " + r.warning + ")" : "✓ Đã lưu key vào tài khoản. Lần sau đăng nhập sẽ tự dùng AI của bạn!");
      return;
    }
    if (typeof setClientGeminiKey === "function") {
      setClientGeminiKey(k);
      closeAuthModal();
      sessionStorage.setItem("apt_skip_key_prompt", "1");
      toast(k ? "✓ Đã kích hoạt Google Gemini API Key trong trình duyệt này" : "Đã xóa API Key");
      if (k && (window.__retryRaw || window.__retryImg)) {
        const raw = window.__retryRaw;
        const img = window.__retryImg;
        window.__retryRaw = null;
        window.__retryImg = null;
        render(raw, img);
      }   // tự giải lại đề hoặc ảnh vừa bị lỗi
    }
  };
}

// Nút xóa API Key (cả bản trong trình duyệt và bản lưu trong tài khoản)
const clearClientKey = $("#clearClientKey");
if (clearClientKey) {
  clearClientKey.onclick = async () => {
    if (typeof setClientGeminiKey === "function") setClientGeminiKey("");
    const inp = $("#clientKeyInp");
    if (inp) inp.value = "";
    if (BACKEND && ME && ME.server && SERVER_AI && SERVER_AI.has_account_key) {
      const r = await sendJson("DELETE", "/api/ai");
      if (r && r.ok) SERVER_AI = r.ai;
    }
    clearClientKey.style.display = "none";
    toast("Đã xóa API Key");
    updateAiStatus();
  };
}

// Đăng nhập email: gửi mã -> nhập mã -> nhận token
const sendCodeBtn = $("#sendCode");
if (sendCodeBtn) {
  sendCodeBtn.onclick = async () => {
    const email = ($("#loginEmail").value || "").trim().toLowerCase();
    if (!email) { showLoginMsg("Hãy nhập email", false); return; }
    sendCodeBtn.disabled = true;
    const r = await authPost("/api/auth/request", { email });
    sendCodeBtn.disabled = false;
    if (!r || !r.ok) { showLoginMsg((r && r.error) || "Không gửi được mã", false); return; }
    $("#codeRow").style.display = "flex";
    if (r.dev_code) $("#loginCode").value = r.dev_code;   // chỉ có khi chạy thử trên máy (MAIL_DEV=1)
    showLoginMsg(r.dev_code ? "Chế độ thử nghiệm: mã đã điền sẵn, bấm Xác nhận." : "Đã gửi mã 6 số tới email của bạn (có hiệu lực 10 phút).", true);
    setTimeout(() => $("#loginCode") && $("#loginCode").focus(), 50);
  };
}
const verifyCodeBtn = $("#verifyCode");
if (verifyCodeBtn) {
  verifyCodeBtn.onclick = async () => {
    const email = ($("#loginEmail").value || "").trim().toLowerCase();
    const code = ($("#loginCode").value || "").trim();
    if (!code) { showLoginMsg("Hãy nhập mã 6 số", false); return; }
    verifyCodeBtn.disabled = true;
    const r = await authPost("/api/auth/verify", { email, code });
    verifyCodeBtn.disabled = false;
    if (!r || !r.ok || !r.token) { showLoginMsg((r && r.error) || "Mã sai hoặc đã hết hạn", false); return; }
    setToken(r.token);
    applyServerState(r);
    $("#codeRow").style.display = "none";
    $("#loginCode").value = "";
    showLoginMsg("");
    renderLoginState();
    updateAiStatus();
    if (SERVER_AI && (SERVER_AI.has_account_key || SERVER_AI.server_available)) {
      closeAuthModal();
      toast(SERVER_AI.has_account_key ? "✓ Đã đăng nhập, tự động dùng AI của tài khoản bạn" : "✓ Đã đăng nhập");
    } else {
      toast("✓ Đã đăng nhập. Hãy dán API key để lưu vào tài khoản");
      openAuthModal();
    }
  };
}
const logoutBtn = $("#logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await authPost("/api/auth/logout", {});
    setToken(null);
    applyLocalUser(localStorage.getItem("apt_user_email") || "hoc-sinh@adapt.edu");
    await refreshAi();
    renderLoginState();
    toast("Đã đăng xuất");
  };
}

// Nút hiện/ẩn mật khẩu API Key
const toggleKeyBtn = $("#toggleKeyVisibility");
if (toggleKeyBtn) {
  toggleKeyBtn.onclick = () => {
    const inp = $("#clientKeyInp");
    const icon = $("#toggleKeyIcon");
    if (!inp || !icon) return;
    if (inp.type === "password") {
      inp.type = "text";
      icon.textContent = "visibility_off";
    } else {
      inp.type = "password";
      icon.textContent = "visibility";
    }
  };
}

// Nhấn Enter trong ô nhập API Key
const clientKeyInp = $("#clientKeyInp");
if (clientKeyInp) {
  clientKeyInp.onkeydown = e => {
    if (e.key === "Enter") {
      $("#saveClientKey")?.click();
    }
  };
}

// Enter trong ô email / mã đăng nhập
const loginEmailInp = $("#loginEmail");
if (loginEmailInp) loginEmailInp.onkeydown = e => { if (e.key === "Enter") $("#sendCode")?.click(); };
const loginCodeInp = $("#loginCode");
if (loginCodeInp) loginCodeInp.onkeydown = e => { if (e.key === "Enter") $("#verifyCode")?.click(); };
