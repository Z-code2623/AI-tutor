"""Chế độ LLM cho bài tập tự luận, chứng minh và giải thích hiện tượng liên môn Toán, Vật lý & Hóa học (Cách 1: Web tự chịu API)."""
import html, json, os, re

PHYSICS_KEYWORDS = re.compile(
    r"vận tốc|gia tốc|quãng đường|rơi tự do|trọng lực|lực kéo|lực ma sát|định luật|newton|công |công suất|"
    r"động năng|thế năng|cơ năng|nhiệt lượng|nhiệt độ|đun sôi|chất khí|áp suất|khí lí tưởng|đẳng nhiệt|boyle|"
    r"điện trở|hiệu điện thế|cường độ dòng điện|định luật ohm|định luật ôm|công suất điện|cu-lông|coulomb|thấu kính|"
    r"tiêu cự|vật sáng|ảnh thật|ảnh ảo|chiết suất|khúc xạ|phản xạ|m/s|m/s\^2|j/kg|kwh|watt|ampe|vôn|ohm|\b\u03a9\b",
    re.I
)

CHEMISTRY_KEYWORDS = re.compile(
    r"hóa học|phương trình hóa học|pthh|số mol|khối lượng mol|nguyên tử|phân tử|nồng độ mol|\bcm\b|nồng độ phần trăm|"
    r"\bc%\b|chất tan|kết tủa|khí thoát ra|đktc|đkc|axit|bazơ|bazo|muối|oxit|phi kim|cân bằng phương trình|"
    r"\bal\b|\bfe\b|\bcu\b|\bzn\b|\bmg\b|\bna\b|\bca\b|\bba\b|\bag\b|\bhcl\b|\bh2so4\b|\bnaoh\b|\bcaco3\b|\bbaso4\b|"
    r"\bco2\b|\bh2\b|\bo2\b|\bch4\b|\bc2h5oh\b|mol/l|g/mol|\bph\b|\[h\+\]|\[oh\-\]|hiệu suất phản ứng|bảo toàn khối lượng|"
    r"bảo toàn electron|bảo toàn e|hóa vô cơ|hóa hữu cơ|dãy hoạt động hóa học",
    re.I
)

PROOF = re.compile(r"chứng minh|giải thích|tại sao|nêu|hiện tượng|so sánh|nhận xét|biện luận|cho tam giác|đường tròn", re.I)

SYSTEM_MATH = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Giải bài toán từng bước, chặt chẽ, suy luận logic, "
    "gợi mở tư duy (phương pháp Socratic). Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn' (ví dụ: 'Tôi và bạn cùng tóm tắt bài toán...', "
    "'Bây giờ tôi sẽ hướng dẫn bạn...', 'Như bạn thấy đấy...'). Giọng điệu ân cần, nhiệt tình, khích lệ và dễ hiểu, bằng tiếng Việt, "
    "văn bản thuần (không HTML). Tính toán số học chính xác tuyệt đối (đặc biệt khi thay số âm, lũy thừa, phân số, các giá trị biên của đoạn [a, b]: ví dụ đoạn [-2; 5/2] thì thay đúng x = -2 và x = 5/2, tuyệt đối không nhầm sang -5/2). Đọc kỹ đúng biểu thức cần tính (phân biệt rõ M + 2m với 2M + m). "
    "Mọi công thức, biểu thức, phương trình và biến số ($x, y, a, b$) BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $x^2 - 5x + 6 = 0$, $\\frac{a}{2}$); "
    "TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. "
    "Tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn hoàn chỉnh, mượt mà, "
    "tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). "
    "Tiêu đề bước ('t') chỉ ghi ngắn gọn tên hành động (ví dụ: 'Tìm tập xác định', 'Tính đạo hàm và nghiệm', 'Tính giá trị tại các điểm', 'So sánh và kết luận'), KHÔNG ghi chữ 'Bước 1', 'Bước 2'. "
    'Chỉ trả về JSON thuần không markdown: {"topic":"Algebra|Geometry|Calculus|Arithmetic","kind":"<tên dạng toán>","diff":1-3,'
    '"steps":[{"t":"<tiêu đề bước ngắn gọn>","h":"<nội dung bước>"}],"ans":"<đáp số ngắn gọn>"}. Tối đa 8 bước.'
)

