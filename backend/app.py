"""Flask API + phục vụ frontend (Cách 1: Web tự đứng ra chịu API).
Chạy:  python app.py  ->  http://localhost:5000
"""
import os, pathlib, re, time, sys
if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
if hasattr(sys.stderr, "reconfigure"):
    try: sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

import envload
envload.load_env()

from urllib.parse import urlparse
from flask import Flask, jsonify, request, send_from_directory
import accounts, ai_providers, llm, solver
from ml import BKT, INIT, Engine

FRONT = (pathlib.Path(__file__).parent.parent / "frontend") if (pathlib.Path(__file__).parent.parent / "frontend").exists() else pathlib.Path(__file__).parent.parent
# static_folder=None: KHÔNG phục vụ cả thư mục gốc (sẽ lộ .env, mã nguồn, CSDL). Chỉ phục vụ index.html, css/, js/ qua route riêng bên dưới.
app = Flask(__name__, static_folder=None)

# Chỉ tin X-Forwarded-For khi bạn KHAI BÁO số lớp reverse proxy đứng trước (TRUSTED_PROXIES=1 với nginx). Mặc định 0 = không tin header này.
_TP = int(os.environ.get("TRUSTED_PROXIES", 0))
if _TP:
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=_TP, x_proto=_TP, x_host=_TP)

eng = Engine()
LIMIT = int(os.environ.get("LLM_DAILY_LIMIT", 30))                    # AI hệ thống: mỗi tài khoản đăng nhập / ngày
GUEST_LIMIT = int(os.environ.get("LLM_GUEST_DAILY_LIMIT", 10))        # AI hệ thống: mỗi IP khách / ngày
GLOBAL_LIMIT = int(os.environ.get("LLM_GLOBAL_DAILY_LIMIT", 1200))    # trần tổng / ngày để key hệ thống không bị rút cạn
CORS_ORIGINS = {o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()}
DEFAULT = {"p": INIT, "level": 1, "done": 0, "history": [], "settings": {"llm": True, "dkt": True},
           "ai": {"provider": "gemini", "model": "", "base_url": "", "key": "", "calls": 0}}

def _origin_ok(o):
    """So khớp CHÍNH XÁC hostname (không dùng 'localhost' in o: http://localhost.evil.com sẽ lọt)."""
    if not o: return False
    if "*" in CORS_ORIGINS or o in CORS_ORIGINS: return True
    if o == "null": return accounts.DEV   # file:// chỉ khi chạy thử (MAIL_DEV=1)
    try: u = urlparse(o)
    except ValueError: return False
    return u.scheme in ("http", "https") and u.hostname in ("localhost", "127.0.0.1", "::1")

def _int(v, default, lo=None, hi=None):
    try: x = int(v)
    except (TypeError, ValueError): return default
    if lo is not None: x = max(lo, x)
    if hi is not None: x = min(hi, x)
    return x

@app.after_request
def add_cors(resp):
    o = (request.headers.get("Origin") or "").rstrip("/")
    if o:
        if _origin_ok(o):
            resp.headers["Access-Control-Allow-Origin"] = o
            resp.headers["Vary"] = "Origin"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    if request.path.startswith("/api/"):
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp

@app.route("/<path:path>", methods=["OPTIONS"])
@app.route("/", methods=["OPTIONS"])
def cors_options(path=""):
    resp = app.make_response(("", 204))
    o = (request.headers.get("Origin") or "").rstrip("/")
    if o:
        if _origin_ok(o):
            resp.headers["Access-Control-Allow-Origin"] = o
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    return resp

def current():
    h = request.headers.get("Authorization", "")
    return accounts.user_from_token(h[7:]) if h.startswith("Bearer ") else None

def body():
    return request.get_json(silent=True) or {}

def client_ip():
    return request.remote_addr or "?"

def _is_local_request():
    fwd = any(request.headers.get(h) for h in ("X-Forwarded-For", "Forwarded", "X-Real-IP", "X-Forwarded-Host"))
    return accounts.DEV and not _TP and not fwd and request.remote_addr in ("127.0.0.1", "::1")

def too_many(msg="Bạn thao tác quá nhanh, hãy thử lại sau"):
    return jsonify(ok=False, error=msg), 429

def _account_cfg(st):
    """Cấu hình AI riêng của tài khoản (key đã giải mã) hoặc None."""
    a = (st or {}).get("ai") or {}
    if not a.get("key"): return None
    raw = accounts.try_decrypt(a["key"])
    if not raw: return None
    return {"provider": a.get("provider") or "gemini", "base_url": "", "model": a.get("model") or "", "key": raw}

