/* Gọi Python backend (kèm token tài khoản). Trả null khi không có server để dùng bản JS dự phòng */
let TOKEN = null;
try { TOKEN = localStorage.getItem("amt"); } catch (e) { }
function setToken(t) { TOKEN = t; try { t ? localStorage.setItem("amt", t) : localStorage.removeItem("amt"); } catch (e) { } }
let LAST_STATUS = 0;  // mã HTTP của lần gọi gần nhất (0 = lỗi mạng) - để phân biệt 401 với server tắt
// Có thể đặt trước khi nạp api.js:  <script>window.API_BASE="https://api.ten-mien.com"</script>
const API_BASE = (typeof window !== "undefined" && typeof window.API_BASE === "string") ? window.API_BASE : (typeof location !== "undefined" && location.protocol && location.protocol.startsWith("http") && (location.port === "5000" || !location.port))
  ? ""
  : "http://localhost:5000";

async function rawCall(path, opt = {}) {
  const { timeout = 25000, ...rest } = opt;   // luôn có hạn chót: máy chủ treo thì báo lỗi thay vì quay mãi
  const headers = { ...(rest.headers || {}) };
  if (TOKEN) headers.Authorization = "Bearer " + TOKEN;
  const url = path.startsWith("http") ? path : (API_BASE + path);
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { ...rest, headers, signal: ctl.signal });
    LAST_STATUS = r.status;
    return r;
  } finally { clearTimeout(tm); }
}
// github.io là hosting tĩnh: nếu chưa cấu hình API_BASE thì chắc chắn không có máy chủ -> bỏ qua mọi lời gọi /api
const STATIC_HOST = typeof location !== "undefined" && /\.github\.io$/i.test(location.hostname) && !API_BASE;
async function apiCall(path, opt) {
  LAST_STATUS = 0;
  if (STATIC_HOST && !path.startsWith("http")) return null;
  try {
    const r = await rawCall(path, opt);
    return r.ok ? await r.json() : null;
  } catch (e) {
    return null;
  }
}
const apiPost = (path, body, timeout) => apiCall(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), ...(timeout ? { timeout } : {}) });
async function sendJson(method, path, body, timeout) {  // trả cả lỗi để hiện thông báo
  LAST_STATUS = 0;
  if (STATIC_HOST) return { ok: false, error: "Bản web tĩnh (GitHub Pages) không có máy chủ" };
  try { const r = await rawCall(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, ...(timeout ? { timeout } : {}) }); return await r.json(); }
  catch (e) { return { ok: false, error: e && e.name === "AbortError" ? "Máy chủ phản hồi quá chậm, hãy thử lại" : "Không kết nối được máy chủ" }; }
}
const authPost = (path, body) => sendJson("POST", path, body);

/* Hỗ trợ gọi trực tiếp Google Gemini từ trình duyệt khi chạy bản tĩnh trên GitHub Pages */
function getClientGeminiKey() {
  try { return (localStorage.getItem("apt_client_gemini_key") || "").trim(); } catch (e) { return ""; }
}
function setClientGeminiKey(k) {
  try {
    k ? localStorage.setItem("apt_client_gemini_key", k.trim()) : localStorage.removeItem("apt_client_gemini_key");
  } catch (e) { }
}

/* Sửa các dấu \ của LaTeX (\frac, \text, \alpha...) trong chuỗi JSON do AI trả về để JSON.parse không lỗi / không biến \t, \f thành ký tự điều khiển */
const _AMBIG_LATEX = "frac|dfrac|tfrac|forall|times|tan|theta|text|tau|to|triangle|top|therefore|tilde|neq|ne|nabla|not|notin|neg|nu|beta|bar|begin|bot|bigcup|bigcap|binom|bullet|right|rightarrow|rho|rm|cdot|omega|alpha|lambda|mu|approx";
const _BAD_ESC = new RegExp(String.raw`\\\\|\\(?=(?:${_AMBIG_LATEX})(?![A-Za-z]))|\\(?!["\\/bfnrtu])|\\u(?![0-9a-fA-F]{4})`, "g");
function fixJsonLatex(raw) { return raw.replace(_BAD_ESC, m => (m === "\\\\" ? m : "\\\\" + m.slice(1))); }

/* Lấy JSON lời giải từ văn bản AI trả về (chịu được ```json, lời dẫn thừa, LaTeX chưa escape) */
function parseAiSolution(txt) {
  const m = String(txt || "").replace(/```json\s*/gi, "").replace(/```/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Gemini không trả về JSON hợp lệ");
  const d = JSON.parse(fixJsonLatex(m[0]));
  if (!d || !Array.isArray(d.steps) || !d.steps.length) throw new Error("Gemini trả về lời giải rỗng");
  return d;
}

async function callClientGemini(sysPrompt, userPrompt, opts = {}) {
  const key = getClientGeminiKey();
  if (!key) return null;
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];
  const userParts = [];
  if (opts.image && opts.image.data) {
    userParts.push({
      inlineData: {
        mimeType: opts.image.mimeType || "image/jpeg",
        data: opts.image.data
      }
    });
  }
  userParts.push({ text: userPrompt });

  let lastErr = null;
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
      const generationConfig = { temperature: 0.2 };
      if (opts.json) generationConfig.responseMimeType = "application/json";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sysPrompt }] },
          contents: [{ role: "user", parts: userParts }],
          generationConfig
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        const txt = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
        if (txt) return txt;
        lastErr = new Error(`Gemini (${m}) trả về rỗng hoặc bị chặn nội dung`);
        continue;
      }
      const msg = (data.error && data.error.message) || `HTTP ${res.status}`;
      lastErr = new Error(`Gemini (${m}): ${msg}`);
      // Chỉ dừng ngay nếu lỗi rõ ràng do API key không hợp lệ hoặc bị cấm
      if (res.status === 401 || res.status === 403 || (res.status === 400 && /API_KEY|API key|key not valid|invalid api key/i.test(msg))) {
        break;
      }
    } catch (e) {
      lastErr = new Error(`Không gọi được Gemini: ${e && e.message ? e.message : e}`);
    }
  }

  // Nếu tất cả model mặc định đều không khả dụng, thử dò danh sách model khả dụng của key
  if (lastErr && !(lastErr.message && /API_KEY|API key|key not valid|HTTP 401|HTTP 403/i.test(lastErr.message))) {
    try {
      const listRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
        headers: { "x-goog-api-key": key }
      });
      if (listRes.ok) {
        const listData = await listRes.json().catch(() => ({}));
        const available = (listData.models || [])
          .filter(mod => Array.isArray(mod.supportedGenerationMethods) && mod.supportedGenerationMethods.includes("generateContent"))
          .map(mod => (mod.name || "").replace(/^models\//, ""))
          .filter(name => /gemini-.*flash/i.test(name) && !models.includes(name));

        for (const alt of available) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${alt}:generateContent`;
            const generationConfig = { temperature: 0.2 };
            if (opts.json) generationConfig.responseMimeType = "application/json";
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-goog-api-key": key },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysPrompt }] },
                contents: [{ role: "user", parts: userParts }],
                generationConfig
              })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
              const txt = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
              if (txt) return txt;
            }
          } catch (_) { }
        }
      }
    } catch (_) { }
  }

  if (lastErr) throw lastErr;
  return "";
}

