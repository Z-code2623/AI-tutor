"""Nạp file .env (backend/.env hoặc .env ở thư mục gốc) vào os.environ; dùng chung cho app.py và main.py."""
import os, pathlib

def load_env():
    for p in [pathlib.Path(__file__).parent / ".env", pathlib.Path(__file__).parent.parent / ".env"]:
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    # Strip inline comments if value is not wrapped in quotes
                    if v and not (v.startswith('"') or v.startswith("'")):
                        if " #" in v:
                            v = v.split(" #", 1)[0].strip()
                        elif "\t#" in v:
                            v = v.split("\t#", 1)[0].strip()
                    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                        v = v[1:-1]
                    if v and k not in os.environ:
                        os.environ[k] = v
            break
