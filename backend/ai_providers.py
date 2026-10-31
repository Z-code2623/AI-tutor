"""Bộ chuyển đổi nhà cung cấp AI: mỗi tài khoản dùng key/model của riêng mình.
Hỗ trợ tự động chuẩn hóa model Gemini và tự động chuyển đổi dự phòng (Fallback) khi model bị ngừng hoặc quá tải."""
import hashlib, ipaddress, json, os, re, socket, time, urllib.error, urllib.parse, urllib.request

PROVIDERS = {
    "gemini": {"label": "Google Gemini (Khuyên dùng - Có bản miễn phí)", "base": "https://generativelanguage.googleapis.com/v1beta", "model": "gemini-3.5-flash-lite"},
    "openai": {"label": "OpenAI (ChatGPT / GPT-4o-mini)", "base": "https://api.openai.com/v1", "model": "gpt-4o-mini"},
    "deepseek": {"label": "DeepSeek AI (V3 / R1)", "base": "https://api.deepseek.com", "model": "deepseek-chat"},
    "anthropic": {"label": "Anthropic (Claude)", "base": "https://api.anthropic.com", "model": "claude-sonnet-5-5"},
    "openrouter": {"label": "OpenRouter (Tổng hợp đa AI)", "base": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.3-70b-instruct:free"},
}

GEMINI_FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
]
_LEGACY_GEMINI = re.compile(r"^(models/)?(gemini-(1\.|2\.0|pro|ultra|flash$))", re.I)


class AIError(Exception):
    code = None   # mã HTTP của nhà cung cấp (nếu có)


