import base64, copy, hashlib, hmac, json, os, pathlib, re, secrets, smtplib, sqlite3, sys, threading, time
if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
if hasattr(sys.stderr, "reconfigure"):
    try: sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
from email.message import EmailMessage
from itsdangerous import BadSignature, URLSafeTimedSerializer

# DATA_DIR: đặt về ổ đĩa BỀN VỮNG của máy chủ (Render Disk, Railway Volume, VPS...). Mặc định backend/data.
D = pathlib.Path(os.environ.get("DATA_DIR") or (pathlib.Path(__file__).parent / "data")); DB = D / "app.db"; D.mkdir(parents=True, exist_ok=True)
LOCK = threading.RLock()   # tránh 2 request cùng đọc-sửa-ghi hồ sơ một tài khoản làm mất key vừa lưu
_sf = D / ".secret"
_PLACEHOLDER = re.compile(r"doi-thanh|changeme|change-me|your[-_ ]?secret|example|xxxx", re.I)


def _secret():
    s = os.environ.get("SECRET_KEY", "").strip()
    if s:
        if len(s) < 32 or _PLACEHOLDER.search(s):
            raise SystemExit("[LỖI] SECRET_KEY quá ngắn (<32 ký tự) hoặc vẫn là giá trị mẫu. Tạo khóa mới: "
                             "python -c \"import secrets;print(secrets.token_hex(32))\"")
        return s
    if os.environ.get("APP_ENV") == "production":
        raise SystemExit("[LỖI] APP_ENV=production nhưng chưa đặt SECRET_KEY.")
    if not _sf.exists():
        _sf.write_text(secrets.token_hex(32)); os.chmod(_sf, 0o600)
    return _sf.read_text().strip()


SECRET = _secret()
if not os.environ.get("SECRET_KEY"):
    print("[CẢNH BÁO] Chưa đặt SECRET_KEY: đang dùng khóa ngẫu nhiên lưu ở", _sf, "- chỉ phù hợp khi chạy thử trên máy. "
          "Khi triển khai hãy đặt biến môi trường SECRET_KEY cố định.")


def _sub(purpose):
    """Khóa con riêng cho từng mục đích (ký token / băm mã / mã hoá key AI): lộ một loại không kéo theo hai loại còn lại."""
    return hmac.new(SECRET.encode(), b"adaptivephysics:" + purpose.encode(), hashlib.sha256).digest()


ser = URLSafeTimedSerializer(_sub("token").hex(), salt="auth")
TOKEN_DAYS = int(os.environ.get("TOKEN_DAYS", 14))
EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$")
DEV = os.environ.get("MAIL_DEV", "0") == "1"   # MẶC ĐỊNH TẮT: phải bật rõ ràng, và chỉ để chạy thử trên máy
if DEV and os.environ.get("APP_ENV") == "production":
    raise SystemExit("[LỖI] MAIL_DEV=1 không được dùng khi APP_ENV=production (sẽ lộ mã đăng nhập). Đặt MAIL_DEV=0 và cấu hình SMTP.")


class MailNotConfigured(Exception):
    pass


def db():
    c = sqlite3.connect(DB, timeout=15); c.row_factory = sqlite3.Row   # timeout: chờ khoá thay vì báo "database is locked"
    try: c.execute("PRAGMA journal_mode=WAL")
    except sqlite3.Error: pass
    c.executescript("CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY, created REAL, state TEXT);"
                    "CREATE TABLE IF NOT EXISTS otp(email TEXT PRIMARY KEY, h TEXT, exp REAL, ts REAL, tries INT);"
                    "CREATE TABLE IF NOT EXISTS rl(k TEXT PRIMARY KEY, win INTEGER, n INTEGER, ts REAL);")
    try: c.execute("ALTER TABLE users ADD COLUMN tv INTEGER DEFAULT 0")   # phiên bản token: tăng lên để thu hồi mọi token cũ
    except sqlite3.Error: pass
    return c


