"""Bộ giải liên môn Toán học, Vật lý & Hóa học từng bước cho 36 dạng bài; bổ sung đầy đủ khái niệm định luật và chuẩn hóa công thức KaTeX."""
import math, re
from fractions import Fraction

META = {
    # 12 Dạng Toán học
    "linear": ("Algebra", "Phương trình bậc 1", 1),
    "quad": ("Algebra", "Phương trình bậc 2", 2),
    "circle": ("Geometry", "Hình tròn", 2),
    "deriv": ("Calculus", "Đạo hàm", 3),
    "arith": ("Arithmetic", "Toán đố & Số học", 1),
    "system": ("Algebra", "Hệ phương trình", 2),
    "ineq": ("Algebra", "Bất phương trình", 2),
    "percent": ("Arithmetic", "Phần trăm", 1),
    "frac": ("Arithmetic", "Phân số", 2),
    "gcd": ("Arithmetic", "ƯCLN / BCNN", 1),
    "geom": ("Geometry", "Hình phẳng & Pythagore", 2),
    "integ": ("Calculus", "Nguyên hàm", 3),
    # 12 Dạng Vật lý
    "kinematics": ("Mechanics", "Chuyển động biến đổi đều", 1),
    "freefall": ("Mechanics", "Rơi tự do", 1),
    "newton2": ("Mechanics", "Định luật II Newton", 2),
    "work_power": ("Mechanics", "Công và Công suất", 2),
    "energy": ("Mechanics", "Động năng và Thế năng", 2),
    "gas_law": ("Thermodynamics", "Định luật chất khí (Boyle)", 2),
    "thermal": ("Thermodynamics", "Nhiệt lượng và Truyền nhiệt", 1),
    "ohm": ("Electromagnetism", "Định luật Ohm", 1),
    "elec_power": ("Electromagnetism", "Công suất & Điện năng", 2),
    "coulomb": ("Electromagnetism", "Lực tương tác Cu-lông", 2),
    "lens": ("Optics", "Thấu kính mỏng", 3),
    "refraction": ("Optics", "Khúc xạ ánh sáng", 2),
    # 12 Dạng Hóa học
    "chem_mol": ("GeneralChem", "Tính số mol & Khối lượng", 1),
    "chem_gas": ("GeneralChem", "Thể tích khí ĐKTC", 1),
    "chem_conc_mol": ("SolutionChem", "Nồng độ mol dung dịch CM", 2),
    "chem_conc_pct": ("SolutionChem", "Nồng độ phần trăm C%", 1),
    "chem_ph": ("SolutionChem", "Tính pH dung dịch", 2),
    "chem_eq": ("InorganicChem", "Cân bằng PTHH", 2),
    "chem_metal_acid": ("InorganicChem", "Kim loại tác dụng Axit", 2),
    "chem_mass_cons": ("GeneralChem", "Bảo toàn khối lượng", 1),
    "chem_yield": ("InorganicChem", "Hiệu suất phản ứng", 2),
    "chem_precip": ("InorganicChem", "Phản ứng tạo kết tủa", 2),
    "chem_elem_pct": ("GeneralChem", "Phần trăm khối lượng nguyên tố", 2),
    "chem_molar_mass": ("GeneralChem", "Khối lượng mol M", 1),
}

TOPIC_THEOREMS = {
    # 12 Dạng Toán học
    "linear": "Quy tắc chuyển vế và phép biến đổi tương đương ($ax + b = c \\iff x = \\frac{c - b}{a}$)",
    "quad": "Công thức nghiệm phương trình bậc 2 & Định lý Viète ($\\Delta = b^2 - 4ac$)",
    "circle": "Công thức chu vi và diện tích hình tròn ($C = 2\\pi r$, $S = \\pi r^2$)",
    "deriv": "Bảng đạo hàm cơ bản & Quy tắc tính đạo hàm đa thức ($(x^n)' = n x^{n-1}$)",
    "arith": "Các phép toán số học & Phương pháp giải toán đố",
    "system": "Phương pháp thế & Phương pháp cộng đại số giải hệ phương trình",
    "ineq": "Tính chất bất đẳng thức & Liên hệ giữa thứ tự và phép toán",
    "percent": "Công thức tính tỉ số phần trăm ($p\\% \\times N = \\frac{p}{100} \\times N$)",
    "frac": "Quy tắc quy đồng mẫu số và các phép tính phân số",
    "gcd": "Thuật toán Euclid tìm ước chung lớn nhất (ƯCLN)",
    "geom": "Định lý Pythagore trong tam giác vuông ($c^2 = a^2 + b^2$)",
    "integ": "Bảng nguyên hàm cơ bản & Định lý cơ bản của Giải tích ($\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$)",
    # 12 Dạng Vật lý
    "kinematics": "Chuyển động thẳng biến đổi đều ($v = v_0 + at$, $s = v_0 t + \\frac{1}{2}at^2$, $v^2 - v_0^2 = 2as$)",
    "freefall": "Định luật rơi tự do ($v = gt$, $h = \\frac{1}{2}gt^2$, $v = \\sqrt{2gh}$)",
    "newton2": "Định luật II Newton ($\\vec{F} = m \\cdot \\vec{a} \\iff F = m \\cdot a$)",
    "work_power": "Công cơ học & Công suất ($A = F \\cdot s \\cdot \\cos\\alpha$, $P = \\frac{A}{t} = F \\cdot v$)",
    "energy": "Định luật bảo toàn cơ năng trong trọng trường ($W = W_đ + W_t = \\frac{1}{2}mv^2 + mgh = \\text{const}$)",
    "gas_law": "Định luật Boyle - Mariotte cho quá trình đẳng nhiệt ($p_1 V_1 = p_2 V_2$)",
    "thermal": "Định luật I Nhiệt động lực học & Phương trình cân bằng nhiệt ($Q = m \\cdot c \\cdot \\Delta t$, $Q_{\\text{tỏa}} = Q_{\\text{thu}}$)",
    "ohm": "Định luật Ohm cho đoạn mạch ($I = \\frac{U}{R} \\iff U = I \\cdot R$)",
    "elec_power": "Định luật Joule - Lenz & Công suất điện ($P = U \\cdot I = I^2 R$, $A = P \\cdot t$)",
    "coulomb": "Định luật Cu-lông về tương tác tĩnh điện ($F = k \\cdot \\frac{|q_1 q_2|}{r^2}$)",
    "lens": "Công thức thấu kính mỏng & Số phóng đại ảnh ($\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d'}$, $k = -\\frac{d'}{d}$)",
    "refraction": "Định luật khúc xạ ánh sáng Snell - Descartes ($n_1 \\sin i = n_2 \\sin r$)",
    # 12 Dạng Hóa học
    "chem_mol": "Công thức chuyển đổi số mol và khối lượng ($n = \\frac{m}{M} \\iff m = n \\times M$)",
    "chem_gas": "Định luật Avogadro & Thể tích mol chất khí ở đktc ($V = n \\times 22{,}4\\text{ lít}$)",
    "chem_conc_mol": "Công thức nồng độ mol của dung dịch ($C_M = \\frac{n}{V}$)",
    "chem_conc_pct": "Công thức nồng độ phần trăm dung dịch ($C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%$)",
    "chem_ph": "Chỉ số pH và tích số ion của nước ($pH = -\\log[H^+]$, $[H^+][OH^-] = 10^{-14}$)",
    "chem_eq": "Định luật bảo toàn nguyên tố & Cân bằng phương trình hóa học",
    "chem_metal_acid": "Dãy hoạt động hóa học của kim loại ($M + nHCl \\to MCl_n + \\frac{n}{2}H_2\\uparrow$)",
    "chem_mass_cons": "Định luật bảo toàn khối lượng Lomonosov - Lavoisier ($\\sum m_{\\text{tham gia}} = \\sum m_{\\text{sản phẩm}}$)",
    "chem_yield": "Công thức hiệu suất phản ứng hóa học ($H\\% = \\frac{m_{\\text{thực tế}}}{m_{\\text{lý thuyết}}} \\times 100\\%$)",
    "chem_precip": "Điều kiện xảy ra phản ứng trao đổi ion trong dung dịch (tạo chất kết tủa)",
    "chem_elem_pct": "Phần trăm khối lượng của nguyên tố trong hợp chất ($\\%m_A = \\frac{x \\cdot M_A}{M_{A_x B_y}} \\times 100\\%$)",
    "chem_molar_mass": "Xác định kim loại qua khối lượng mol nguyên tử ($M = \\frac{m}{n}$)",
}

f = lambda n: str(int(round(n))) if abs(float(n) - round(float(n))) < 1e-5 else str(round(n, 3))
sg = lambda n: f"− {f(-n)}" if n < 0 else f"+ {f(n)}"
co = lambda s: 1 if s in ("", "+") else -1 if s == "-" else int(s)

# Tự động bọc $$ để KaTeX render công thức sắc nét, không bị lỗi raw text
def math_(h):
    s = str(h).strip()
    inner = s if s.startswith("$") else f"$${s}$$"
    return f'<div class="math">{inner}</div>'

def concept(title, desc):
    return f'<div class="concept"><b>{title}:</b> {desc}</div>'

def fr(q): return str(q.numerator) if q.denominator == 1 else f"{q.numerator}/{q.denominator}"
def numlist(text): return [float(x) for x in re.findall(r"\d+(?:\.\d+)?", text)]
def ok(h): return f'<div class="ok" style="font-size:20px">{h}</div>'
def sup(n): return "x" if n == 1 else "" if n == 0 else f"x^{n}"

def get_var(pattern, text, default=None):
    m = re.search(pattern, text, re.I)
    return float(m.group(1)) if m else default

# ---------- Toán học: Đa thức & Số học ----------
_TERM = re.compile(r"(\d+(?:\.\d+)?)?\*?(x(?:\^(\d+))?)?")