def safe_base(url):
    """Chặn SSRF: chỉ https, không trỏ vào IP nội bộ (trừ khi đặt AI_ALLOW_LOCAL=1, ví dụ dùng Ollama)."""
    u = urllib.parse.urlparse(url); local_ok = os.environ.get("AI_ALLOW_LOCAL") == "1"
    if u.scheme != "https" and not (local_ok and u.scheme == "http"): raise AIError("Base URL phải dùng https")
    if not u.hostname: raise AIError("Base URL không hợp lệ")
    try: ips = {ipaddress.ip_address(i[4][0]) for i in socket.getaddrinfo(u.hostname, u.port or 443)}
    except Exception: raise AIError("Không phân giải được tên miền")
    if not local_ok and any(i.is_private or i.is_loopback or i.is_link_local or i.is_reserved for i in ips):
        raise AIError("Base URL trỏ vào địa chỉ nội bộ")
    return url.rstrip("/")


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Không đi theo redirect: tránh bị chuyển hướng vào địa chỉ nội bộ sau khi đã qua safe_base()."""
    def redirect_request(self, *a, **k): return None
_opener = urllib.request.build_opener(_NoRedirect)


def _detail(e):
    """Lấy câu giải thích ngắn từ nội dung lỗi của nhà cung cấp (vd: "API key not valid")."""
    try:
        j = json.loads(e.read().decode("utf-8", "replace"))
        if isinstance(j, list) and j: j = j[0]
        m = j.get("error", j) if isinstance(j, dict) else ""
        m = m.get("message", "") if isinstance(m, dict) else str(m)
        return " ".join(str(m).split())[:180]
    except Exception: return ""


def _post(url, headers, payload, retries=1):
    data = json.dumps(payload).encode()
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers={"content-type": "application/json", **headers}, method="POST")
        try:
            with _opener.open(req, timeout=60) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (500, 502, 503, 504) and attempt < retries: time.sleep(1.2); continue
            msg = {400: "Yêu cầu không hợp lệ", 401: "API key không hợp lệ", 403: "Key không có quyền dùng model này",
                   404: "Model không tồn tại hoặc đã ngừng hỗ trợ", 429: "Hết hạn mức hoặc gọi quá nhanh"}.get(e.code, f"Nhà cung cấp trả lỗi {e.code}")
            d = _detail(e)
            if e.code in (400, 401, 403) and re.search(r"api[ _-]?key.*(not valid|invalid|expired|missing)", d, re.I):
                msg = "API key không hợp lệ hoặc đã bị thu hồi"
            err = AIError(msg + (f" ({d})" if d else "")); err.code = e.code; raise err
        except AIError: raise
        except json.JSONDecodeError: raise AIError("Nhà cung cấp trả về dữ liệu không hợp lệ")
        except Exception as e:
            if isinstance(e, (socket.timeout, TimeoutError)) or isinstance(getattr(e, "reason", None), (socket.timeout, TimeoutError)):
                if attempt < retries: continue
                raise AIError("AI phản hồi quá chậm (quá 60 giây), hãy thử lại")
            if attempt < retries: time.sleep(1); continue
            raise AIError("Không kết nối được nhà cung cấp AI")


_GM_BASE = "https://generativelanguage.googleapis.com/v1beta"
_gm_cache = {}


def gemini_pick_model(key):
    """Dò danh sách model Gemini khả dụng cho API key hiện tại."""
    h = hashlib.sha256(key.encode()).hexdigest()
    if h in _gm_cache: return _gm_cache[h]
    req = urllib.request.Request(_GM_BASE + "/models?pageSize=200", headers={"x-goog-api-key": key})
    try:
        with _opener.open(req, timeout=20) as r: d = json.load(r)
    except urllib.error.HTTPError as e:
        d = _detail(e)
        err = AIError({400: "API key không hợp lệ", 401: "API key không hợp lệ", 403: "Key không có quyền"}.get(e.code, f"Nhà cung cấp trả lỗi {e.code}")
                      + (f" ({d})" if d else ""))
        err.code = e.code
        raise err
    except Exception: raise AIError("Không kết nối được máy chủ Google Gemini")
    ok = [m["name"].split("/", 1)[1] for m in d.get("models", [])
          if "generateContent" in m.get("supportedGenerationMethods", []) and re.fullmatch(r"models/gemini-\d+(\.\d+)?-flash(-lite)?", m["name"])]
    if not ok: raise AIError("API key không truy cập được model Gemini nào")
    for pref in GEMINI_FALLBACK_MODELS:
        if pref in ok:
            _gm_cache[h] = pref
            return pref
    ver = lambda n: float(re.search(r"gemini-(\d+(?:\.\d+)?)", n).group(1)) if re.search(r"gemini-(\d+(?:\.\d+)?)", n) else 0.0
    ok.sort(key=lambda n: (-ver(n), "lite" not in n))
    _gm_cache[h] = ok[0]
    return ok[0]


def _empty(): raise AIError("AI trả về rỗng hoặc bị chặn nội dung, hãy thử lại")


def _call_gemini_native(key, model, system, user, image=None):
    """Gọi trực tiếp Gemini REST API v1beta ổn định, hỗ trợ tự động chuyển đổi model dự phòng và tải ảnh (Multimodal)."""
    clean_model = re.sub(r"^models/", "", (model or "").strip())
    if not clean_model or _LEGACY_GEMINI.match(clean_model):
        clean_model = PROVIDERS["gemini"]["model"]

    candidates = [clean_model] + [m for m in GEMINI_FALLBACK_MODELS if m != clean_model]
    last_err = None

    user_parts = []
    if isinstance(image, dict) and image.get("data"):
        m_type = image.get("mimeType") or image.get("mime_type") or "image/jpeg"
        user_parts.append({"inlineData": {"mimeType": m_type, "data": image["data"]}})
    user_parts.append({"text": user})

    for m in candidates:
        url = f"{_GM_BASE}/models/{urllib.parse.quote(m)}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": user_parts}],
            "generationConfig": {"temperature": 0.2}
        }
        try:
            d = _post(url, {"x-goog-api-key": key}, payload, retries=1)
            parts = (((d.get("candidates") or [{}])[0]).get("content") or {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts).strip()
            if text:
                return text
            _empty()
        except AIError as e:
            last_err = e
            # Nếu lỗi xác thực API Key thực sự thì dừng ngay, không thử model khác
            if e.code in (401, 403) or (e.code == 400 and "API key" in str(e)):
                raise _tag(e, m)
            # Nếu 404 / 400 (model cũ/không hỗ trợ) hoặc 429 / 503 (quá tải) -> thử model dự phòng tiếp theo
            continue

    # Thử dò tự động bằng ListModels nếu cả danh sách mặc định đều không khớp
    try:
        alt = gemini_pick_model(key)
        if alt not in candidates:
            url = f"{_GM_BASE}/models/{urllib.parse.quote(alt)}:generateContent"
            payload = {
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": user_parts}],
                "generationConfig": {"temperature": 0.2}
            }
            d = _post(url, {"x-goog-api-key": key}, payload, retries=1)
            parts = (((d.get("candidates") or [{}])[0]).get("content") or {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts).strip()
            if text:
                return text
    except AIError as e2:
        last_err = e2

    raise _tag(last_err or AIError("Không thể kết nối Gemini AI"), clean_model)


def _chat(cfg, p, base, model, system, user, max_tokens, image=None):
    if cfg["provider"] == "gemini" and ("generativelanguage.googleapis.com" in base or not cfg.get("base_url")):
        return _call_gemini_native(cfg["key"], model, system, user, image=image)
    if cfg["provider"] == "anthropic":
        d = _post(base + "/v1/messages", {"x-api-key": cfg["key"], "anthropic-version": "2023-06-01"},
                  {"model": model, "max_tokens": max_tokens, "system": system, "messages": [{"role": "user", "content": user}]})
        try: return "".join(b.get("text", "") for b in d["content"]) or _empty()
        except (KeyError, TypeError): _empty()
    payload = {"model": model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}], "max_tokens": max_tokens}
    hdr = {"authorization": "Bearer " + cfg["key"]}
    d = _post(base + "/chat/completions", hdr, payload)
    try: return d["choices"][0]["message"]["content"] or _empty()
    except (KeyError, IndexError, TypeError): _empty()


def _tag(e, model):
    """Gắn tên model vào lỗi liên quan key/model để biết đang gọi model nào (giữ nguyên mã lỗi)."""
    if getattr(e, "code", None) in (400, 401, 403, 404) and "[model:" not in str(e):
        n = AIError(f"{e} [model: {model}]"); n.code = e.code; return n
    return e


def complete(cfg, system, user, max_tokens=2500, image=None):
    """cfg: {provider, model, base_url, key}. Trả về văn bản."""
    p = PROVIDERS.get(cfg.get("provider"))
    if not p: raise AIError("Nhà cung cấp không hỗ trợ")
    raw_base = (cfg.get("base_url") or "").strip()
    if cfg.get("provider") == "gemini" and "generativelanguage.googleapis.com" in raw_base:
        raw_base = ""
    base = safe_base(raw_base or p["base"])
    model = (cfg.get("model") or "").strip() or p["model"]
    if cfg["provider"] == "gemini" and _LEGACY_GEMINI.match(model):
        model = p["model"]
    if cfg["provider"] == "anthropic" and re.match(r"claude-3", model, re.I):   # dòng Claude 3.x đã cũ/ngừng hỗ trợ -> dùng model mặc định hiện hành
        model = p["model"]
    try:
        return _chat(cfg, p, base, model, system, user, max_tokens, image=image)
    except AIError as e:
        raise _tag(e, model)