SYSTEM_PHYSICS = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Giải bài tập Vật lý từng bước, phân tích hiện tượng, "
    "tóm tắt đại lượng, đổi đơn vị chuẩn SI ($m, s, kg, J, W, \\Omega, V$), nêu rõ công thức và định luật áp dụng. "
    "Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn' (ví dụ: 'Tôi và bạn cùng tóm tắt các đại lượng đề bài cho...', "
    "'Tôi sẽ cùng bạn phân tích hiện tượng này...', 'Bạn chú ý đổi đơn vị sang chuẩn SI nhé...'). "
    "Giọng điệu ân cần, nhiệt tình, khích lệ và dễ hiểu, bằng tiếng Việt, văn bản thuần (không HTML). "
    "Mọi công thức, biểu thức tính toán và biến số ($v, a, t, m, k, T, F, s...$) BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $v = v_0 + at$, $F = m \\cdot a$, $A = F \\cdot s$); "
    "TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. Đơn vị đo có thể viết trong \\text{} (ví dụ $\\text{s}$, $\\text{kg}$) hoặc để ngoài $, "
    "tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn xuôi hoàn chỉnh, liền mạch, tự nhiên như sách giáo khoa, "
    "tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). "
    'Chỉ trả về JSON thuần không markdown: {"topic":"Mechanics|Thermodynamics|Electromagnetism|Optics","kind":"<tên dạng bài>","diff":1-3,'
    '"steps":[{"t":"<tiêu đề bước>","h":"<nội dung bước>"}],"ans":"<đáp số kèm đơn vị>"}. Tối đa 8 bước.'
)

SYSTEM_CHEMISTRY = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Giải bài tập Hóa học từng bước, phân tích hiện tượng hóa học, "
    "viết phương trình phản ứng (PTHH) kèm hệ số cân bằng, tóm tắt dữ kiện đề bài, tính số mol, bảo toàn nguyên tố / electron / khối lượng, "
    "tính nồng độ hoặc khối lượng theo yêu cầu. Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn' (ví dụ: 'Tôi và bạn cùng viết phương trình phản ứng nhé...', "
    "'Bây giờ tôi sẽ cùng bạn tính số mol...'). Giọng điệu ân cần, nhiệt tình, khích lệ và dễ hiểu, bằng tiếng Việt, văn bản thuần (không HTML). "
    "Mọi công thức, PTHH và biến số BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $2Al + 6HCl \\to 2AlCl_3 + 3H_2\\uparrow$, "
    "$n_{Al} = \\frac{m}{M} = \\frac{5{,}4}{27} = 0{,}2\\text{ mol}$); TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. "
    "Tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn hoàn chỉnh, mượt mà, "
    "tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). "
    'Chỉ trả về JSON thuần không markdown: {"topic":"GeneralChem|InorganicChem|SolutionChem|OrganicChem","kind":"<tên dạng bài>","diff":1-3,'
    '"steps":[{"t":"<tiêu đề bước>","h":"<nội dung bước>"}],"ans":"<đáp số kèm đơn vị>"}. Tối đa 8 bước.'
)

SYSTEM_TUTOR_MATH = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích bản chất định lý, "
    "hướng dẫn tư duy từng bước cho bạn học. Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn'. "
    "Luôn viết công thức Toán học bằng định dạng LaTeX chuẩn kẹp giữa dấu $...$ (inline) hoặc $$...$$ (display). "
    "Giọng điệu ân cần, nhiệt tình, chuẩn xác, khích lệ bạn học tự tin giải toán."
)

SYSTEM_TUTOR_PHYSICS = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Nhiệm vụ của bạn là giải thích bản chất hiện tượng vật lý, "
    "phân tích các lực và quá trình, lưu ý đặc biệt việc đổi đơn vị chuẩn SI ($m, s, kg, J, W, \\Omega, V...$), và chỉ rõ điều kiện áp dụng định luật. "
    "Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn'. Luôn viết công thức Toán & Vật lý bằng định dạng LaTeX chuẩn kẹp giữa $...$ hoặc $$...$$. "
    "Giọng điệu ân cần, nhiệt tình, dễ hiểu, khích lệ bạn học."
)

SYSTEM_TUTOR_CHEMISTRY = (
    "Bạn là người bạn gia sư đồng hành thông minh (AdaptiveTutor AI). Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích hiện tượng hóa học, "
    "cơ chế phản ứng, các định luật bảo toàn (khối lượng, nguyên tố, điện tích, electron), cách đổi đơn vị và tính toán nồng độ mol/phần trăm. "
    "Luôn xưng hô thân thiện, gần gũi: 'tôi' và 'bạn'. Luôn viết PTHH và công thức Hóa học bằng định dạng LaTeX chuẩn kẹp giữa dấu $...$ hoặc $$...$$. "
    "Giọng điệu ân cần, nhiệt tình, chuẩn xác, dễ hiểu."
)