def ai_public(st=None):
    """Thông tin trạng thái AI gửi về trình duyệt. Tuyệt đối KHÔNG trả API key."""
    acct = _account_cfg(st)
    prov = (acct or {}).get("provider", "gemini")
    return {
        "mode": "account" if acct else "server_managed",
        "has_account_key": bool(acct),
        "key_broken": bool(st and (st.get("ai") or {}).get("key") and not acct),   # có lưu nhưng không giải mã được (SECRET_KEY đã đổi)
        "provider": prov,
        "provider_label": ai_providers.PROVIDERS.get(prov, {}).get("label", prov) if acct else "Google Gemini (Chủ web quản lý)",
        "model": ((acct or {}).get("model") or ai_providers.PROVIDERS.get(prov, {}).get("model", "")) if acct else os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "server_available": llm.available(),
        "daily_limit": LIMIT,
        "guest_limit": GUEST_LIMIT,
        "status": "ready" if (acct or llm.available()) else "no_key",
    }

def view(u):
    st = accounts.get_state(u, DEFAULT)
    return {"email": u, "state": {k: v for k, v in st.items() if k not in ("ai", "llm_usage")}, "ai": ai_public(st)}

@app.get("/")
def index():
    return send_from_directory(FRONT, "index.html")

@app.get("/css/<path:fn>")
def static_css(fn):
    return send_from_directory(FRONT / "css", fn)

@app.get("/js/<path:fn>")
def static_js(fn):
    return send_from_directory(FRONT / "js", fn)

@app.get("/api/health")
def health():
    return jsonify(ok=True, engine="python-sklearn", ai_mode="server_managed", ai_ready=llm.available())

# ---------- Quản lý tài khoản ----------
@app.post("/api/auth/request")
def auth_request():
    email = str(body().get("email", "")).strip().lower()
    if not accounts.hit(f"otp-ip:{client_ip()}", 10, 3600) or accounts.peek("otp-all", 86400) >= int(os.environ.get("MAIL_DAILY_LIMIT", 300)):
        return too_many("Quá nhiều yêu cầu gửi mã, hãy thử lại sau")
    ok, dev, err, code = accounts.request_code(email)
    if ok:
        accounts.hit("otp-all", 10**9, 86400)
    if not _is_local_request():
        dev = None
    if ok:
        return jsonify(ok=True, dev_code=dev)
    return jsonify(ok=False, error=err, code=code), (503 if code == "smtp_not_configured" else 429 if code in ("rate", "wait") else 400)

@app.post("/api/auth/verify")
def auth_verify():
    b = body()
    email = str(b.get("email", "")).strip().lower()
    if not accounts.hit(f"verify-ip:{client_ip()}", 30, 600):
        return too_many("Nhập sai quá nhiều lần, hãy thử lại sau ít phút")
    tok = accounts.verify_code(email, str(b.get("code", "")), DEFAULT)
    if not tok:
        return jsonify(ok=False, error="Mã sai hoặc đã hết hạn"), 400
    return jsonify(ok=True, token=tok, **view(email))

@app.post("/api/auth/logout")
def auth_logout():
    u = current()
    if not u:
        return jsonify(error="Chưa đăng nhập"), 401
    accounts.revoke_tokens(u)
    return jsonify(ok=True)

@app.get("/api/me")
def me():
    u = current()
    if not u:
        return jsonify(error="Chưa đăng nhập"), 401
    return jsonify(view(u))

@app.post("/api/sync")
def sync():
    u = current()
    if not u:
        return jsonify(error="Chưa đăng nhập"), 401
    s = body().get("settings", {})
    with accounts.LOCK:
        st = accounts.get_state(u, DEFAULT)
        st["settings"].update({k: bool(s[k]) for k in ("llm", "dkt") if k in s})
        accounts.save_state(u, st)
    return jsonify(view(u))

# ---------- Trạng thái AI (Cách 1: Server-managed) ----------
@app.get("/api/ai")
def ai_get():
    u = current()
    st = accounts.get_state(u, DEFAULT) if u else None
    return jsonify(ai_public(st))