def hit(key, limit, window):
    """Đếm lượt theo khóa (IP, email...) trong cửa sổ `window` giây. Trả True nếu còn trong hạn mức (và ghi nhận lượt này)."""
    now = time.time(); win = int(now // window)
    with LOCK, db() as c:
        r = c.execute("SELECT win, n FROM rl WHERE k=?", (key,)).fetchone()
        n = r["n"] if r and r["win"] == win else 0
        if n >= limit: return False
        c.execute("REPLACE INTO rl VALUES(?,?,?,?)", (key, win, n + 1, now))
        if secrets.randbelow(50) == 0: c.execute("DELETE FROM rl WHERE ts < ?", (now - 3 * 86400,))   # dọn rác thỉnh thoảng
    return True


def peek(key, window):
    """Số lượt đã dùng trong cửa sổ hiện tại (không ghi nhận)."""
    win = int(time.time() // window)
    with db() as c: r = c.execute("SELECT win, n FROM rl WHERE k=?", (key,)).fetchone()
    return r["n"] if r and r["win"] == win else 0


def _h(email, code): return hmac.new(_sub("otp"), f"{email}\n{code}".encode(), hashlib.sha256).hexdigest()


def _send(email, code):
    host = os.environ.get("SMTP_HOST")
    if not host:
        if not DEV: raise MailNotConfigured()
        print(f"[DEV] Mã đăng nhập cho {email}: {code}"); return code   # chỉ khi MAIL_DEV=1 tường minh
    m = EmailMessage(); m["Subject"] = "Mã đăng nhập AdaptiveTutor AI"; m["To"] = email
    m["From"] = os.environ.get("MAIL_FROM", os.environ.get("SMTP_USER", "no-reply@localhost"))
    m.set_content(f"Mã đăng nhập của bạn: {code}\nMã có hiệu lực trong 10 phút.")
    with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", 587)), timeout=15) as s:
        s.starttls()
        if os.environ.get("SMTP_USER"): s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASS", ""))
        s.send_message(m)
    return None


def request_code(email):
    """Trả (ok, dev_code, lỗi, mã_lỗi)."""
    if not EMAIL_RE.match(email): return False, None, "Email không hợp lệ", "bad_email"
    if not hit(f"otp-email:{email}", 5, 3600): return False, None, "Email này đã yêu cầu quá nhiều mã, hãy thử lại sau 1 giờ", "rate"
    with db() as c:
        r = c.execute("SELECT ts FROM otp WHERE email=?", (email,)).fetchone()
        if r and time.time() - r["ts"] < 30: return False, None, "Vui lòng đợi 30 giây trước khi gửi lại mã", "wait"
        code = f"{secrets.randbelow(10**6):06d}"
        try: dev = _send(email, code)
        except MailNotConfigured: return False, None, "Máy chủ chưa cấu hình gửi email (SMTP)", "smtp_not_configured"
        except Exception: return False, None, "Không gửi được email, kiểm tra cấu hình SMTP", "smtp_error"
        c.execute("REPLACE INTO otp VALUES(?,?,?,?,0)", (email, _h(email, code), time.time() + 600, time.time()))
    return True, dev, None, None


def verify_code(email, code, default):
    with db() as c:
        r = c.execute("SELECT * FROM otp WHERE email=?", (email,)).fetchone()
        if not r or r["exp"] < time.time() or r["tries"] >= 5: return None
        if not secrets.compare_digest(r["h"], _h(email, code.strip())):
            c.execute("UPDATE otp SET tries=tries+1 WHERE email=?", (email,)); return None
        c.execute("DELETE FROM otp WHERE email=?", (email,))
        c.execute("INSERT OR IGNORE INTO users(email, created, state, tv) VALUES(?,?,?,0)", (email, time.time(), json.dumps(default)))
        tv = c.execute("SELECT tv FROM users WHERE email=?", (email,)).fetchone()["tv"] or 0
    return ser.dumps({"e": email, "v": tv})


def user_from_token(tok):
    try: d = ser.loads(tok, max_age=TOKEN_DAYS * 86400)
    except BadSignature: return None
    if not isinstance(d, dict) or not isinstance(d.get("e"), str): return None
    with db() as c: r = c.execute("SELECT tv FROM users WHERE email=?", (d["e"],)).fetchone()
    return d["e"] if r and (r["tv"] or 0) == d.get("v", 0) else None   # tài khoản không tồn tại / token đã bị thu hồi -> từ chối


def revoke_tokens(email):
    """Đăng xuất khỏi MỌI thiết bị: token cũ lập tức vô hiệu."""
    with db() as c: c.execute("UPDATE users SET tv = COALESCE(tv, 0) + 1 WHERE email=?", (email,))


def get_state(email, default):
    with db() as c:
        r = c.execute("SELECT state FROM users WHERE email=?", (email,)).fetchone()
    if not r: return copy.deepcopy(default)
    out = copy.deepcopy(default)
    for k, v in json.loads(r["state"]).items():
        # gộp 1 cấp với dict con (settings, ai, p): tài khoản cũ thiếu khóa mới vẫn có giá trị mặc định
        if isinstance(v, dict) and isinstance(out.get(k), dict): out[k].update(v)
        else: out[k] = v
    return out


def save_state(email, st):
    with db() as c: c.execute("UPDATE users SET state=? WHERE email=?", (json.dumps(st, ensure_ascii=False), email))


def _fernet():
    from cryptography.fernet import Fernet
    return Fernet(base64.urlsafe_b64encode(_sub("ai-key")))

def encrypt(s): return _fernet().encrypt(s.encode()).decode()
def decrypt(s): return _fernet().decrypt(s.encode()).decode()
def try_decrypt(s):
    """Trả về key gốc, hoặc None nếu không giải mã được (SECRET_KEY đã đổi / dữ liệu hỏng)."""
    try: return decrypt(s)
    except Exception: return None