def looks_like_proof(text):
    return len(text) > 80 or bool(PROOF.search(text))


def detect_subject(text, hint="auto"):
    h = str(hint or "").lower().strip()
    if h in ("math", "physics", "chemistry"):
        return h
    if bool(CHEMISTRY_KEYWORDS.search(text)):
        return "chemistry"
    return "physics" if bool(PHYSICS_KEYWORDS.search(text)) else "math"


def available():
    return bool(
        os.environ.get("GEMINI_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("ANTHROPIC_API_KEY")
        or os.environ.get("DEEPSEEK_API_KEY")
    )


def profile_text(st):
    p = st.get("p", {})
    weak = sorted(p, key=p.get)[:2]
    names = {
        "Algebra": "Đại số", "Geometry": "Hình học", "Calculus": "Giải tích", "Arithmetic": "Số học",
        "Mechanics": "Cơ học", "Thermodynamics": "Nhiệt học", "Electromagnetism": "Điện từ học", "Optics": "Quang học",
        "GeneralChem": "Hóa đại cương", "InorganicChem": "Hóa vô cơ", "SolutionChem": "Hóa dung dịch", "OrganicChem": "Hóa hữu cơ"
    }
    recent = "; ".join(h.get("text", "")[:60] for h in st.get("history", [])[-3:])
    return (
        f"Trình độ {st.get('level', 1)}/3; chủ đề còn yếu: {', '.join(names.get(k, k) for k in weak)}; "
        f"bài gần đây: {recent or 'chưa có'}."
    )


def ask(text, cfg, profile="", subject="auto", image=None):
    import ai_providers
    sub = detect_subject(text, subject)
    if sub == "chemistry":
        system = SYSTEM_CHEMISTRY
        default_top = "InorganicChem"
    elif sub == "physics":
        system = SYSTEM_PHYSICS
        default_top = "Mechanics"
    else:
        system = SYSTEM_MATH
        default_top = "Algebra"

    if profile:
        system += f" Hồ sơ học sinh (chỉ để điều chỉnh mức giải thích, không nhắc lại): {profile}"

    prompt = text
    if image and (not text or text.strip() in ("Giải bài tập trong ảnh đính kèm", "Bài tập trong ảnh đính kèm")):
        prompt = "Hãy quan sát kỹ hình ảnh đính kèm chứa bài tập. Đọc và trích xuất đúng nội dung đề bài/biểu thức vào trường 'eq', xác định chính xác môn học, và giải chi tiết từng bước logic bằng tiếng Việt."

    last = None
    for _ in range(2):
        try:
            raw = ai_providers.complete(cfg, system, prompt, max_tokens=4500, image=image)
            return parse(raw, text, default_topic=default_top)
        except (ValueError, AttributeError, KeyError, TypeError) as e:
            last = e
    raise last


def ask_tutor(question, problem, steps, ans="", subject="auto", cfg=None):
    """Hỏi đáp cùng gia sư AI về bài tập hiện tại."""
    import ai_providers
    sub = detect_subject(problem + " " + question, subject)
    if sub == "chemistry":
        system = SYSTEM_TUTOR_CHEMISTRY
        sub_name = "Hóa học"
    elif sub == "physics":
        system = SYSTEM_TUTOR_PHYSICS
        sub_name = "Vật lý"
    else:
        system = SYSTEM_TUTOR_MATH
        sub_name = "Toán học"

    steps_txt = "\n".join(f"Bước {i + 1}: {s.get('t', '')}" for i, s in enumerate(steps or []))
    usr = (
        f"Bài tập ({sub_name}): {problem}\n"
        f"Đáp số: {ans or 'Chưa xác định'}\n"
        f"Các bước giải chính:\n{steps_txt or 'Chưa có'}\n\n"
        f"Bạn hỏi: {question}\n\n"
        f"Hãy giải thích ngắn gọn, chuẩn xác, dễ hiểu, luôn xưng hô thân thiện, gần gũi 'tôi' và 'bạn'."
    )
    return ai_providers.complete(cfg, system, usr, max_tokens=1500)


_AMBIG = (
    "frac|dfrac|tfrac|forall|times|tan|theta|text|tau|to|triangle|top|therefore|tilde|neq|ne|nabla|not|notin|neg|nu|"
    "beta|bar|begin|bot|bigcup|bigcap|binom|bullet|right|rightarrow|rho|rm|cdot|omega|alpha|lambda|mu|approx"
)
_BAD_ESC = re.compile(r'\\\\|\\(?=(?:%s)(?![A-Za-z]))|\\(?!["\\/bfnrtu])|\\u(?![0-9a-fA-F]{4})' % _AMBIG)


def fix_json_latex(raw):
    return _BAD_ESC.sub(lambda m: m.group(0) if m.group(0) == "\\\\" else "\\\\" + m.group(0)[1:], raw)


def format_step_content(raw_h):
    if not raw_h:
        return ""
    text = str(raw_h).replace("\r\n", "\n").replace("\r", "\n").strip()

    # 1. Chuyển đổi $$...$$ thành $...$ trong lời giải nếu là biến đơn hoặc công thức trong câu
    def _demote_display_math(match):
        inner = match.group(1).strip()
        if r"\begin" in inner or r"\\" in inner or len(inner) > 120:
            return f"\n$${inner}$$\n"
        return f"${inner}$"

    text = re.sub(r"\$\$\s*([\s\S]*?)\s*\$\$", _demote_display_math, text)

    # 2. Loại bỏ ngắt dòng vô lý trước dấu câu (, . ; : ! ? ) )
    text = re.sub(r"\s*(?:\n)+\s*([,;:.!?\)])", r"\1", text)

    # 3. Chuẩn hóa khoảng cách trước dấu câu sau công thức ($F$ , -> $F$,)
    text = re.sub(r"(\$[^$]+\$)\s+([,;:.!?])", r"\1\2", text)

    paragraphs = re.split(r"\n{2,}", text)
    cleaned_paras = []
    for p in paragraphs:
        lines = [line.strip() for line in p.split("\n") if line.strip()]
        if not lines:
            continue
        para_text = ""
        for i, line in enumerate(lines):
            esc_line = html.escape(line)
            if i == 0:
                para_text = esc_line
                continue
            prev_line = lines[i - 1]
            prev_ends_colon = bool(re.search(r"[:：]$", prev_line))
            is_list = bool(re.match(r"^(?:[-*+•]|\d+[.)]\s|[a-zA-Z][.)]\s)", line))
            is_display_math = bool(re.match(r"^(?:\$\$|\\\[)", line)) or bool(re.search(r"(?:\\\]|\$\$)$", prev_line))
            if prev_ends_colon or is_list or (is_display_math and prev_ends_colon):
                para_text += "<br>" + esc_line
            elif re.match(r"^[,;:.!?\)]", line):
                para_text += esc_line
            else:
                para_text += " " + esc_line
        cleaned_paras.append(para_text)

    res = "".join(f"<p>{p}</p>" for p in cleaned_paras if p)
    res = re.sub(r"[ \t]{2,}", " ", res)
    res = re.sub(r"\s+([,;.!?])", r"\1", res)
    res = re.sub(r"(<p\b[^>]*>|<br\s*\/?>)\s*([,;:.!?])\s*", r"\1", res)
    return res


def detect_graph(text, d=None):
    if d and d.get("graph"):
        return d["graph"]
    str_txt = (str(text or "") + " " + str((d or {}).get("eq", "")) + " " + str((d or {}).get("kind", ""))).lower()
    
    # 1. Con lắc lò xo
    if re.search(r"lò xo|con lắc lò xo|\bk\s*=\s*\d+|\bđộ cứng\b", str_txt):
        m_m = re.search(r"(?:m\s*=\s*|khối lượng\s*(?:của vật)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(kg|g)?", str_txt, re.I)
        k_m = re.search(r"(?:k\s*=\s*|độ cứng\s*(?:của lò xo)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(n/m)?", str_txt, re.I)
        m_val = m_m.group(1) if m_m else ""
        if m_m and m_m.group(2) and m_m.group(2).lower() == "g":
            try: m_val = str(round(float(m_val.replace(",", ".")) / 1000, 4)).replace(".", ",")
            except Exception: pass
        k_val = k_m.group(1) if k_m else ""
        return {
            "type": "spring",
            "title": "Sơ đồ con lắc lò xo dao động điều hòa",
            "m": m_val,
            "k": k_val,
            "mLabel": f"m = {m_val} kg" if m_val else "m",
            "kLabel": f"k = {k_val} N/m" if k_val else "k"
        }
    
    # 2. Con lắc đơn
    if re.search(r"con lắc đơn|dây treo|chiều dài dây|dây dài\s*\d+", str_txt):
        l_m = re.search(r"(?:l\s*=\s*|chiều dài\s*(?:dây)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(m|cm)?", str_txt, re.I)
        return {
            "type": "pendulum",
            "title": "Sơ đồ con lắc đơn dao động điều hòa",
            "l": l_m.group(1) if l_m else "",
            "lUnit": l_m.group(2) if (l_m and l_m.group(2)) else "m"
        }

    # 3. Rơi tự do
    if re.search(r"rơi tự do|thả rơi|độ cao\s*h|\bh\s*=\s*\d+", str_txt):
        h_m = re.search(r"(?:h\s*=\s*|độ cao\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(m|km)?", str_txt, re.I)
        return {
            "type": "freefall",
            "title": "Mô hình chuyển động rơi tự do",
            "h": h_m.group(1) if h_m else ""
        }

    # 4. Lực & Định luật Newton
    if re.search(r"lực kéo|lực ma sát|định luật (?:ii|2) newton|mặt phẳng nghiêng|\b\vec{f}\b|\bf\s*=\s*m\s*[*·\.]\s*a", str_txt):
        return {
            "type": "forces",
            "title": "Sơ đồ phân tích các lực tác dụng lên vật"
        }

    # 5. Động học / v(t)
    if re.search(r"vận tốc|gia tốc|quãng đường|chuyển động thẳng|đồ thị v-t|v\(t\)", str_txt):
        return {
            "type": "kinematics",
            "title": "Đồ thị vận tốc theo thời gian v(t)"
        }

    # 6. Thấu kính
    if re.search(r"thấu kính|tiêu cự|ảnh thật|ảnh ảo|quang tâm", str_txt):
        return {
            "type": "lens",
            "title": "Sơ đồ tạo ảnh qua thấu kính"
        }

    # 7. Tam giác vuông & Pytago
    if re.search(r"tam giác|pytago|pitago|cạnh huyền|vuông tại|định lý pytago", str_txt):
        return {
            "type": "triangle",
            "title": "Tam giác vuông và định lý Pytago"
        }

    # 8. Đường tròn
    if re.search(r"đường tròn|hình tròn|bán kính|đường kính|tâm o\b", str_txt):
        r_m = re.search(r"(?:r\s*=\s*|bán kính\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(cm|m|mm)?", str_txt, re.I)
        return {
            "type": "circle",
            "title": "Đường tròn và các yếu tố hình học",
            "r": r_m.group(1) if r_m else "",
            "rUnit": r_m.group(2) if (r_m and r_m.group(2)) else "cm"
        }

    # 9. Parabol
    if re.search(r"parabol|parabola|hàm số bậc hai|x\^2|x²|đỉnh parabol", str_txt):
        return {
            "type": "parabola",
            "title": "Đồ thị Parabol hàm số bậc hai"
        }

    # 10. Mạch điện & Định luật Ohm
    if re.search(r"mạch điện|mạch nối tiếp|mạch song song|điện trở|định luật ohm|định luật ôm|\bhiệu điện thế\b|\bcường độ dòng điện\b|\b\u03a9\b|\bohm\b|\bu\s*=\s*\d+|\bi\s*=\s*\d+", str_txt):
        return {
            "type": "circuit",
            "title": "Sơ đồ đoạn mạch điện"
        }

    return None


def parse(raw, text, default_topic="Algebra"):
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        raise ValueError("No JSON found")
    d = json.loads(fix_json_latex(m.group(0)))
    e = lambda s: html.escape(str(s))
    steps = [
        {"t": e(s.get("t", "Bước")), "h": format_step_content(s.get("h", ""))}
        for s in d.get("steps", [])
    ][:8]
    if not steps:
        raise ValueError("empty")
    valid_topics = (
        "Algebra", "Geometry", "Calculus", "Arithmetic",
        "Mechanics", "Thermodynamics", "Electromagnetism", "Optics",
        "GeneralChem", "InorganicChem", "SolutionChem", "OrganicChem"
    )
    topic = d.get("topic")
    if topic not in valid_topics:
        topic = default_topic
    
    graph = d.get("graph") or detect_graph(text, d)
    return {
        "topic": topic,
        "kind": e(d.get("kind", "Bài tập tự luận")),
        "diff": min(3, max(1, int(d.get("diff", 2)))),
        "eq": text,
        "steps": steps,
        "ans": str(d.get("ans", ""))[:300],
        "graph": graph,
        "valid": True,
        "source": "llm",
    }