@app.put("/api/ai")
def ai_put():
    """Lưu API key RIÊNG của tài khoản (mã hóa ở máy chủ). Từ đó tài khoản này tự động dùng AI của chính mình."""
    u = current()
    if not u:
        return jsonify(ok=False, error="Chưa đăng nhập"), 401
    b = body()
    key = str(b.get("key", "")).strip()
    prov = str(b.get("provider", "gemini")).strip().lower()
    model = str(b.get("model", "")).strip()[:80]
    if prov not in ai_providers.PROVIDERS:
        return jsonify(ok=False, error="Nhà cung cấp AI không được hỗ trợ"), 400
    if not (8 <= len(key) <= 300) or any(ch.isspace() for ch in key):
        return jsonify(ok=False, error="API key không hợp lệ"), 400
    if not accounts.hit(f"ai-put:{u}", 20, 3600):
        return too_many()
    warn = None
    try:   # kiểm tra nhanh key có dùng được không; chỉ từ chối khi lỗi do chính key (400/401/403)
        ai_providers.complete({"provider": prov, "base_url": "", "model": model, "key": key}, "Trả lời đúng một từ.", "Nói: OK", max_tokens=10)
    except ai_providers.AIError as e:
        if e.code in (400, 401, 403):
            return jsonify(ok=False, error=str(e)), 400
        warn = str(e)
    with accounts.LOCK:
        st = accounts.get_state(u, DEFAULT)
        st["ai"].update({"provider": prov, "model": model, "key": accounts.encrypt(key), "base_url": ""})
        accounts.save_state(u, st)
    return jsonify(ok=True, warning=warn, ai=ai_public(st))

@app.delete("/api/ai")
def ai_delete():
    u = current()
    if not u:
        return jsonify(ok=False, error="Chưa đăng nhập"), 401
    with accounts.LOCK:
        st = accounts.get_state(u, DEFAULT)
        st["ai"].update({"key": "", "model": "", "base_url": ""})
        accounts.save_state(u, st)
    return jsonify(ok=True, ai=ai_public(st))

@app.post("/api/ai/test")
def ai_test():
    """Kiểm tra kết nối AI đang được dùng cho người này (key tài khoản hoặc key máy chủ)."""
    if not accounts.hit(f"ai-test:{client_ip()}", 10, 3600):
        return too_many()
    u = current()
    st = accounts.get_state(u, DEFAULT) if u else None
    cfg, _ = pick_ai(st)
    if not cfg:
        return jsonify(ok=False, error="Chưa có AI nào được cấu hình (key tài khoản hoặc GEMINI_API_KEY trên máy chủ)"), 400
    try:
        ai_providers.complete(cfg, "Trả lời đúng một từ.", "Nói: OK", max_tokens=10)
        return jsonify(ok=True, model=cfg.get("model"))
    except ai_providers.AIError as e:
        return jsonify(ok=False, error=str(e)), 400
    except Exception as e:
        return jsonify(ok=False, error=str(e) or "Lỗi kết nối máy chủ AI"), 400

# ---------- Giải toán / vật lý & AI Gia Sư ----------
class KeyBroken(Exception):
    pass

KEY_BROKEN_MSG = "Khóa máy chủ bị lỗi. Vui lòng kiểm tra lại cấu hình .env."

def pick_ai(st=None, guest_ai=None, u=None, client_key=None):
    """Thứ tự: key riêng của tài khoản đăng nhập > AI của máy chủ (.env) > key người dùng gửi kèm. Trả (cfg, nguồn)."""
    acct = _account_cfg(st)
    if acct:
        return acct, "account"
    if os.environ.get("GEMINI_API_KEY"):
        return {
            "provider": "gemini",
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "model": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
            "key": os.environ["GEMINI_API_KEY"]
        }, "server"
    if client_key and isinstance(client_key, str) and client_key.strip():
        return {
            "provider": "gemini",
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "model": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
            "key": client_key.strip()
        }, "client"
    if os.environ.get("OPENAI_API_KEY"):
        return {
            "provider": "openai",
            "base_url": os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            "key": os.environ["OPENAI_API_KEY"]
        }, "server"
    if os.environ.get("DEEPSEEK_API_KEY"):
        return {
            "provider": "deepseek",
            "base_url": "https://api.deepseek.com",
            "model": os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
            "key": os.environ["DEEPSEEK_API_KEY"]
        }, "server"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return {
            "provider": "anthropic",
            "base_url": "https://api.anthropic.com",
            "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5"),
            "key": os.environ["ANTHROPIC_API_KEY"]
        }, "server"
    return None, None