def parse_poly(expr):
    e = expr.replace(" ", "").replace("−", "-").replace("²", "^2").replace("³", "^3").replace("·", "*").lower().rstrip(".?;,")
    if not e or "^-" in e or "**" in e: return None
    e = re.sub(r'(\d+(?:\.\d+)?|\bx)\(', r'\g<1>*(', e)
    e = re.sub(r'\)([\dx])', r')*\g<1>', e)
    e = re.sub(r'\)\s*\(', r')*(', e)

    m_two = re.match(r'^\(([0-9x.+\-*]+)\)\*\(([0-9x.+\-*]+)\)$', e)
    if m_two:
        p1 = parse_poly(m_two.group(1))
        p2 = parse_poly(m_two.group(2))
        if p1 is not None and p2 is not None:
            res = {}
            for e1, c1 in p1.items():
                for e2, c2 in p2.items():
                    res[e1 + e2] = res.get(e1 + e2, Fraction(0)) + c1 * c2
            return {k: v for k, v in res.items() if v != 0} or {0: Fraction(0)}

    def expand_parens(s):
        pattern = re.compile(r'([+-]?\d*(?:\.\d+)?|\bx)\*?\(([0-9x.+\-*]+)\)')
        m = pattern.search(s)
        if not m: return s
        k_str, body = m.group(1), m.group(2)
        if "(" in body or ")" in body: return None
        is_x = "x" in k_str
        k_part = k_str.replace("x", "")
        k_val = Fraction(-1) if k_part == "-" else (Fraction(1) if k_part in ("", "+") else Fraction(k_part))

        parts = re.findall(r'([+-]?[^+-]+)', body if body.startswith(("+", "-")) else "+" + body)
        expanded = ""
        for p in parts:
            p = p.strip()
            if not p: continue
            sign = -1 if p.startswith("-") else 1
            p_body = p.lstrip("+-")
            if "x" in p_body:
                c_part = p_body.replace("x", "").replace("*", "")
                c = Fraction(c_part) if c_part else Fraction(1)
                term_c = k_val * sign * c
                term_exp = 2 if is_x else 1
                expanded += f"{'+' if term_c >= 0 else ''}{term_c}x^{term_exp}" if term_exp > 1 else f"{'+' if term_c >= 0 else ''}{term_c}x"
            else:
                d = Fraction(p_body)
                term_d = k_val * sign * d
                expanded += f"{'+' if term_d >= 0 else ''}{term_d}x" if is_x else f"{'+' if term_d >= 0 else ''}{term_d}"
        s = s[:m.start()] + ("+" + expanded if not expanded.startswith(("+", "-")) else expanded) + s[m.end():]
        return expand_parens(s)

    if "(" in e:
        e = expand_parens(e)
        if e is None: return None

    if not re.fullmatch(rf"[0-9a-zA-Z^+\-*./]+", e) or "^-" in e or "**" in e: return None
    if e[0] not in "+-": e = "+" + e
    vm = re.search(r"[a-zA-Z]", e)
    v = vm.group(0).lower() if vm else "x"
    term_re = re.compile(rf"^(\d+(?:\.\d+)?)?\*?({v}(?:\^(\d+))?)?$")
    out = {}
    for sign, body in re.findall(r"([+-])([^+-]+)", e):
        den = Fraction(1)
        if "/" in body:
            parts = body.split("/")
            if len(parts) != 2: return None
            body = parts[0]
            try: den = Fraction(parts[1])
            except Exception: return None
            if den == 0: return None
        m = term_re.fullmatch(body)
        if not body or not m or not (m.group(1) or m.group(2)): return None
        c = (Fraction(m.group(1)) if m.group(1) else Fraction(1)) / den
        n = (int(m.group(3)) if m.group(3) else 1) if m.group(2) else 0
        if n > 20: return None
        out[n] = out.get(n, 0) + (c if sign == "+" else -c)
    return {k: v for k, v in out.items() if v != 0} or {0: Fraction(0)}

def poly_sub(a, b):
    r = dict(a)
    for k, v in b.items(): r[k] = r.get(k, 0) - v
    return {k: v for k, v in r.items() if v != 0}

def _coef(q):
    q = Fraction(q)
    return str(q.numerator) if q.denominator == 1 else f"{q.numerator}/{q.denominator}"

def fmt_poly(poly, v="x"):
    parts = []
    for n in sorted(poly, reverse=True):
        q = poly[n]
        if q == 0: continue
        num, den = abs(q.numerator), q.denominator
        var = "" if n == 0 else (v if n == 1 else f"{v}^{n}")
        body = (str(num) if (num != 1 or n == 0) else "") + var + (f"/{den}" if den != 1 else "")
        parts.append(("−" if q < 0 else "+", body))
    if not parts: return "0"
    first = ("−" if parts[0][0] == "−" else "") + parts[0][1]
    return first + "".join(f" {s} {b}" for s, b in parts[1:])

def poly_expr_from_text(text):
    t = text.strip()
    if re.search(r"[a-zA-Z]\s*(?:\(\s*x\s*\))?\s*['′’]\s*(?:\(\s*x\s*\))?\s*=", t): return None
    if "=" in t: t = t.rsplit("=", 1)[1]
    elif re.search(r"\bcủa\b", t, re.I): t = re.split(r"\bcủa\b", t, flags=re.I)[-1]
    return parse_poly(t)

def safe_arith(text):
    import ast, operator as op
    t = text.lower().replace("×", "*").replace("÷", "/").replace(":", "/").replace("−", "-").replace(",", ".")
    t = re.sub(r"^[^0-9(\-]*", "", t); t = re.sub(r"[=?\s]*$", "", t).replace(" ", "")
    if not t or not re.fullmatch(r"[0-9.+\-*/()]+", t) or not re.search(r"\d\s*[-+*/]", t): return None
    ops = {ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul, ast.Div: op.truediv}
    def ev(n):
        if isinstance(n, ast.Expression): return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)) and not isinstance(n.value, bool): return Fraction(str(n.value))
        if isinstance(n, ast.BinOp) and type(n.op) in ops: return ops[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.UAdd)): return -ev(n.operand) if isinstance(n.op, ast.USub) else ev(n.operand)
        raise ValueError("bad")
    try: return ev(ast.parse(t, mode="eval"))
    except Exception: return None

def poly_equation(t):
    if t.count("=") != 1: return None
    l, r = t.split("=")
    vm = re.search(r"[a-zA-Z]", t)
    v = vm.group(0).lower() if vm else "x"
    L, R = parse_poly(l), parse_poly(r)
    if L is None or R is None: return None
    P = poly_sub(L, R); deg = max(P) if P else 0
    if deg > 2: return None
    a, b, c = P.get(2, Fraction(0)), P.get(1, Fraction(0)), P.get(0, Fraction(0))
    eq = f"{fmt_poly(P, v) if P else '0'} = 0"
    steps = [
        {"t": "Đưa về dạng chuẩn", "h": math_(eq) + concept("Quy tắc chuyển vế", f"Chuyển toàn bộ các hạng tử về vế trái và đổi dấu để đưa phương trình về dạng tổng quát $a{v}^2 + b{v} + c = 0$.")}
    ]
    if deg == 0:
        ans = f"Vô số nghiệm (mọi {v} đều thỏa)" if not P else "Vô nghiệm"
        steps.append({"t": "Kết luận", "h": ok(ans)}); return ans, steps
    if deg == 1:
        x = -c / b; ans = f"{v} = {_coef(x)}"
        steps += [
            {"t": "Giải phương trình bậc nhất", "h": math_(f"{v} = \\frac{{-c}}{{b}} = \\frac{{{_coef(-c)}}}{{{_coef(b)}}} = {_coef(x)}") + concept("Nghiệm phương trình bậc nhất", f"Phương trình dạng $b{v} + c = 0$ ($b \\neq 0$) luôn có nghiệm duy nhất ${v} = -c/b$.")},
            {"t": "Kết luận", "h": ok(ans)}
        ]
        return ans, steps
    d = b * b - 4 * a * c
    steps.append({
        "t": "Xác định hệ số và tính biệt thức Δ",
        "h": math_(f"a = {_coef(a)}, \\; b = {_coef(b)}, \\; c = {_coef(c)} \\\\ \\Delta = b^2 - 4ac = ({_coef(b)})^2 - 4({_coef(a)})({_coef(c)}) = {_coef(d)}")
             + concept("Định lý về dấu biệt thức Delta", "Nếu $\\Delta > 0$ phương trình có 2 nghiệm phân biệt; $\\Delta = 0$ có nghiệm kép; $\\Delta < 0$ phương trình vô nghiệm thực.")
    })
    if d < 0:
        ans = "Vô nghiệm thực"
        steps.append({"t": "Kết luận", "h": "<p>Do $\\Delta < 0$ nên phương trình không có nghiệm thực.</p>" + ok(ans)})
        return ans, steps
    sq = math.isqrt(int(d)) if d.denominator == 1 and d >= 0 else None
    if d == 0:
        x1 = -b / (2 * a); ans = f"{v} = {_coef(x1)}"
        steps.append({"t": "Nghiệm kép", "h": math_(f"{v}_1 = {v}_2 = -\\frac{{b}}{{2a}} = {_coef(x1)}") + ok(ans)})
    elif sq is not None and sq * sq == d:
        x1, x2 = sorted([(-b + sq) / (2 * a), (-b - sq) / (2 * a)])
        ans = f"{v}₁ = {_coef(x1)}, {v}₂ = {_coef(x2)}"
        steps.append({"t": "Tính hai nghiệm phân biệt", "h": math_(f"{v} = \\frac{{-b \\pm \\sqrt{{\\Delta}}}}{{2a}} \\implies {v}_1 = {_coef(x1)}, \\; {v}_2 = {_coef(x2)}") + ok(ans)})
    else:
        s = math.sqrt(float(d))
        x1, x2 = sorted([(-float(b) + s) / (2 * float(a)), (-float(b) - s) / (2 * float(a))])
        ans = f"{v}₁ ≈ {f(x1)}, {v}₂ ≈ {f(x2)}"
        steps.append({"t": "Tính hai nghiệm phân biệt", "h": math_(f"x = \\frac{{-b \\pm \\sqrt{{\\Delta}}}}{{2a}} \\implies x_1 \\approx {f(x1)}, \\; x_2 \\approx {f(x2)}") + ok(ans)})
    return ans, steps


