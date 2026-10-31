"""Chạy:  cd backend && python -m unittest discover -s tests -v   (không gọi mạng, dùng thư mục dữ liệu tạm)"""
import os, sys, tempfile, pathlib, unittest, json
os.environ.update(DATA_DIR=tempfile.mkdtemp(), SECRET_KEY="t" * 40, GEMINI_API_KEY="dummy-server-key-1234567890",
                  LLM_GUEST_DAILY_LIMIT="2", MAIL_DEV="1", TRUSTED_PROXIES="0")
os.environ.pop("CORS_ORIGINS", None)
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
import app as A, accounts, llm, ai_providers

ai_providers.complete = lambda *a, **k: "OK"   # không gọi mạng khi PUT /api/ai kiểm tra key

llm.ask = lambda text, cfg, profile="", **kw: {"topic": "Mechanics", "kind": "x", "diff": 2, "eq": text, "steps": [{"t": "a", "h": "<p>b</p>"}],
                                          "ans": "ok", "graph": None, "valid": True, "source": "llm"}
PROOF = "Giải thích hiện tượng vật lý con lắc đơn dao động " * 3


class Security(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c = A.app.test_client()
        r = cls.c.post("/api/auth/request", json={"email": "a@b.com"}).get_json()
        cls.tok = cls.c.post("/api/auth/verify", json={"email": "a@b.com", "code": r["dev_code"]}).get_json()
        cls.H = {"Authorization": "Bearer " + cls.tok["token"]}

    def test_1_guest_system_ai_is_limited_per_ip(self):
        res = [self.c.post("/api/solve", json={"text": PROOF}).get_json() for _ in range(5)]
        self.assertEqual([bool(r.get("valid")) for r in res], [True, True, False, False, False])

    def test_2_api_never_returns_key(self):
        self.c.put("/api/ai", json={"provider": "gemini", "key": "AIzaSyFAKEKEY1234567890"}, headers=self.H)
        blob = json.dumps([self.tok, self.c.get("/api/me", headers=self.H).get_json(), self.c.get("/api/ai", headers=self.H).get_json()])
        self.assertNotIn("AIzaSyFAKEKEY", blob)
        self.assertNotIn('"key"', blob)

    def test_3_forged_or_unknown_tokens_rejected(self):
        from itsdangerous import URLSafeTimedSerializer
        old = URLSafeTimedSerializer("t" * 40, salt="auth").dumps("ghost@x.com")
        self.assertEqual(self.c.get("/api/me", headers={"Authorization": "Bearer " + old}).status_code, 401)
        self.assertEqual(self.c.get("/api/me", headers={"Authorization": "Bearer " + accounts.ser.dumps({"e": "ghost@x.com", "v": 0})}).status_code, 401)

    def test_4_dev_code_not_exposed_behind_proxy(self):
        r = self.c.post("/api/auth/request", json={"email": "c@d.com"}, headers={"X-Forwarded-For": "1.2.3.4"}).get_json()
        self.assertTrue(r["ok"]); self.assertIsNone(r.get("dev_code"))

    def test_5_cors_not_wildcard(self):
        self.assertIsNone(self.c.get("/api/health", headers={"Origin": "https://evil.example"}).headers.get("Access-Control-Allow-Origin"))

    def test_6_zz_logout_revokes_token(self):
        self.assertEqual(self.c.post("/api/auth/logout", headers=self.H).status_code, 200)
        self.assertEqual(self.c.get("/api/me", headers=self.H).status_code, 401)

    def test_7_zzz_otp_requests_limited_per_ip(self):
        codes = [self.c.post("/api/auth/request", json={"email": f"u{i}@x.com"}).status_code for i in range(15)]
        self.assertIn(429, codes)


class KeySeparation(unittest.TestCase):
    def test_subkeys_differ(self):
        self.assertEqual(len({accounts._sub("token"), accounts._sub("otp"), accounts._sub("ai-key")}), 3)

    def test_mail_dev_off_by_default_refuses_without_smtp(self):
        import subprocess
        env = {k: v for k, v in os.environ.items() if k not in ("MAIL_DEV", "SMTP_HOST")}
        code = ("import accounts;print(accounts.request_code('x@y.com')[3])")
        out = subprocess.run([sys.executable, "-c", code], cwd=str(pathlib.Path(__file__).parent.parent), env=env, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=10).stdout.strip()
        self.assertEqual(out, "smtp_not_configured")

    def test_refuses_weak_or_placeholder_secret(self):
        import subprocess
        for bad in ("short", "doi-thanh-chuoi-ngau-nhien-dai-64-ky-tu-xxxxxxxxxxxxxxxxxxxxxxxx"):
            env = {**os.environ, "SECRET_KEY": bad}
            r = subprocess.run([sys.executable, "-c", "import accounts"], cwd=str(pathlib.Path(__file__).parent.parent), env=env, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=10)
            self.assertNotEqual(r.returncode, 0, bad)


if __name__ == "__main__":
    unittest.main()