def llm_gate(u, st):
    """Kiểm tra hạn mức AI của máy chủ (tài khoản / IP khách / trần toàn cục). Trả (dict_lỗi | None, lượt_còn_lại | None)."""
    today = time.strftime("%Y-%m-%d")
    quota_left = None
    if st:
        use = st.get("llm_usage") or {}
        if use.get("day") == today and use.get("n", 0) >= LIMIT:
            return {"limit": True, "llm_msg": f"Bạn đã sử dụng hết {LIMIT} lượt hỏi AI trong ngày hôm nay. Hãy quay lại vào ngày mai!"}, None
    else:
        ip = client_ip()
        if not accounts.hit(f"llm-ip:{ip}", GUEST_LIMIT, 86400):
            return {"limit": True, "llm_msg": f"Bạn đã dùng hết {GUEST_LIMIT} lượt miễn phí cho khách hôm nay. Hãy đăng nhập email để có thêm lượt."}, None
        quota_left = max(0, GUEST_LIMIT - accounts.peek(f"llm-ip:{ip}", 86400))
    if not accounts.hit("llm-global", GLOBAL_LIMIT, 86400):
        return {"limit": True, "global_limit": True, "llm_msg": "Hệ thống đã đạt giới hạn an toàn toàn cục trong ngày. Vui lòng quay lại sau."}, None
    return None, quota_left

def count_use(u):
    """Ghi nhận 1 lượt AI cho tài khoản; trả số lượt còn lại trong ngày."""
    today = time.strftime("%Y-%m-%d")
    with accounts.LOCK:
        st = accounts.get_state(u, DEFAULT)
        use = st.get("llm_usage") or {}
        if use.get("day") != today:
            use = {"day": today, "n": 0}
        st["ai"]["calls"] += 1
        use["n"] += 1
        st["llm_usage"] = use
        accounts.save_state(u, st)
        return max(0, LIMIT - use["n"])

def route_llm(text, out, conf, subject="auto", client_key=None, image=None):
    """Bài tự luận / chứng minh / mở rộng / ảnh chụp: Dùng AI máy chủ hoặc client xử lý, có Rate Limit bảo vệ."""
    proof = llm.looks_like_proof(text)
    u = current()
    fail = lambda **k: ({**out, "valid": False, "steps": [], **k}, conf)

    st = accounts.get_state(u, DEFAULT) if u else None
    cfg, src = pick_ai(st, None, u=u, client_key=client_key)
    if not cfg:
        return fail(llm_error=True, llm_msg="Chưa có AI nào được cấu hình. Hãy đăng nhập và lưu API key của bạn, hoặc nhờ quản trị viên cấu hình GEMINI_API_KEY.")
    quota_left = None
    if src == "server":
        err, quota_left = llm_gate(u, st)
        if err:
            return fail(**err)

    profile = llm.profile_text(st) if st else "Học sinh cần lời giải từng bước rõ ràng, dễ hiểu."
    try:
        res = llm.ask(text, cfg, profile=profile, subject=subject, image=image)
    except ai_providers.AIError as e:
        return fail(llm_error=True, llm_msg=str(e))
    except Exception:
        return fail(llm_error=True, llm_msg="AI trả về kết quả không đọc được. Hãy bấm giải lại.")

    if u and src == "server":
        quota_left = count_use(u)
    if quota_left is not None:
        res["quota_left"] = quota_left
    res["ai_source"] = src
    return res, max(conf, 0.95)

@app.post("/api/solve")
def solve():
    b = body()
    text = str(b.get("text", "")).strip()[:2000]
    subject = str(b.get("subject", "auto")).strip().lower()
    client_key = str(b.get("key") or b.get("client_key") or "").strip()
    image = b.get("image")

    if not text and not image:
        return jsonify(error="Thiếu đề bài hoặc ảnh đề bài"), 400

    if image:
        # Nếu có ảnh, định tuyến thẳng tới AI Multimodal (Gemini Vision)
        if not text:
            text = "Giải bài tập trong ảnh đính kèm"
        out = {**solver.solve("", "linear"), "valid": False, "steps": []}
        out, conf = route_llm(text, out, 0.5, subject=subject, client_key=client_key, image=image)
        out["conf"] = round(conf, 4)
        out["label"] = out.get("kind") or "ai_vision"
        return jsonify(out)

    # 1. Phân loại bài tập bằng TF-IDF + Logistic Regression
    label, conf = eng.classify(text)

    # 2. Thử giải bằng bộ giải công thức 36 dạng chuẩn
    try:
        out = solver.solve(text, label)
    except Exception:
        out = {**solver.solve("", "linear"), "valid": False, "steps": []}

    if not out.get("valid") and not llm.looks_like_proof(text):
        # Thử các dạng phương trình / vật lý phổ biến
        alts = ("linear", "quad", "system", "ineq", "kinematics", "freefall", "ohm", "thermal", "newton2", "chem_mol", "chem_gas", "chem_conc_mol", "chem_conc_pct", "chem_ph", "chem_metal_acid", "chem_eq")
        for alt in alts:
            if alt == label or alt not in solver.META:
                continue
            try:
                r = solver.solve(text, alt)
            except Exception:
                continue
            if r.get("valid") and r.get("steps"):
                out, label = r, alt
                break

    # 3. Nếu chưa giải được hoặc là bài tự luận / chứng minh / mở rộng -> Chuyển sang AI máy chủ hoặc client key
    if not out.get("valid") or llm.looks_like_proof(text):
        out, conf = route_llm(text, out, conf, subject=subject, client_key=client_key)

    out["conf"] = round(conf, 4)
    out["label"] = label
    return jsonify(out)