def solve(text, label):
    topic, kind, diff = META.get(label, ("Algebra", "Bài tập", 1))
    core = text.strip()
    if any(c in core for c in [":", "\n"]):
        core = re.split(r"[:\n]", core)[-1].strip()
    elif re.search(r"biết\b", core, re.I):
        core = re.split(r"biết\b", core, flags=re.I)[-1].strip()
    elif re.search(r"\btrình\b", core, re.I):
        core = re.split(r"\btrình\b", core, flags=re.I)[-1].strip()
    elif re.search(r"\btoán\b", core, re.I):
        core = re.split(r"\btoán\b", core, flags=re.I)[-1].strip()
    t = core.replace(" ", "").replace("−", "-").replace("²", "^2").lower()
    res = {"topic": topic, "kind": kind, "diff": diff, "label": label,
           "theorem": TOPIC_THEOREMS.get(label, ""),
           "eq": core if label in ("linear", "quad", "system", "ineq") else text.strip(),
           "steps": [], "ans": None, "graph": None, "valid": False}
    steps = res["steps"]
    t_lower = text.lower()

    # ==================== PHẦN 1: BÀI TẬP VẬT LÝ ====================
    # 1. Chuyển động biến đổi đều
    if label == "kinematics":
        v0 = get_var(r"v(?:_?0|o)?\s*=\s*(-?\d+(?:\.\d+)?)", text, default=0.0)
        a = get_var(r"\ba\s*=\s*(-?\d+(?:\.\d+)?)", text)
        t_v = get_var(r"\bt\s*=\s*(\d+(?:\.\d+)?)", text)
        v = get_var(r"\bv\s*=\s*(-?\d+(?:\.\d+)?)", text)
        if a is not None and t_v is not None:
            v_end = v0 + a * t_v; s_val = v0 * t_v + 0.5 * a * (t_v ** 2); ans = f"v = {f(v_end)} m/s, s = {f(s_val)} m"
            res.update(valid=True, ans=ans, graph={"type": "kinematics", "v0": v0, "a": a, "t": t_v, "v": v_end})
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"v_0 = {f(v0)} \\text{{ m/s}}, \\quad a = {f(a)} \\text{{ m/s}}^2, \\quad t = {f(t_v)} \\text{{ s}}")
                 + concept("Khái niệm Chuyển động biến đổi đều", "Là chuyển động có gia tốc $a = \\text{const}$. Khi $a$ cùng chiều vận tốc ($a \\cdot v > 0$) là nhanh dần đều, ngược chiều là chậm dần đều.")},
                {"t": "Tính vận tốc tức thời v", "h": math_(f"v = v_0 + at = {f(v0)} + ({f(a)}) \\cdot {f(t_v)} = {f(v_end)} \\text{{ m/s}}")
                 + concept("Phương trình vận tốc", "Vận tốc tức thời biến thiên tuyến tính theo thời gian: $v = v_0 + at$. Đơn vị chuẩn: mét trên giây $(\\text{m/s})$.")},
                {"t": "Tính quãng đường đi được s", "h": math_(f"s = v_0 t + \\frac{{1}}{{2}} a t^2 = {f(v0)} \\cdot {f(t_v)} + 0.5 \\cdot ({f(a)}) \\cdot ({f(t_v)})^2 = {f(s_val)} \\text{{ m}}")
                 + concept("Phương trình quãng đường", "Quãng đường phụ thuộc hàm bậc 2 của thời gian: $s = v_0 t + \\frac{1}{2} a t^2$. Đơn vị chuẩn: mét $(\\text{m})$.")},
                {"t": "Kết luận đáp số", "h": ok(ans)}
            ]
        elif v is not None and a is not None and a != 0:
            t_val = (v - v0) / a; s_val = (v ** 2 - v0 ** 2) / (2 * a); ans = f"t = {f(t_val)} s, s = {f(s_val)} m"
            res.update(valid=True, ans=ans, graph={"type": "kinematics", "v0": v0, "a": a, "t": t_val, "v": v})
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"v_0 = {f(v0)} \\text{{ m/s}}, \\quad v = {f(v)} \\text{{ m/s}}, \\quad a = {f(a)} \\text{{ m/s}}^2")},
                {"t": "Tính thời gian chuyển động t", "h": math_(f"t = \\frac{{v - v_0}}{{a}} = \\frac{{{f(v)} - {f(v0)}}}{{{f(a)}}} = {f(t_val)} \\text{{ s}}")},
                {"t": "Tính quãng đường s theo hệ thức độc lập", "h": math_(f"s = \\frac{{v^2 - v_0^2}}{{2a}} = \\frac{{{f(v)}^2 - {f(v0)}^2}}{{2 \\cdot {f(a)}}} = {f(s_val)} \\text{{ m}}")
                 + concept("Hệ thức độc lập thời gian", "Công thức $v^2 - v_0^2 = 2as$ liên hệ trực tiếp giữa vận tốc, gia tốc và quãng đường mà không cần qua biến thời gian.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 2. Rơi tự do
    elif label == "freefall":
        g = get_var(r"\bg\s*=\s*(\d+(?:\.\d+)?)", text, default=9.8 if "9.8" in text else 10.0)
        h = get_var(r"\bh\s*=\s*(\d+(?:\.\d+)?)", text)
        t_v = get_var(r"\bt\s*=\s*(\d+(?:\.\d+)?)", text)
        if h is not None:
            t_val = math.sqrt(2 * h / g); v_val = math.sqrt(2 * g * h); ans = f"t = {f(t_val)} s, v = {f(v_val)} m/s"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"h = {f(h)} \\text{{ m}}, \\quad g = {f(g)} \\text{{ m/s}}^2")
                 + concept("Định luật rơi tự do", "Sự rơi tự do là sự rơi chỉ dưới tác dụng của trọng lực. Chuyển động thẳng nhanh dần đều theo phương thẳng đứng từ trên xuống dưới với gia tốc trọng trường $g$.")},
                {"t": "Tính thời gian rơi t", "h": math_(f"t = \\sqrt{{\\frac{{2h}}{{g}}}} = \\sqrt{{\\frac{{2 \\cdot {f(h)}}}{{{f(g)}}}}} = {f(t_val)} \\text{{ s}}")
                 + concept("Công thức thời gian rơi", "Rút ra từ phương trình độ cao $h = \\frac{1}{2}gt^2 \\implies t = \\sqrt{\\frac{2h}{g}}$. Thời gian rơi chỉ phụ thuộc vào độ cao $h$ và gia tốc $g$, không phụ thuộc vào khối lượng của vật.")},
                {"t": "Tính vận tốc chạm đất v", "h": math_(f"v = gt = \\sqrt{{2gh}} = \\sqrt{{2 \\cdot {f(g)} \\cdot {f(h)}}} = {f(v_val)} \\text{{ m/s}}")
                 + concept("Vận tốc tức thời khi chạm đất", "Vận tốc rơi tự do tăng tỉ lệ thuận với thời gian rơi: $v = gt = \\sqrt{2gh}$. Đơn vị chuẩn: mét trên giây $(\\text{m/s})$.")},
                {"t": "Kết luận đáp số", "h": ok(ans)}
            ]
        elif t_v is not None:
            h_val = 0.5 * g * (t_v ** 2); v_val = g * t_v; ans = f"h = {f(h_val)} m, v = {f(v_val)} m/s"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"t = {f(t_v)} \\text{{ s}}, \\quad g = {f(g)} \\text{{ m/s}}^2")
                 + concept("Khái niệm rơi tự do", "Chuyển động thẳng nhanh dần đều không vận tốc đầu ($v_0 = 0$) dưới tác dụng của trọng trường.")},
                {"t": "Tính độ cao thả rơi h", "h": math_(f"h = \\frac{{1}}{{2}} g t^2 = 0.5 \\cdot {f(g)} \\cdot ({f(t_v)})^2 = {f(h_val)} \\text{{ m}}")},
                {"t": "Tính vận tốc chạm đất v", "h": math_(f"v = g \\cdot t = {f(g)} \\cdot {f(t_v)} = {f(v_val)} \\text{{ m/s}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 3. Định luật II Newton
    elif label == "newton2":
        F = get_var(r"\bF\s*=\s*(-?\d+(?:\.\d+)?)", text)
        m_v = get_var(r"\bm\s*=\s*(\d+(?:\.\d+)?)", text)
        a = get_var(r"\ba\s*=\s*(-?\d+(?:\.\d+)?)", text)
        if F is not None and m_v is not None and m_v > 0:
            a_val = F / m_v; ans = f"a = {f(a_val)} m/s²"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"F = {f(F)} \\text{{ N}}, \\quad m = {f(m_v)} \\text{{ kg}}")
                 + concept("Phát biểu Định luật II Newton", "Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật: $\\vec{a} = \\frac{\\vec{F}}{m}$.")},
                {"t": "Áp dụng định luật II Newton", "h": math_(f"a = \\frac{{F}}{{m}} = \\frac{{{f(F)}}}{{{f(m_v)}}} = {f(a_val)} \\text{{ m/s}}^2")
                 + concept("Ý nghĩa vật lý của quán tính", "Khối lượng $m$ đặc trưng cho mức quán tính của vật (khả năng bảo toàn vận tốc). Đơn vị chuẩn: Lực $F$ đo bằng Newton $(\\text{N})$, khối lượng $m$ đo bằng $(\\text{kg})$, gia tốc $a$ đo bằng $(\\text{m/s}^2)$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif m_v is not None and a is not None:
            F_val = m_v * a; ans = f"F = {f(F_val)} N"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"m = {f(m_v)} \\text{{ kg}}, \\quad a = {f(a)} \\text{{ m/s}}^2")},
                {"t": "Tính độ lớn hợp lực tác dụng", "h": math_(f"F = m \\cdot a = {f(m_v)} \\cdot {f(a)} = {f(F_val)} \\text{{ N}}")
                 + concept("Công thức Định luật II Newton", "Lực tác dụng làm biến đổi trạng thái chuyển động của vật: $F = m \\cdot a$. $1\\text{ N} = 1\\text{ kg}\\cdot\\text{m/s}^2$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 4. Công và Công suất
    elif label == "work_power":
        F = get_var(r"\bF\s*=\s*(\d+(?:\.\d+)?)", text)
        s = get_var(r"\bs\s*=\s*(\d+(?:\.\d+)?)", text)
        t_v = get_var(r"\bt\s*=\s*(\d+(?:\.\d+)?)", text)
        alpha = get_var(r"(?:góc|alpha|α)\s*=\s*(\d+(?:\.\d+)?)", text, default=0.0)
        if F is not None and s is not None:
            rad = math.radians(alpha)
            A = F * s * math.cos(rad)
            if t_v is not None and t_v > 0:
                P = A / t_v; ans = f"A = {f(A)} J, P = {f(P)} W"
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"F = {f(F)} \\text{{ N}}, \\; s = {f(s)} \\text{{ m}}, \\; \\alpha = {f(alpha)}^\\circ, \\; t = {f(t_v)} \\text{{ s}}")
                     + concept("Khái niệm Công cơ học", "Công là đại lượng đo bằng tích của lực tác dụng, quãng đường dịch chuyển và cosin góc hợp giữa lực và hướng chuyển động: $A = F \\cdot s \\cdot \\cos\\alpha$. Đơn vị: Jun $(\\text{J})$.")},
                    {"t": "Tính công cơ học A", "h": math_(f"A = F \\cdot s \\cdot \\cos({f(alpha)}^\\circ) = {f(F)} \\cdot {f(s)} \\cdot \\cos({f(alpha)}^\\circ) = {f(A)} \\text{{ J}}")},
                    {"t": "Tính công suất P", "h": math_(f"P = \\frac{{A}}{{t}} = \\frac{{{f(A)}}}{{{f(t_v)}}} = {f(P)} \\text{{ W}}")
                     + concept("Khái niệm Công suất", "Công suất $P = A/t$ là đại lượng đặc trưng cho tốc độ sinh công trong một đơn vị thời gian. Đơn vị: Oát $(\\text{W})$ ($1\\text{ W} = 1\\text{ J/s}$).")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]
            else:
                ans = f"A = {f(A)} J"
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"F = {f(F)} \\text{{ N}}, \\; s = {f(s)} \\text{{ m}}, \\; \\alpha = {f(alpha)}^\\circ")},
                    {"t": "Tính công cơ học A", "h": math_(f"A = F \\cdot s \\cdot \\cos({f(alpha)}^\\circ) = {f(A)} \\text{{ J}}")
                     + concept("Biện luận công", "Nếu $\\alpha = 0^\\circ$, lực cùng hướng chuyển động, công sinh ra đạt cực đại: $A = F \\cdot s$.")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]
            res.update(valid=True, ans=ans)

    # 5. Động năng, Thế năng & Cơ năng
    elif label == "energy":
        m_v = get_var(r"\bm\s*=\s*(\d+(?:\.\d+)?)", text)
        v = get_var(r"\bv\s*=\s*(\d+(?:\.\d+)?)", text)
        h = get_var(r"\bh\s*=\s*(\d+(?:\.\d+)?)", text)
        g = get_var(r"\bg\s*=\s*(\d+(?:\.\d+)?)", text, default=10.0)
        if m_v is not None:
            Wd = (0.5 * m_v * (v ** 2)) if v is not None else None
            Wt = (m_v * g * h) if h is not None else None
            if Wd is not None and Wt is not None:
                W = Wd + Wt; ans = f"Wđ = {f(Wd)} J, Wt = {f(Wt)} J, W = {f(W)} J"
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"m = {f(m_v)} \\text{{ kg}}, \\; v = {f(v)} \\text{{ m/s}}, \\; h = {f(h)} \\text{{ m}}, \\; g = {f(g)} \\text{{ m/s}}^2")},
                    {"t": "Tính động năng Wđ", "h": math_(f"W_đ = \\frac{{1}}{{2}} m v^2 = 0.5 \\cdot {f(m_v)} \\cdot ({f(v)})^2 = {f(Wd)} \\text{{ J}}")
                     + concept("Khái niệm Động năng", "Động năng là dạng năng lượng mà vật có được do chuyển động: $W_đ = \\frac{1}{2}mv^2$. Động năng luôn không âm và tỉ lệ với bình phương vận tốc.")},
                    {"t": "Tính thế năng trọng trường Wt", "h": math_(f"W_t = m g h = {f(m_v)} \\cdot {f(g)} \\cdot {f(h)} = {f(Wt)} \\text{{ J}}")
                     + concept("Khái niệm Thế năng trọng trường", "Thế năng trọng trường là năng lượng tương tác giữa vật và Trái Đất: $W_t = mgh$.")},
                    {"t": "Tính cơ năng toàn phần W", "h": math_(f"W = W_đ + W_t = {f(Wd)} + {f(Wt)} = {f(W)} \\text{{ J}}")
                     + concept("Định luật Bảo toàn cơ năng", "Trong trường trọng lực bỏ qua ma sát và lực cản, cơ năng toàn phần của vật được bảo toàn: $W = W_đ + W_t = \\text{const}$.")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]
                res.update(valid=True, ans=ans)
            elif Wd is not None:
                ans = f"Wđ = {f(Wd)} J"; res.update(valid=True, ans=ans)
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"m = {f(m_v)} \\text{{ kg}}, \\; v = {f(v)} \\text{{ m/s}}")},
                    {"t": "Tính động năng", "h": math_(f"W_đ = \\frac{{1}}{{2}} m v^2 = {f(Wd)} \\text{{ J}}")
                     + concept("Công thức Động năng", "Năng lượng động lực học: $W_đ = \\frac{1}{2}mv^2$. Đơn vị: Jun $(\\text{J})$.")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]

    # 6. Định luật Boyle
    elif label == "gas_law":
        p1 = get_var(r"p_?1\s*=\s*(\d+(?:\.\d+)?)", text)
        v1 = get_var(r"V_?1\s*=\s*(\d+(?:\.\d+)?)", text)
        p2 = get_var(r"p_?2\s*=\s*(\d+(?:\.\d+)?)", text)
        v2 = get_var(r"V_?2\s*=\s*(\d+(?:\.\d+)?)", text)
        if p1 is not None and v1 is not None and v2 is not None and v2 > 0:
            p2_val = (p1 * v1) / v2; ans = f"p₂ = {f(p2_val)} atm"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt trạng thái khí", "h": math_(f"p_1 = {f(p1)} \\text{{ atm}}, \\; V_1 = {f(v1)} \\text{{ lít}}, \\; V_2 = {f(v2)} \\text{{ lít}}")
                 + concept("Phát biểu Định luật Boyle - Mariotte", "Trong quá trình đẳng nhiệt của một lượng khí xác định ($T = \\text{const}$), áp suất $p$ tỉ lệ nghịch với thể tích $V$: $p_1 V_1 = p_2 V_2$.")},
                {"t": "Tính áp suất p2", "h": math_(f"p_2 = \\frac{{p_1 V_1}}{{V_2}} = \\frac{{{f(p1)} \\cdot {f(v1)}}}{{{f(v2)}}} = {f(p2_val)} \\text{{ atm}}")
                 + concept("Ý nghĩa nhiệt động lực học", "Khi thể tích khí bị nén giảm đi, mật độ phân tử khí tăng lên làm số va chạm vào thành bình tăng, áp suất khí tăng tương ứng.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif p1 is not None and v1 is not None and p2 is not None and p2 > 0:
            v2_val = (p1 * v1) / p2; ans = f"V₂ = {f(v2_val)} lít"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt trạng thái khí", "h": math_(f"p_1 = {f(p1)} \\text{{ atm}}, \\; V_1 = {f(v1)} \\text{{ lít}}, \\; p_2 = {f(p2)} \\text{{ atm}}")},
                {"t": "Tính thể tích V2", "h": math_(f"V_2 = \\frac{{p_1 V_1}}{{p_2}} = \\frac{{{f(p1)} \\cdot {f(v1)}}}{{{f(p2)}}} = {f(v2_val)} \\text{{ lít}}")
                 + concept("Định luật Boyle", "$p_1 V_1 = p_2 V_2 \\implies V_2 = \\frac{p_1 V_1}{p_2}$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 7. Nhiệt lượng & Truyền nhiệt
    elif label == "thermal":
        m_v = get_var(r"\bm\s*=\s*(\d+(?:\.\d+)?)", text)
        c = get_var(r"\bc\s*=\s*(\d+(?:\.\d+)?)", text, default=4200.0 if "nước" in t_lower else None)
        t1 = get_var(r"t_?1\s*=\s*(-?\d+(?:\.\d+)?)", text)
        t2 = get_var(r"t_?2\s*=\s*(-?\d+(?:\.\d+)?)", text)
        dt = get_var(r"(?:delta_?t|Δt)\s*=\s*(\d+(?:\.\d+)?)", text)
        if dt is None and t1 is not None and t2 is not None: dt = abs(t2 - t1)
        if m_v is not None and c is not None and dt is not None:
            Q = m_v * c * dt; ans = f"Q = {f(Q)} J ({f(Q/1000)} kJ)"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"m = {f(m_v)} \\text{{ kg}}, \\; c = {f(c)} \\text{{ J/(kg\\cdot K)}}, \\; \\Delta t = {f(dt)}^\\circ\\text{{C}}")
                 + concept("Khái niệm Nhiệt lượng", "Nhiệt lượng là phần nhiệt năng mà vật nhận được hay mất đi trong quá trình truyền nhiệt: $Q = m \\cdot c \\cdot \\Delta t$.")},
                {"t": "Tính nhiệt lượng cần cung cấp", "h": math_(f"Q = m \\cdot c \\cdot \\Delta t = {f(m_v)} \\cdot {f(c)} \\cdot {f(dt)} = {f(Q)} \\text{{ J}} = {f(Q/1000)} \\text{{ kJ}}")
                 + concept("Ý nghĩa nhiệt dung riêng c", "Đại lượng $c$ đặc trưng cho khả năng tích nhiệt của chất. Nhiệt lượng $1\\text{ kJ} = 1000\\text{ J}$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 8. Định luật Ohm
    elif label == "ohm":
        U = get_var(r"\bU\s*=\s*(\d+(?:\.\d+)?)", text)
        R = get_var(r"\bR\s*=\s*(\d+(?:\.\d+)?)", text)
        I = get_var(r"\bI\s*=\s*(\d+(?:\.\d+)?)", text)
        if U is not None and R is not None and R > 0:
            I_val = U / R; ans = f"I = {f(I_val)} A"; res.update(valid=True, ans=ans, graph={"type": "circuit", "U": U, "R": R, "I": I_val})
            steps += [
                {"t": "Tóm tắt mạch điện", "h": math_(f"U = {f(U)} \\text{{ V}}, \\quad R = {f(R)} \\; \\Omega")
                 + concept("Phát biểu Định luật Ohm", "Cường độ dòng điện $I$ chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế $U$ đặt vào hai đầu dây và tỉ lệ nghịch với điện trở $R$: $I = \\frac{U}{R}$.")},
                {"t": "Tính cường độ dòng điện I", "h": math_(f"I = \\frac{{U}}{{R}} = \\frac{{{f(U)}}}{{{f(R)}}} = {f(I_val)} \\text{{ A}}")
                 + concept("Ý nghĩa các đại lượng điện", "Điện trở $R$ biểu thị mức độ cản trở dòng điện của vật dẫn. Đơn vị chuẩn: Ampe $(\\text{A})$, Vôn $(\\text{V})$, Ôm $(\\Omega)$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif I is not None and R is not None:
            U_val = I * R; ans = f"U = {f(U_val)} V"; res.update(valid=True, ans=ans, graph={"type": "circuit", "U": U_val, "R": R, "I": I})
            steps += [
                {"t": "Tóm tắt mạch điện", "h": math_(f"I = {f(I)} \\text{{ A}}, \\quad R = {f(R)} \\; \\Omega")},
                {"t": "Tính hiệu điện thế U", "h": math_(f"U = I \\cdot R = {f(I)} \\cdot {f(R)} = {f(U_val)} \\text{{ V}}")
                 + concept("Hệ thức Định luật Ohm", "Từ $I = U/R$ suy ra $U = I \\cdot R$. Hiệu điện thế là nguyên nhân tạo ra dòng điện.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 9. Công suất điện & Điện năng tiêu thụ
    elif label == "elec_power":
        U = get_var(r"\bU\s*=\s*(\d+(?:\.\d+)?)", text)
        I = get_var(r"\bI\s*=\s*(\d+(?:\.\d+)?)", text)
        P = get_var(r"\bP\s*=\s*(\d+(?:\.\d+)?)", text)
        t_v = get_var(r"\bt\s*=\s*(\d+(?:\.\d+)?)", text)
        if P is None and U is not None and I is not None: P = U * I
        if P is not None and t_v is not None:
            is_hour = "giờ" in t_lower or "h" in text
            t_sec = t_v * 3600 if is_hour else t_v
            A_joule = P * t_sec; A_kwh = (P * (t_v if is_hour else t_v / 3600)) / 1000
            ans = f"P = {f(P)} W, A = {f(A_joule)} J ({f(A_kwh)} kWh)"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"P = {f(P)} \\text{{ W}}, \\; t = {f(t_v)} \\text{{ {'giờ' if is_hour else 'giây'}}}")
                 + concept("Khái niệm Công suất & Điện năng", "Công suất $P = U \\cdot I$ biểu thị tốc độ tiêu thụ điện. Điện năng tiêu thụ là lượng năng lượng điện chuyển hóa thành các dạng năng lượng khác: $A = P \\cdot t$.")},
                {"t": "Tính điện năng tiêu thụ A", "h": math_(f"A = P \\cdot t = {f(P)} \\cdot {f(t_sec)} = {f(A_joule)} \\text{{ J}} = {f(A_kwh)} \\text{{ kWh}}")
                 + concept("Đổi đơn vị điện năng", "$1\\text{ kWh} = 1000\\text{ W} \\times 3600\\text{ s} = 3{,}6 \\cdot 10^6\\text{ J}$. Đây chính là số đếm của công tơ điện trong sinh hoạt gia đình.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 10. Lực Cu-lông
    elif label == "coulomb":
        q1_m = re.search(r"q_?1\s*=\s*(-?\d+(?:\.\d+)?(?:e-?\d+)?)", text, re.I)
        q2_m = re.search(r"q_?2\s*=\s*(-?\d+(?:\.\d+)?(?:e-?\d+)?)", text, re.I)
        r = get_var(r"\br\s*=\s*(\d+(?:\.\d+)?)", text)
        if q1_m and q2_m and r is not None and r > 0:
            q1 = float(q1_m.group(1)); q2 = float(q2_m.group(1))
            F = 9e9 * abs(q1 * q2) / (r ** 2); nature = "Lực đẩy" if q1 * q2 > 0 else "Lực hút"
            ans = f"F = {F:.4g} N ({nature})"; res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"|q_1| = {abs(q1):.2e} \\text{{ C}}, \\; |q_2| = {abs(q2):.2e} \\text{{ C}}, \\; r = {f(r)} \\text{{ m}}")
                 + concept("Phát biểu Định luật Cu-lông", "Lực tương tác tĩnh điện giữa hai điện tích điểm trong chân không tỉ lệ thuận với tích độ lớn hai điện tích và tỉ lệ nghịch với bình phương khoảng cách giữa chúng: $F = k\\frac{|q_1 q_2|}{r^2}$.")},
                {"t": "Tính độ lớn lực tương tác tĩnh điện", "h": math_(f"F = 9 \\cdot 10^9 \\cdot \\frac{{{abs(q1):.2e} \\cdot {abs(q2):.2e}}}{{{f(r)}^2}} = {F:.4g} \\text{{ N}}")
                 + concept("Quy tắc tương tác điện", "Hai điện tích cùng dấu thì đẩy nhau; hai điện tích trái dấu thì hút nhau. Hằng số tĩnh điện $k = 9\\cdot 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 11. Thấu kính mỏng
    elif label == "lens":
        f_val = get_var(r"\bf\s*=\s*(-?\d+(?:\.\d+)?)", text)
        d = get_var(r"\bd\s*=\s*(\d+(?:\.\d+)?)", text)
        if f_val is not None and d is not None and (d - f_val) != 0:
            d_prime = (d * f_val) / (d - f_val); k_val = -d_prime / d; is_real = d_prime > 0
            ans = f"d' = {f(d_prime)} cm ({'ảnh thật' if is_real else 'ảnh ảo'})"
            res.update(valid=True, ans=ans, graph={"type": "lens", "f": f_val, "d": d, "d_prime": d_prime, "k": k_val})
            steps += [
                {"t": "Tóm tắt thông số thấu kính", "h": math_(f"f = {f(f_val)} \\text{{ cm}}, \\quad d = {f(d)} \\text{{ cm}}")
                 + concept("Quy ước dấu thấu kính", "Thấu kính hội tụ $f > 0$; thấu kính phân kì $f < 0$. Khoảng cách từ vật thật đến thấu kính $d > 0$.")},
                {"t": "Áp dụng công thức thấu kính xác định vị trí ảnh", "h": math_(f"\\frac{{1}}{{f}} = \\frac{{1}}{{d}} + \\frac{{1}}{{d'}} \\implies d' = \\frac{{d \\cdot f}}{{d - f}} = \\frac{{{f(d)} \\cdot {f(f_val)}}}{{{f(d)} - {f(f_val)}}} = {f(d_prime)} \\text{{ cm}}")
                 + concept("Định luật tạo ảnh thấu kính mỏng", "Nếu $d' > 0$, ảnh là ảnh thật (hứng được trên màn, ngược chiều vật). Nếu $d' < 0$, ảnh là ảnh ảo (cùng chiều vật).")},
                {"t": "Tính hệ số phóng đại k và kết luận tính chất ảnh", "h": math_(f"k = -\\frac{{d'}}{{d}} = -\\frac{{{f(d_prime)}}}{{{f(d)}}} = {f(k_val)}")
                 + f"<p>Kết luận: Đây là <b>{'ảnh thật (ngược chiều)' if is_real else 'ảnh ảo (cùng chiều)'}</b>, độ phóng đại $|k| = {f(abs(k_val))}$.</p>" + ok(ans)}
            ]

    # 12. Khúc xạ ánh sáng
    elif label == "refraction":
        n1 = get_var(r"n_?1\s*=\s*(\d+(?:\.\d+)?)", text, default=1.0)
        n2 = get_var(r"n_?2\s*=\s*(\d+(?:\.\d+)?)", text)
        i_deg = get_var(r"(?:góc tới|i)\s*=\s*(\d+(?:\.\d+)?)", text)
        if n2 is not None and i_deg is not None:
            sin_i = math.sin(math.radians(i_deg)); sin_r = (n1 * sin_i) / n2
            if sin_r <= 1.0:
                r_deg = math.degrees(math.asin(sin_r)); ans = f"r ≈ {f(r_deg)}°"; res.update(valid=True, ans=ans)
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"n_1 = {f(n1)}, \\; n_2 = {f(n2)}, \\; i = {f(i_deg)}^\\circ")
                     + concept("Định luật Khúc xạ ánh sáng (Snell - Descartes)", "Tia khúc xạ nằm trong mặt phẳng tới và ở phía bên kia pháp tuyến. Tỉ số giữa sin góc tới và sin góc khúc xạ luôn bằng tỉ số chiết suất: $n_1 \\sin i = n_2 \\sin r$.")},
                    {"t": "Tính góc khúc xạ r", "h": math_(f"\\sin(r) = \\frac{{n_1 \\sin(i)}}{{n_2}} = {round(sin_r, 4)} \\implies r \\approx {f(r_deg)}^\\circ")
                     + concept("Ý nghĩa góc khúc xạ", "Khi truyền từ môi trường chiết quang kém sang môi trường chiết quang hơn ($n_1 < n_2$), tia sáng bị bẻ gãy lại gần pháp tuyến ($r < i$).")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]
            else:
                ans = "Phản xạ toàn phần (không có tia khúc xạ)"; res.update(valid=True, ans=ans)
                steps += [
                    {"t": "Tóm tắt dữ kiện", "h": math_(f"n_1 = {f(n1)}, \\; n_2 = {f(n2)}, \\; i = {f(i_deg)}^\\circ")},
                    {"t": "Xét điều kiện khúc xạ", "h": math_(f"\\sin(r) = \\frac{{{f(n1)} \\cdot \\sin({f(i_deg)}^\\circ)}}{{{f(n2)}}} = {round(sin_r, 4)} > 1")
                     + concept("Hiện tượng Phản xạ toàn phần", "Khi ánh sáng truyền từ môi trường chiết quang hơn sang môi trường kém chiết quang ($n_1 > n_2$) với góc tới $i > i_{gh}$ (với $\\sin i_{gh} = n_2 / n_1$), toàn bộ tia sáng bị phản xạ lại mặt phân cách, không có tia khúc xạ đi vào môi trường thứ hai.")},
                    {"t": "Kết luận", "h": ok(ans)}
                ]

    # ==================== PHẦN 2: BÀI TẬP TOÁN HỌC ====================
    elif "hình thoi" in text.lower() and any(k in text.lower() for k in ["trung điểm", "cùng nằm trên", "đường tròn", "chứng minh"]):
        m_side = re.search(r"(?:ab|cạnh)\s*=\s*([a-zA-Z0-9]+)", text, re.I)
        a_val = m_side.group(1) if m_side else "a"
        res.update(topic="Geometry", kind="Chứng minh hình học (Đường tròn)", diff=3, valid=True,
                   ans=f"Tâm O (giao điểm AC và BD), Bán kính R = {a_val}/2")
        res["steps"] = [
            {"t": "Xác định tính chất tam giác đều", "h": f"<p>Hình thoi ABCD có AB = AD = {a_val} và góc A = 60°. ABD là tam giác đều cạnh {a_val}.</p>"},
            {"t": "Chứng minh tứ giác EFGH là hình chữ nhật", "h": "<p>EF và HG song song và bằng AC/2. Do AC ⊥ BD nên EF ⊥ EH. Tứ giác EFGH là hình chữ nhật tâm O.</p>"},
            {"t": "Khoảng cách từ O đến các điểm", "h": f"<p>OE = OF = OG = OH = OB = OD = {a_val}/2.</p>" + ok(f"6 điểm cùng nằm trên đường tròn (O; {a_val}/2)")}
        ]
        res["graph"] = {"type": "rhombus_circle", "a": a_val}
        return res

    elif label in ("linear", "quad") and (pe := poly_equation(t)):
        ans, st = pe; res.update(valid=True, ans=ans); steps += st
        if pe and len(st) > 0:
            if "bậc hai" in st[0]["h"]:
                res.update(kind="Phương trình bậc 2", graph={"type": "parabola", "title": "Đồ thị Parabol phương trình bậc hai"})
            else:
                res.update(kind="Phương trình bậc 1")
    elif label == "linear" and (m := re.search(r"(-?\d*)x([+-]\d+)?=(-?\d+)$", t)) and co(m[1]):
        a, b, c = co(m[1]), int(m[2] or 0), int(m[3]); r = c - b; x = r / a
        res.update(valid=True, ans=f"x = {f(x)}", graph={"a": a, "b": b - c, "x": x})
        steps += [
            {"t": "Xác định phương trình", "h": math_(f"{f(a)}x {sg(b)} = {f(c)}") + concept("Dạng phương trình bậc nhất", "Phương trình có dạng $ax + b = c$ với $a \\neq 0$. Mục tiêu là cô lập ẩn số $x$ về một vế.")},
            {"t": "Chuyển vế đổi dấu", "h": math_(f"{f(a)}x = {f(r)}") + concept("Quy tắc chuyển vế", "Khi chuyển một hạng tử từ vế này sang vế kia của phương trình, ta phải đổi dấu của hạng tử đó.")},
            {"t": "Chia hệ số để tìm x", "h": math_(f"x = \\frac{{{f(r)}}}{{{f(a)}}} = {f(x)}") + ok(f"x = {f(x)}")}
        ]
    elif label == "circle" and (m := re.search(r"(?:r=|bánkính)(\d+(?:\.\d+)?)", text.lower().replace(" ", ""))):
        r = float(m[1]); ch = "chu vi" in text.lower(); v = 2 * math.pi * r if ch else math.pi * r * r
        ans = f'{"C" if ch else "S"} ≈ {f(v)}'; res.update(valid=True, ans=ans, graph={"type": "circle", "r": r, "title": f"Đường tròn bán kính r = {f(r)}"})
        steps += [
            {"t": "Xác định bán kính", "h": math_(f"r = {f(r)}")},
            {"t": "Áp dụng công thức", "h": math_("C = 2\\pi r" if ch else "S = \\pi r^2") + concept("Hình tròn", "Chu vi là độ dài đường biên: $C = 2\\pi r$. Diện tích là phần mặt phẳng giới hạn bởi đường tròn: $S = \\pi r^2$.")},
            {"t": "Kết quả", "h": ok(ans)}
        ]
    elif label == "deriv" and (P := poly_expr_from_text(text)) is not None:
        D = {n - 1: c * n for n, c in P.items() if n > 0}
        ans = "y' = " + fmt_poly(D) if D else "y' = 0"; res.update(valid=True, ans=ans)
        steps += [
            {"t": "Hàm số ban đầu", "h": math_(f"y = {fmt_poly(P)}")},
            {"t": "Đạo hàm từng số hạng", "h": math_("(x^n)' = n \\cdot x^{n-1}") + concept("Quy tắc số mũ đạo hàm", "Đạo hàm của hàm lũy thừa: $(x^n)' = n \\cdot x^{n-1}$, đạo hàm của hằng số bằng $0$.")},
            {"t": "Kết quả đạo hàm", "h": ok(ans)}
        ]
    elif label == "arith" and (v := safe_arith(text)) is not None:
        ans = _coef(v) if v.denominator == 1 or len(str(v.denominator)) < 4 else str(round(float(v), 4))
        res.update(valid=True, ans=ans)
        steps += [
            {"t": "Biểu thức số học", "h": math_(text.strip())},
            {"t": "Thứ tự ưu tiên phép tính", "h": "<p>Ngoặc → nhân/chia → cộng/trừ; từ trái sang phải.</p>"},
            {"t": "Kết quả", "h": ok(ans)}
        ]
    elif label == "system" and len(eqs := re.findall(r"-?\d*x\s*[+-]\s*\d*y\s*=\s*-?\d+", text)) >= 2:
        ms = [re.match(r"^(-?\d*)x([+-]\d*)y=(-?\d+)$", e.replace(" ", "")) for e in eqs[:2]]
        (a1, b1, c1), (a2, b2, c2) = [(co(q[1]), co(q[2]), int(q[3])) for q in ms]
        D, Dx, Dy = a1 * b2 - a2 * b1, c1 * b2 - c2 * b1, a1 * c2 - a2 * c1
        if (a1, b1) == (0, 0) or (a2, b2) == (0, 0): return res
        ans = ("Hệ có vô số nghiệm" if (Dx == 0 and Dy == 0) else "Hệ vô nghiệm") if D == 0 else f"x = {fr(Fraction(Dx, D))}, y = {fr(Fraction(Dy, D))}"
        res.update(valid=True, ans=ans)
        steps += [
            {"t": "Hệ phương trình", "h": math_(f"{a1}x {sg(b1)}y = {c1}<br>{a2}x {sg(b2)}y = {c2}")},
            {"t": "Định thức Cramer", "h": math_(f"D = {D}, Dx = {Dx}, Dy = {Dy}") + concept("Phương pháp định thức Cramer", "Hệ có nghiệm duy nhất khi $D \\neq 0$: $x = D_x / D, y = D_y / D$.")},
            {"t": "Nghiệm của hệ", "h": ok(ans)}
        ]
    elif label == "gcd" and len(ns := numlist(text)) >= 2 and all(float(x).is_integer() and x > 0 for x in ns):
        ns = [int(x) for x in ns]; low = text.lower().replace(" ", ""); g = math.gcd(*ns); l = 1
        for x in ns: l = l * x // math.gcd(l, x)
        want = "bcnn" in low or "bộichung" in low; lst = ", ".join(map(str, ns))
        res.update(valid=True, ans=f"{'BCNN' if want else 'ƯCLN'}({lst}) = {l if want else g}")
        steps += [
            {"t": "Các số cần xét", "h": math_(lst)},
            {"t": "Tìm ước chung lớn nhất", "h": ok(res["ans"]) + concept("Thuật toán Euclid", "ƯCLN là số tự nhiên lớn nhất mà các số đã cho đều chia hết.")}
        ]
    elif label == "percent" and len(ns := numlist(text)) >= 2:
        p, n = ns[0], ns[1]; v = (p * n) / 100
        res.update(valid=True, ans=f(v))
        steps += [
            {"t": "Xác định dữ kiện bài toán", "h": math_(f"p = {f(p)}\\%, \\quad N = {f(n)}")},
            {"t": "Áp dụng công thức tính phần trăm", "h": math_(f"\\frac{{{f(p)}}}{{100}} \\times {f(n)} = {f(v)}") + concept("Quy tắc phần trăm", "$p\\%$ của một số $N$ được tính theo công thức: $\\frac{p}{100} \\times N$.")},
            {"t": "Kết luận đáp số", "h": ok(res["ans"])}
        ]
    elif label == "geom" and len(ns := numlist(text)) == 2 and not re.search(r"thang|thoi|bình hành|vuông góc|lập phương|trụ|cầu|nón|elip|đa giác|ngũ|lục", text.lower()):
        a, b = ns; low = text.lower(); v = None; gr = None
        if "huyền" in low and "tam giác" in low:
            v, k, fm = math.hypot(a, b), "Cạnh huyền", "c = \\sqrt{a^2 + b^2}"
            gr = {"type": "right_triangle", "a": a, "b": b, "c": v}
        elif "tam giác" in low and "đáy" in low and "cao" in low and "chu vi" not in low:
            v, k, fm = a * b / 2, "Diện tích", "S = \\frac{1}{2} \\cdot \\text{đáy} \\cdot \\text{cao}"
            gr = {"type": "triangle_area", "base": a, "height": b, "s": v}
        elif ("chữ nhật" in low or ("dài" in low and "rộng" in low)) and "đường chéo" not in low:
            if "chu vi" in low:
                v, k, fm = 2 * (a + b), "Chu vi", "P = 2(a + b)"
                gr = {"type": "rectangle", "w": max(a, b), "h": min(a, b), "p": v}
            else:
                v, k, fm = a * b, "Diện tích", "S = \\text{dài} \\times \\text{rộng}"
                gr = {"type": "rectangle", "w": max(a, b), "h": min(a, b), "s": v}
        if v is not None:
            res.update(valid=True, ans=f"{k} = {f(v)}", graph=gr)
            steps += [
                {"t": "Xác định dữ kiện hình học", "h": math_(f"a = {f(a)}, \\quad b = {f(b)}") + concept("Công thức hình học phẳng", fm)},
                {"t": "Thay số và tính", "h": ok(res["ans"])}
            ]
    elif label == "integ" and (P := poly_expr_from_text(text)) is not None:
        F = {n + 1: c / (n + 1) for n, c in P.items() if c != 0}
        ans = "F(x) = " + (fmt_poly(F) + " + C" if F else "C")
        res.update(valid=True, ans=ans)
        steps += [
            {"t": "Xác định hàm số cần lấy nguyên hàm", "h": math_(f"y = {fmt_poly(P)}")},
            {"t": "Áp dụng công thức nguyên hàm cơ bản", "h": math_("\\int x^n dx = \\frac{x^{n+1}}{n+1} + C") + concept("Khái niệm Nguyên hàm", "Nguyên hàm của hàm số $f(x)$ là hàm $F(x)$ sao cho $F'(x) = f(x)$.")},
            {"t": "Tính từng số hạng và kết luận", "h": ok(ans)}
        ]


    # ==================== PHẦN 3: BÀI TẬP HÓA HỌC ====================
    # 1. Tính số mol và khối lượng (n = m/M, m = n * M)
    elif label == "chem_mol":
        m_val = get_var(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text)
        n_val = get_var(r"(\d+(?:\.\d+)?)\s*mol\b", text)
        M_val = get_var(r"\bM\s*=\s*(\d+(?:\.\d+)?)", text)
        substance = "chất"
        if M_val is None:
            chem_db = {
                "nhôm": ("Al", 27), "al": ("Al", 27), "sắt": ("Fe", 56), "fe": ("Fe", 56),
                "đồng": ("Cu", 64), "cu": ("Cu", 64), "kẽm": ("Zn", 65), "zn": ("Zn", 65),
                "magie": ("Mg", 24), "mg": ("Mg", 24), "natri": ("Na", 23), "na": ("Na", 23),
                "canxi": ("Ca", 40), "ca": ("Ca", 40), "kali": ("K", 39), "k": ("K", 39),
                "bari": ("Ba", 137), "ba": ("Ba", 137), "bạc": ("Ag", 108), "ag": ("Ag", 108),
                "nacl": ("NaCl", 58.5), "naoh": ("NaOH", 40), "hcl": ("HCl", 36.5),
                "h2so4": ("H2SO4", 98), "caco3": ("CaCO3", 100), "baso4": ("BaSO4", 233),
                "cuo": ("CuO", 80), "cuso4": ("CuSO4", 160), "al2o3": ("Al2O3", 102),
                "fe2o3": ("Fe2O3", 160), "fe3o4": ("Fe3O4", 232), "h2o": ("H2O", 18),
                "co2": ("CO2", 44), "o2": ("O2", 32), "h2": ("H2", 2)
            }
            for k, (sym, mass) in sorted(chem_db.items(), key=lambda x: -len(x[0])):
                if re.search(r"\b" + re.escape(k) + r"\b", t_lower):
                    M_val = mass
                    substance = sym
                    break

        if m_val is not None and M_val is not None and M_val > 0:
            calc_n = m_val / M_val
            ans = f"n = {f(calc_n)} mol"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_atom", "symbol": substance, "name": substance})
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"m_{{{substance}}} = {f(m_val)} \\text{{ g}}, \\quad M_{{{substance}}} = {f(M_val)} \\text{{ g/mol}}")
                 + concept("Khái niệm Số mol", "Số mol là lượng chất chứa $6{,}022 \\times 10^{23}$ nguyên tử hoặc phân tử chất đó (hằng số Avogadro).")},
                {"t": "Áp dụng công thức tính số mol", "h": math_(f"n = \\frac{{m}}{{M}} = \\frac{{{f(m_val)}}}{{{f(M_val)}}} = {f(calc_n)} \\text{{ mol}}")
                 + concept("Công thức chuyển đổi", "Liên hệ giữa khối lượng và số mol: $n = \\frac{m}{M} \\iff m = n \\times M$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif n_val is not None and M_val is not None and M_val > 0:
            calc_m = n_val * M_val
            ans = f"m = {f(calc_m)} g"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_atom", "symbol": substance, "name": substance})
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"n_{{{substance}}} = {f(n_val)} \\text{{ mol}}, \\quad M_{{{substance}}} = {f(M_val)} \\text{{ g/mol}}")},
                {"t": "Tính khối lượng chất", "h": math_(f"m = n \\times M = {f(n_val)} \\times {f(M_val)} = {f(calc_m)} \\text{{ g}}")
                 + concept("Công thức khối lượng", "$m = n \\times M$ (với $m$ tính bằng gam, $M$ là khối lượng mol $\\text{g/mol}$.)")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 2. Thể tích chất khí ở điều kiện chuẩn / tiêu chuẩn (V = n * 22.4)
    elif label == "chem_gas":
        is_dkc = "24.79" in text or "đkc" in t_lower
        v0_mol = 24.79 if is_dkc else 22.4
        unit_lbl = "đkc (25°C, 1 bar)" if is_dkc else "đktc (0°C, 1 atm)"
        n_val = get_var(r"(\d+(?:\.\d+)?)\s*mol\b", text)
        v_val = get_var(r"(\d+(?:\.\d+)?)\s*(?:lít|lit|l)\b", text)
        if n_val is not None:
            calc_v = n_val * v0_mol
            ans = f"V = {f(calc_v)} lít"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_reaction", "title": "Khí sinh ra ở " + unit_lbl, "product": "Khí V = " + f(calc_v) + " L"})
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"n = {f(n_val)} \\text{{ mol}}, \\quad V_0 = {f(v0_mol)} \\text{{ lít/mol ({unit_lbl})}}")
                 + concept("Thể tích mol chất khí", f"Một mol của bất kỳ chất khí nào ở cùng điều kiện nhiệt độ và áp suất đều chiếm thể tích như nhau ($V = n \\times {f(v0_mol)}$ lít).")},
                {"t": "Áp dụng công thức tính thể tích khí", "h": math_(f"V = n \\times {f(v0_mol)} = {f(n_val)} \\times {f(v0_mol)} = {f(calc_v)} \\text{{ lít}}")},
                {"t": "Kết luận đáp số", "h": ok(ans)}
            ]
        elif v_val is not None:
            calc_n = v_val / v0_mol
            ans = f"n = {f(calc_n)} mol"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện đề bài", "h": math_(f"V = {f(v_val)} \\text{{ lít ({unit_lbl})}}")},
                {"t": "Tính số mol khí", "h": math_(f"n = \\frac{{V}}{{{f(v0_mol)}}} = \\frac{{{f(v_val)}}}{{{f(v0_mol)}}} = {f(calc_n)} \\text{{ mol}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 3. Nồng độ mol dung dịch CM = n / V
    elif label == "chem_conc_mol":
        n_val = get_var(r"(\d+(?:\.\d+)?)\s*mol\b", text)
        cm_val = get_var(r"(\d+(?:\.\d+)?)\s*(?:M|mol\/l)\b", text)
        ml_val = get_var(r"(\d+(?:\.\d+)?)\s*ml\b", text)
        lit_val = get_var(r"(\d+(?:\.\d+)?)\s*(?:lít|lit|l)\b", text)
        v_l = (ml_val / 1000.0) if ml_val is not None else lit_val

        if n_val is not None and v_l is not None and v_l > 0:
            calc_cm = n_val / v_l
            ans = f"CM = {f(calc_cm)} M"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Đổi đơn vị và tóm tắt", "h": math_(f"n = {f(n_val)} \\text{{ mol}}, \\quad V = {f(v_l)} \\text{{ lít}}")
                 + concept("Nồng độ mol (CM)", "Nồng độ mol biểu thị số mol chất tan có trong 1 lít dung dịch: $C_M = \\frac{n}{V}$ (đơn vị: mol/L hoặc M).")},
                {"t": "Tính nồng độ mol CM", "h": math_(f"C_M = \\frac{{n}}{{V}} = \\frac{{{f(n_val)}}}{{{f(v_l)}}} = {f(calc_cm)} \\text{{ M}}")},
                {"t": "Kết luận đáp số", "h": ok(ans)}
            ]
        elif cm_val is not None and v_l is not None:
            calc_n = cm_val * v_l
            ans = f"n = {f(calc_n)} mol"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"C_M = {f(cm_val)} \\text{{ M}}, \\quad V = {f(v_l)} \\text{{ lít}}")},
                {"t": "Tính số mol chất tan", "h": math_(f"n = C_M \\times V = {f(cm_val)} \\times {f(v_l)} = {f(calc_n)} \\text{{ mol}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 4. Nồng độ phần trăm C% = (m_ct / m_dd) * 100%
    elif label == "chem_conc_pct":
        pct_val = get_var(r"(\d+(?:\.\d+)?)\s*%", text)
        ns = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text, re.I)]
        if len(ns) >= 2:
            m_ct, second_m = ns[0], ns[1]
            if "nước" in t_lower or "h2o" in t_lower or "dung môi" in t_lower:
                m_dd = m_ct + second_m
                explain_dd = f"m_{{dd}} = m_{{ct}} + m_{{H_2O}} = {f(m_ct)} + {f(second_m)} = {f(m_dd)} \\text{{ g}}"
            else:
                m_dd = second_m
                explain_dd = f"m_{{dd}} = {f(m_dd)} \\text{{ g}}"
            calc_c = (m_ct / m_dd) * 100.0
            ans = f"C% = {f(calc_c)}%"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Xác định khối lượng chất tan và dung dịch", "h": math_(f"m_{{ct}} = {f(m_ct)} \\text{{ g}}, \\quad {explain_dd}")
                 + concept("Nồng độ phần trăm (C%)", "Nồng độ phần trăm cho biết số gam chất tan có trong 100 gam dung dịch: $C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%$.")},
                {"t": "Áp dụng công thức tính C%", "h": math_(f"C\\% = \\frac{{m_{{ct}}}}{{m_{{dd}}}} \\times 100\\% = \\frac{{{f(m_ct)}}}{{{f(m_dd)}}} \\times 100\\% = {f(calc_c)}\\%")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif pct_val is not None and len(ns) >= 1:
            m_dd = ns[0]
            calc_mct = (m_dd * pct_val) / 100.0
            ans = f"m(chất tan) = {f(calc_mct)} g"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"m_{{dd}} = {f(m_dd)} \\text{{ g}}, \\quad C\\% = {f(pct_val)}\\%")},
                {"t": "Tính khối lượng chất tan", "h": math_(f"m_{{ct}} = \\frac{{m_{{dd}} \\times C\\%}}{{100\\%}} = \\frac{{{f(m_dd)} \\times {f(pct_val)}}}{{100}} = {f(calc_mct)} \\text{{ g}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 5. Tính pH dung dịch
    elif label == "chem_ph":
        h_match = re.search(r"\[h\+\]\s*=\s*(?:10\^?([+-]?\d+)|(0\.\d+|\d+(?:\.\d+)?(?:e[+-]?\d+)?))", text, re.I)
        oh_match = re.search(r"\[oh\-\]\s*=\s*(?:10\^?([+-]?\d+)|(0\.\d+|\d+(?:\.\d+)?(?:e[+-]?\d+)?))", text, re.I)
        if h_match:
            if h_match.group(1):
                p_val = float(h_match.group(1))
                ph = -p_val
            else:
                conc = float(h_match.group(2))
                ph = -math.log10(conc)
            env = "Môi trường Axit" if ph < 7 else ("Môi trường Bazơ" if ph > 7 else "Môi trường Trung tính")
            ans = f"pH = {f(ph)} ({env})"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_ph", "ph": ph, "env": env})
            steps += [
                {"t": "Xác định nồng độ ion H+", "h": math_(f"[H^+] = 10^{{-{f(ph)}}} \\text{{ M}}")
                 + concept("Khái niệm chỉ số pH", "Chỉ số pH đánh giá độ axit hay bazơ của dung dịch: $\\text{pH} = -\\log[H^+]$. Quy ước: $\\text{pH} < 7$ (Axit, quỳ đỏ), $\\text{pH} = 7$ (Trung tính), $\\text{pH} > 7$ (Bazơ, quỳ xanh).")},
                {"t": "Tính chỉ số pH", "h": math_(f"\\text{{pH}} = -\\log[H^+] = {f(ph)}")},
                {"t": "Đánh giá môi trường dung dịch", "h": ok(f"pH = {f(ph)} &implies; {env}")}
            ]
        elif oh_match:
            if oh_match.group(1):
                p_val = float(oh_match.group(1))
                poh = -p_val
            else:
                conc = float(oh_match.group(2))
                poh = -math.log10(conc)
            ph = 14.0 - poh
            env = "Môi trường Axit" if ph < 7 else ("Môi trường Bazơ" if ph > 7 else "Môi trường Trung tính")
            ans = f"pH = {f(ph)} ({env})"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_ph", "ph": ph, "env": env})
            steps += [
                {"t": "Xác định nồng độ ion OH- và tính pOH", "h": math_(f"[OH^-] = 10^{{-{f(poh)}}} \\text{{ M}} \\implies \\text{{pOH}} = {f(poh)}")},
                {"t": "Liên hệ giữa pH và pOH ở 25°C", "h": math_(f"\\text{{pH}} + \\text{{pOH}} = 14 \\implies \\text{{pH}} = 14 - {f(poh)} = {f(ph)}")
                 + concept("Tích số ion của nước", "Ở 25°C, $[H^+][OH^-] = 10^{-14} \\implies \\text{pH} + \\text{pOH} = 14$.")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 6. Kim loại tác dụng với dung dịch Axit (sinh khí H2)
    elif label == "chem_metal_acid":
        m_kl = get_var(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text)
        metal_db = {
            "nhôm": ("Al", "Nhôm", 27, 1.5, r"2Al + 6HCl \to 2AlCl_3 + 3H_2\uparrow"),
            "al": ("Al", "Nhôm", 27, 1.5, r"2Al + 6HCl \to 2AlCl_3 + 3H_2\uparrow"),
            "sắt": ("Fe", "Sắt", 56, 1.0, r"Fe + 2HCl \to FeCl_2 + H_2\uparrow"),
            "fe": ("Fe", "Sắt", 56, 1.0, r"Fe + 2HCl \to FeCl_2 + H_2\uparrow"),
            "kẽm": ("Zn", "Kẽm", 65, 1.0, r"Zn + 2HCl \to ZnCl_2 + H_2\uparrow"),
            "zn": ("Zn", "Kẽm", 65, 1.0, r"Zn + 2HCl \to ZnCl_2 + H_2\uparrow"),
            "magie": ("Mg", "Magie", 24, 1.0, r"Mg + 2HCl \to MgCl_2 + H_2\uparrow"),
            "mg": ("Mg", "Magie", 24, 1.0, r"Mg + 2HCl \to MgCl_2 + H_2\uparrow")
        }
        found_m = None
        for k, v in metal_db.items():
            if re.search(r"\b" + re.escape(k) + r"\b", t_lower):
                found_m = v
                break

        if m_kl is not None and found_m is not None:
            sym, name, M_val, ratio, pthh = found_m
            n_kl = m_kl / M_val
            n_h2 = n_kl * ratio
            v_h2 = n_h2 * 22.4
            ans = f"V = {f(v_h2)} lít"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_reaction", "title": f"Phản ứng {sym} + Axit", "product": f"H2 sinh ra: {f(v_h2)} L"})
            steps += [
                {"t": f"Tính số mol kim loại {name} ({sym})", "h": math_(f"n_{{{sym}}} = \\frac{{m}}{{M}} = \\frac{{{f(m_kl)}}}{{{f(M_val)}}} = {f(n_kl)} \\text{{ mol}}")},
                {"t": "Phương trình hóa học và tỉ lệ mol", "h": math_(pthh) + concept("Dãy hoạt động hóa học", f"Kim loại {sym} đứng trước Hiđro trong dãy hoạt động hóa học nên đẩy được $H_2$ ra khỏi dung dịch axit.")},
                {"t": "Tính số mol và thể tích khí H2 (đktc)", "h": math_(f"n_{{H_2}} = {f(n_kl)} \\times {f(ratio)} = {f(n_h2)} \\text{{ mol}} \\implies V_{{H_2}} = {f(n_h2)} \\times 22.4 = {f(v_h2)} \\text{{ lít}}")},
                {"t": "Kết luận đáp số", "h": ok(ans)}
            ]

    # 7. Định luật bảo toàn khối lượng
    elif label == "chem_mass_cons":
        ns = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text, re.I)]
        if len(ns) >= 2:
            m1, m2 = ns[0], ns[1]
            diff = abs(m2 - m1)
            ans = f"m(O2) = {f(diff)} g" if ("o2" in t_lower or "oxi" in t_lower) else f"m = {f(diff)} g"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tóm tắt khối lượng các chất", "h": math_(f"m_1 = {f(m1)} \\text{{ g}}, \\quad m_2 = {f(m2)} \\text{{ g}}")
                 + concept("Định luật bảo toàn khối lượng (Lomonosov - Lavoisier)", "Trong một phản ứng hóa học, tổng khối lượng của các chất tham gia bằng tổng khối lượng của các chất sản phẩm tạo thành: $m_A + m_B = m_C + m_D$.")},
                {"t": "Tính khối lượng chất còn lại", "h": math_(f"m = |{f(m2)} - {f(m1)}| = {f(diff)} \\text{{ g}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 8. Hiệu suất phản ứng
    elif label == "chem_yield":
        ns = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text, re.I)]
        if len(ns) >= 2:
            m_lt, m_tt = max(ns), min(ns)
            h_pct = (m_tt / m_lt) * 100.0
            ans = f"H% = {f(h_pct)}%"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Xác định khối lượng lý thuyết và thực tế", "h": math_(f"m_{{lt}} = {f(m_lt)} \\text{{ g}}, \\quad m_{{tt}} = {f(m_tt)} \\text{{ g}}")
                 + concept("Hiệu suất phản ứng hóa học", "Hiệu suất phản ứng là tỉ số giữa lượng chất thu được trong thực tế và lượng chất tính theo lý thuyết: $H\\% = \\frac{m_{tt}}{m_{lt}} \\times 100\\%$.")},
                {"t": "Tính hiệu suất phản ứng H%", "h": math_(f"H\\% = \\frac{{{f(m_tt)}}}{{{f(m_lt)}}} \\times 100\\% = {f(h_pct)}\\%")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 9. Phản ứng tạo kết tủa
    elif label == "chem_precip":
        n_val = get_var(r"(\d+(?:\.\d+)?)\s*mol\b", text)
        M_val = get_var(r"\bM\s*=\s*(\d+(?:\.\d+)?)", text, default=233.0 if ("baso4" in t_lower or "bari" in t_lower) else 143.5)
        subst = "BaSO_4" if ("baso4" in t_lower or "bari" in t_lower) else "AgCl"
        if n_val is not None:
            m_precip = n_val * M_val
            ans = f"m(kết tủa) = {f(m_precip)} g"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_reaction", "title": f"Tạo kết tủa trắng {subst}", "product": f"Kết tủa m = {f(m_precip)} g"})
            steps += [
                {"t": "Phương trình phản ứng trao đổi", "h": math_(r"BaCl_2 + H_2SO_4 \to BaSO_4\downarrow + 2HCl")
                 + concept("Điều kiện xảy ra phản ứng trao đổi", "Phản ứng trao đổi trong dung dịch các chất điện li chỉ xảy ra khi các ion kết hợp với nhau tạo thành ít nhất một trong các chất: chất kết tủa, chất điện li yếu (như $H_2O$) hoặc chất khí.")},
                {"t": f"Tính khối lượng kết tủa {subst}", "h": math_(f"n_{{{subst}}} = {f(n_val)} \\text{{ mol}} \\implies m_{{{subst}}} = {f(n_val)} \\times {f(M_val)} = {f(m_precip)} \\text{{ g}}")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 10. Phần trăm khối lượng nguyên tố trong hợp chất
    elif label == "chem_elem_pct":
        ns = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)", text)]
        if "cu" in t_lower and "cuo" in t_lower:
            m_cu, m_o = 64.0, 16.0
            m_mol = m_cu + m_o
            pct = (m_cu / m_mol) * 100.0
            ans = f"%m(Cu) = {f(pct)}%"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Tính khối lượng mol của hợp chất CuO", "h": math_(f"M_{{CuO}} = {f(m_cu)} + {f(m_o)} = {f(m_mol)} \\text{{ g/mol}}")
                 + concept("Thành phần phần trăm nguyên tố", "Phần trăm khối lượng của nguyên tố A trong hợp chất $A_x B_y$: $\\%m_A = \\frac{x \\cdot M_A}{M_{A_x B_y}} \\times 100\\%$.")},
                {"t": "Tính % khối lượng của Cu", "h": math_(f"\\%m_{{Cu}} = \\frac{{{f(m_cu)}}}{{{f(m_mol)}}} \\times 100\\% = {f(pct)}\\%")},
                {"t": "Kết luận", "h": ok(ans)}
            ]
        elif len(ns) >= 2:
            m_elem, m_tot = min(ns), max(ns)
            pct = (m_elem / m_tot) * 100.0
            ans = f"%m = {f(pct)}%"
            res.update(valid=True, ans=ans)
            steps += [
                {"t": "Áp dụng công thức phần trăm khối lượng", "h": math_(f"\\%m = \\frac{{{f(m_elem)}}}{{{f(m_tot)}}} \\times 100\\% = {f(pct)}\\%")},
                {"t": "Kết luận", "h": ok(ans)}
            ]

    # 11. Xác định khối lượng mol M và tên kim loại
    elif label == "chem_molar_mass":
        m_val = get_var(r"(\d+(?:\.\d+)?)\s*(?:gam|g)\b", text)
        n_val = get_var(r"(\d+(?:\.\d+)?)\s*mol\b", text)
        if m_val is not None and n_val is not None and n_val > 0:
            m_calc = m_val / n_val
            known = {23: ("Natri", "Na"), 24: ("Magie", "Mg"), 27: ("Nhôm", "Al"), 39: ("Kali", "K"),
                     40: ("Canxi", "Ca"), 56: ("Sắt", "Fe"), 64: ("Đồng", "Cu"), 65: ("Kẽm", "Zn"),
                     108: ("Bạc", "Ag"), 137: ("Bari", "Ba")}
            m_round = round(m_calc)
            name_info = known.get(m_round, ("Kim loại", "M"))
            ans = f"M = {f(m_calc)} g/mol ({name_info[0]} - {name_info[1]})"
            res.update(valid=True, ans=ans, graph={"type": "chemistry_atom", "symbol": name_info[1], "name": name_info[0]})
            steps += [
                {"t": "Tóm tắt dữ kiện", "h": math_(f"m = {f(m_val)} \\text{{ g}}, \\quad n = {f(n_val)} \\text{{ mol}}")},
                {"t": "Tính khối lượng mol M", "h": math_(f"M = \\frac{{m}}{{n}} = \\frac{{{f(m_val)}}}{{{f(n_val)}}} = {f(m_calc)} \\text{{ g/mol}}")
                 + concept("Xác định nguyên tố", "Tra bảng tuần hoàn các nguyên tố hóa học để suy ra tên nguyên tố tương ứng với khối lượng mol $M$.")},
                {"t": "Tra bảng tuần hoàn và kết luận", "h": ok(ans)}
            ]

    # 12. Cân bằng phương trình hóa học
    elif label == "chem_eq":
        eq_patterns = [
            (r"al\s*\+\s*o2", r"4Al + 3O_2 \to 2Al_2O_3", "Phản ứng oxi hóa nhôm tạo nhôm oxit ($Al_2O_3$)."),
            (r"fe\s*\+\s*o2.*fe3o4|fe\s*\+\s*o2", r"3Fe + 2O_2 \to Fe_3O_4", "Phản ứng sắt cháy trong oxi tạo oxit sắt từ ($Fe_3O_4$)."),
            (r"al\s*\+\s*hcl", r"2Al + 6HCl \to 2AlCl_3 + 3H_2\uparrow", "Nhôm tác dụng với axit clohiđric giải phóng khí hiđro."),
            (r"fe\s*\+\s*hcl", r"Fe + 2HCl \to FeCl_2 + H_2\uparrow", "Sắt tác dụng với axit clohiđric tạo muối sắt(II) và khí hiđro."),
            (r"zn\s*\+\s*hcl", r"Zn + 2HCl \to ZnCl_2 + H_2\uparrow", "Kẽm tác dụng với axit clohiđric giải phóng khí hiđro."),
            (r"mg\s*\+\s*hcl", r"Mg + 2HCl \to MgCl_2 + H_2\uparrow", "Magie tác dụng với axit clohiđric giải phóng khí hiđro."),
            (r"na\s*\+\s*h2o", r"2Na + 2H_2O \to 2NaOH + H_2\uparrow", "Kim loại natri phản ứng với nước tạo dung dịch kiềm."),
            (r"caco3\s*\+\s*hcl", r"CaCO_3 + 2HCl \to CaCl_2 + CO_2\uparrow + H_2O", "Canxi cacbonat tác dụng với axit giải phóng khí cacbonic."),
            (r"ch4\s*\+\s*o2", r"CH_4 + 2O_2 \to CO_2 + 2H_2O", "Phản ứng đốt cháy hoàn toàn khí metan."),
            (r"c2h5oh\s*\+\s*o2", r"C_2H_5OH + 3O_2 \to 2CO_2 + 3H_2O", "Phản ứng đốt cháy hoàn toàn rượu etylic."),
            (r"naoh\s*\+\s*hcl", r"NaOH + HCl \to NaCl + H_2O", "Phản ứng trung hòa axit - bazơ."),
            (r"bacl2\s*\+\s*h2so4", r"BaCl_2 + H_2SO_4 \to BaSO_4\downarrow + 2HCl", "Phản ứng tạo kết tủa trắng bari sunfat."),
            (r"cu\s*\+\s*agno3", r"Cu + 2AgNO_3 \to Cu(NO_3)_2 + 2Ag\downarrow", "Kim loại đồng đẩy bạc ra khỏi dung dịch muối bạc."),
            (r"fe2o3\s*\+\s*co", r"Fe_2O_3 + 3CO \to 2Fe + 3CO_2", "Phản ứng khử oxit sắt bằng khí CO."),
            (r"c6h5nh2.*br2|br2.*c6h5nh2|anilin.*brom", r"C_6H_5NH_2 + 3Br_2 \to C_6H_2Br_3NH_2\downarrow + 3HBr", "Phản ứng thế brom vào nhân thơm anilin tạo kết tủa trắng 2,4,6-tribromanilin."),
            (r"c6h5oh.*br2|br2.*c6h5oh|phenol.*brom", r"C_6H_5OH + 3Br_2 \to C_6H_2Br_3OH\downarrow + 3HBr", "Phản ứng thế brom vào nhân thơm phenol tạo kết tủa trắng 2,4,6-tribromphenol."),
            (r"ch3cooh\s*\+\s*c2h5oh|c2h5oh\s*\+\s*ch3cooh", r"CH_3COOH + C_2H_5OH \overset{H_2SO_4, t^o}{\rightleftharpoons} CH_3COOC_2H_5 + H_2O", "Phản ứng este hóa tạo etyl axetat."),
            (r"c2h4\s*\+\s*br2|br2\s*\+\s*c2h4", r"C_2H_4 + Br_2 \to C_2H_4Br_2", "Phản ứng cộng brom làm mất màu dung dịch nước brom của etilen.")
        ]
        matched_eq = None
        for pat, balanced, desc in eq_patterns:
            if re.search(pat, t_lower):
                matched_eq = (balanced, desc)
                break
        if matched_eq:
            balanced_str, desc = matched_eq
            ans = balanced_str
            res.update(valid=True, ans=ans, graph={"type": "chemistry_reaction", "title": "Cân bằng PTHH", "product": "PTHH chuẩn"})
            steps += [
                {"t": "Xác định sơ đồ phản ứng", "h": math_(text.strip())},
                {"t": "Cân bằng số nguyên tử mỗi nguyên tố hai vế", "h": concept("Định luật bảo toàn số nguyên tử", desc)},
                {"t": "Phương trình hóa học đã cân bằng hoàn chỉnh", "h": ok(math_(balanced_str))}
            ]
    if res["valid"]:
        res["ans"] = res["ans"] or ""
        if not res.get("graph"):
            try:
                import llm
                res["graph"] = llm.detect_graph(text, res)
            except Exception:
                pass
    return res

