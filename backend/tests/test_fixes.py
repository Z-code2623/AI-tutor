"""Kiểm thử các lỗi đã sửa (lộ file tĩnh, CORS, quota /api/tutor, đầu vào sai, /api/recommend, gộp state)."""
import os, sys, tempfile, pathlib, unittest
os.environ.update(DATA_DIR=tempfile.mkdtemp(), SECRET_KEY="t" * 40, GEMINI_API_KEY="dummy-server-key-1234567890",
                  LLM_GUEST_DAILY_LIMIT="2", MAIL_DEV="1", TRUSTED_PROXIES="0")
os.environ.pop("CORS_ORIGINS", None)
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
import app as A, accounts, llm, ai_providers

ai_providers.complete = lambda *a, **k: "OK"
SEEN = []

llm.ask_tutor = lambda *a, **k: "ok"
def _ask(text, cfg, profile="", **kw):
    SEEN.append(cfg)
    return {"topic": "Mechanics", "kind": "x", "diff": 2, "steps": [{"t": "a", "h": "b"}], "ans": "ok", "valid": True}
llm.ask = _ask


class Fixes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        llm.ask = _ask   # test_security.py cũng gán llm.ask khi import; đặt lại để ghi nhận cfg
        cls.c = A.app.test_client()

    def test_static_does_not_leak_source_or_env(self):
        for p in ("/backend/app.py", "/backend/accounts.py", "/main.py", "/.env", "/.env.example", "/README.md", "/backend/data/.secret"):
            self.assertIn(self.c.get(p).status_code, (404, 405), p)   # 405 do route OPTIONS chung; quan trọng là KHÔNG phải 200

    def test_static_frontend_still_served(self):
        for p in ("/", "/css/style.css", "/js/api.js", "/js/main.js"):
            self.assertEqual(self.c.get(p).status_code, 200, p)
        self.assertEqual(self.c.get("/js/../backend/app.py").status_code, 404)

    def test_cors_exact_host_match(self):
        g = lambda o: self.c.get("/api/health", headers={"Origin": o}).headers.get("Access-Control-Allow-Origin")
        self.assertIsNone(g("http://localhost.evil.com"))
        self.assertIsNone(g("http://127.0.0.1.evil.com"))
        self.assertEqual(g("http://localhost:5000"), "http://localhost:5000")

    def test_recommend_works_and_bad_input_is_not_500(self):
        r = self.c.get("/api/recommend?level=1&n=3"); self.assertEqual(r.status_code, 200)
        data = r.get_json(); self.assertTrue(data and "id" in data[0]["p"] and "s" in data[0])
        self.assertEqual(self.c.get("/api/recommend?text=giải phương trình bậc hai&level=2").status_code, 200)
        self.assertEqual(self.c.get("/api/recommend?level=abc&n=-5").status_code, 200)
        self.assertEqual(self.c.get("/api/recommend?id=999999").status_code, 404)
        self.assertEqual(self.c.get("/api/recommend?id=abc").status_code, 404)

    def test_submit_validation(self):
        self.assertEqual(self.c.post("/api/submit", json={"topic": "Algebra", "diff": "abc"}).status_code, 200)
        self.assertEqual(self.c.post("/api/submit", json={"topic": "x" * 500}).status_code, 400)

    def test_submit_updates_mastery_for_account(self):
        r = self.c.post("/api/auth/request", json={"email": "m@m.com"}).get_json()
        tok = self.c.post("/api/auth/verify", json={"email": "m@m.com", "code": r["dev_code"]}).get_json()["token"]
        H = {"Authorization": "Bearer " + tok}
        before = self.c.get("/api/mastery", headers=H).get_json()["Calculus"]
        out = self.c.post("/api/submit", json={"topic": "Calculus", "correct": True, "diff": 2}, headers=H).get_json()
        self.assertGreater(out["p_known"], before)
        self.assertGreater(self.c.get("/api/mastery", headers=H).get_json()["Calculus"], before)

    def test_tutor_shares_account_quota_with_solve(self):
        r = self.c.post("/api/auth/request", json={"email": "q@q.com"}).get_json()
        tok = self.c.post("/api/auth/verify", json={"email": "q@q.com", "code": r["dev_code"]}).get_json()["token"]
        H = {"Authorization": "Bearer " + tok}
        old = A.LIMIT; A.LIMIT = 2
        try:
            codes = [self.c.post("/api/tutor", json={"question": "hi"}, headers=H).status_code for _ in range(4)]
            self.assertEqual(codes, [200, 200, 429, 429])
            res = self.c.post("/api/solve", json={"text": "Giải thích hiện tượng vật lý con lắc đơn dao động " * 3}, headers=H).get_json()
            self.assertTrue(res.get("limit"))
        finally:
            A.LIMIT = old

    def test_get_state_merges_missing_nested_keys(self):
        accounts.save_state  # noqa
        with accounts.db() as c:
            c.execute("INSERT OR IGNORE INTO users(email, created, state, tv) VALUES('old@x.com',0,?,0)", ('{"settings":{"llm":false},"ai":{}}',))
        st = accounts.get_state("old@x.com", A.DEFAULT)
        self.assertFalse(st["settings"]["llm"]); self.assertTrue(st["settings"]["dkt"]); self.assertEqual(st["ai"]["calls"], 0)

    def _login(self, email):
        r = self.c.post("/api/auth/request", json={"email": email}).get_json()
        tok = self.c.post("/api/auth/verify", json={"email": email, "code": r["dev_code"]}).get_json()["token"]
        return {"Authorization": "Bearer " + tok}

    def test_account_key_is_used_automatically_and_never_returned(self):
        H = self._login("k@k.com")
        PROOF = "Giải thích hiện tượng vật lý con lắc đơn dao động " * 3
        self.assertFalse(self.c.get("/api/ai", headers=H).get_json()["has_account_key"])
        self.assertEqual(self.c.put("/api/ai", json={"key": "short"}, headers=H).status_code, 400)
        self.assertEqual(self.c.put("/api/ai", json={"key": "AIzaSy-ACCOUNT-SECRET-1234"}, headers=H).status_code, 401 if False else 200)
        blob = str([self.c.get("/api/ai", headers=H).get_json(), self.c.get("/api/me", headers=H).get_json()])
        self.assertIn("'has_account_key': True", blob); self.assertNotIn("ACCOUNT-SECRET", blob)
        SEEN.clear()
        self.c.post("/api/solve", json={"text": PROOF}, headers=H)
        self.assertEqual(SEEN[-1]["key"], "AIzaSy-ACCOUNT-SECRET-1234")   # dùng AI của chính tài khoản, không phải key máy chủ
        # key lưu trong CSDL phải được mã hóa
        with accounts.db() as c: raw = c.execute("SELECT state FROM users WHERE email='k@k.com'").fetchone()[0]
        self.assertNotIn("ACCOUNT-SECRET", raw)
        # tài khoản khác không bị ảnh hưởng
        H2 = self._login("k2@k.com"); SEEN.clear()
        self.c.post("/api/solve", json={"text": PROOF}, headers=H2)
        self.assertEqual(SEEN[-1]["key"], os.environ["GEMINI_API_KEY"])
        # xóa key -> quay về AI máy chủ
        self.assertEqual(self.c.delete("/api/ai", headers=H).status_code, 200)
        self.assertFalse(self.c.get("/api/ai", headers=H).get_json()["has_account_key"])

    def test_put_ai_requires_login_and_rejects_bad_key(self):
        self.assertEqual(self.c.put("/api/ai", json={"key": "AIzaSy-whatever-1234"}).status_code, 401)
        H = self._login("bad@k.com")
        def boom(*a, **k):
            e = ai_providers.AIError("API key không hợp lệ"); e.code = 400; raise e
        old = ai_providers.complete; ai_providers.complete = boom
        try: self.assertEqual(self.c.put("/api/ai", json={"key": "AIzaSy-invalid-key-123"}, headers=H).status_code, 400)
        finally: ai_providers.complete = old
        self.assertFalse(self.c.get("/api/ai", headers=H).get_json()["has_account_key"])


if __name__ == "__main__":
    unittest.main()