@app.post("/api/tutor")
def tutor():
    """Hỏi đáp tương tác cùng Gia sư AI về bài tập hiện tại (Toán học hoặc Vật lý)."""
    b = body()
    question = str(b.get("question", "")).strip()[:1000]
    problem = str(b.get("problem", "")).strip()[:1000]
    ans = str(b.get("ans", "")).strip()[:500]
    steps = b.get("steps") or []
    subject = str(b.get("subject", "math")).strip().lower()
    client_key = str(b.get("key") or b.get("client_key") or "").strip()

    if not question:
        return jsonify(ok=False, error="Vui lòng nhập câu hỏi cho gia sư"), 400

    u = current()
    st = accounts.get_state(u, DEFAULT) if u else None
    cfg, src = pick_ai(st, client_key=client_key)
    if not cfg:
        return jsonify(ok=False, error="Chưa có AI nào được cấu hình. Hãy đăng nhập và lưu API key của bạn."), 503

    # Dùng CHUNG hạn mức với /api/solve (tài khoản / IP khách / trần toàn cục) khi dùng key của máy chủ
    if src == "server":
        err, _ = llm_gate(u, st)
        if err:
            return jsonify(ok=False, error=err["llm_msg"]), 429

    try:
        reply = llm.ask_tutor(question, problem, steps, ans=ans, subject=subject, cfg=cfg)
        if u and src == "server":
            count_use(u)
        return jsonify(ok=True, answer=reply)
    except ai_providers.AIError as e:
        return jsonify(ok=False, error=str(e)), 500
    except Exception as e:
        return jsonify(ok=False, error=str(e) or "Không thể kết nối gia sư AI"), 500

@app.get("/api/recommend")
def recommend():
    a = request.args
    level = _int(a.get("level"), 1, 1, 3)
    n = _int(a.get("n"), 3, 1, 20)
    u = current()
    m = accounts.get_state(u, DEFAULT)["p"] if u else None
    if a.get("text"):
        rs = eng.recommend(None, level, n, text=a["text"][:300], mastery=m)
    elif a.get("id"):
        pid = _int(a.get("id"), None)
        try:
            idx = eng.index_of(pid) if pid is not None else None
        except IndexError:
            idx = None
        if idx is None:
            return jsonify(error="Không tìm thấy bài tập"), 404
        rs = eng.recommend(idx, level, n, mastery=m)
    else:
        rs = eng.recommend(0, level, n, mastery=m)
    return jsonify([{"p": r["p"], "s": round(r["s"], 4)} for r in rs])

@app.post("/api/submit")
def submit():
    b = body()
    u = current()
    out = _submit(b, u)
    return (jsonify(out), 400) if "error" in out else jsonify(out)

def _submit(b, u):
    topic = str(b.get("topic", "Algebra"))
    if topic not in INIT:
        return {"error": "Chủ đề không hợp lệ"}
    correct = bool(b.get("correct", True))
    diff = _int(b.get("diff"), 1, 1, 3)
    if u:
        with accounts.LOCK:
            st = accounts.get_state(u, DEFAULT)
            p_new = BKT(st["p"]).update(topic, correct)   # update() là phương thức của đối tượng BKT, không gọi qua lớp
            st["p"][topic] = round(p_new, 4)
            st["done"] += 1
            st["level"] = min(3, max(1, round((st["level"] * 2 + diff) / 3 + (0.3 if correct else -0.3))))
            st["history"].append({"text": str(b.get("text", ""))[:200], "topic": topic, "diff": diff, "correct": correct})
            st["history"] = st["history"][-50:]
            accounts.save_state(u, st)
            return {"level": st["level"], "p_known": p_new}
    p_new = BKT().update(topic, correct)
    return {"level": min(3, max(1, diff)), "p_known": round(p_new, 4)}

@app.get("/api/mastery")
def mastery():
    u = current()
    st = accounts.get_state(u, DEFAULT) if u else None
    return jsonify(st["p"] if st else INIT)

@app.get("/api/metrics")
def metrics():
    return jsonify(eng.metrics)

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 AdaptiveTutor AI Server khởi động tại http://{host}:{port}")
    app.run(host=host, port=port, debug=False)
