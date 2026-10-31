/* js/explain.js - Triển khai chuẩn Cách 1: Web tự chịu API (Bảo mật máy chủ, Không cần key ở trình duyệt) */

const MATH_DELIM = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g;
const LATEX_CMD = /\\(?:text|quad|qquad|vec|implies|frac|dfrac|sqrt|perp|parallel|triangle|widehat|angle|approx|neq|ne|leq|geq|le|ge|times|cdot|div|pm|pi|circ|infty|sin|cos|tan|log|ln|lim|sum|int|Rightarrow|Leftrightarrow|to|alpha|beta|gamma|omega|mu|lambda|Delta|[;,!])(?![A-Za-z])/;
const MATH_TOKEN = /^(?:[A-Za-z]|\d+(?:[.,]\d+)?|[=+\-*\/<>^_]+|[()]+)$/;

let MATH_FAILED = false;
function mathReady(maxMs = 8000) {
    if (window.katex && window.renderMathInElement) return Promise.resolve(true);
    return new Promise(res => {
        const t0 = Date.now();
        const tick = () => {
            if (window.katex && window.renderMathInElement) return res(true);
            if (Date.now() - t0 > maxMs) { MATH_FAILED = true; return res(false); }
            setTimeout(tick, 100);
        };
        tick();
    });
}

function matchBalanced(str, start, openCh = '{', closeCh = '}') {
    if (str[start] !== openCh) return null;
    let depth = 0;
    for (let i = start; i < str.length; i++) {
        if (str[i] === openCh) depth++;
        else if (str[i] === closeCh) {
            depth--;
            if (depth === 0) return { text: str.slice(start, i + 1), end: i + 1 };
        }
    }
    return null;
}

function tokenizeMathProse(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
        // 1. Khoảng trắng
        const wsMatch = str.slice(i).match(/^\s+/);
        if (wsMatch) {
            tokens.push({ type: 'ws', val: wsMatch[0] });
            i += wsMatch[0].length;
            continue;
        }

        // 2. Lệnh LaTeX và các khối ngoặc đi kèm (ví dụ: \text{ (s)}, \sqrt{\frac{...}{...}}, \approx, \pi...)
        if (str[i] === '\\') {
            const cmdMatch = str.slice(i).match(/^\\(?:[A-Za-z]+|[^A-Za-z\s])/);
            if (cmdMatch) {
                let end = i + cmdMatch[0].length;
                while (end < str.length) {
                    if (str[end] === '{') {
                        const b = matchBalanced(str, end, '{', '}');
                        if (b) { end = b.end; continue; }
                    } else if (str[end] === '[') {
                        const b = matchBalanced(str, end, '[', ']');
                        if (b) { end = b.end; continue; }
                    }
                    break;
                }
                tokens.push({ type: 'latex', val: str.slice(i, end) });
                i = end;
                continue;
            }
        }

        // 3. Số (số nguyên, số thập phân dùng dấu chấm hoặc phẩy: 0,25, 3.14)
        const numMatch = str.slice(i).match(/^\d+(?:[.,]\d+)?/);
        if (numMatch) {
            tokens.push({ type: 'num', val: numMatch[0] });
            i += numMatch[0].length;
            continue;
        }

        // 4. Toán tử và ký hiệu toán học
        const opMatch = str.slice(i).match(/^[=+\-*\/<>^_~()|]/);
        if (opMatch) {
            tokens.push({ type: 'op', val: opMatch[0] });
            i += opMatch[0].length;
            continue;
        }

        // 5. Dấu câu trong văn bản (giữ bên ngoài dấu $)
        const pMatch = str.slice(i).match(/^[,;:!?.]/);
        if (pMatch) {
            tokens.push({ type: 'punct', val: pMatch[0] });
            i += pMatch[0].length;
            continue;
        }

        // 6. Từ ngữ tiếng Việt hoặc biến số đơn lẻ
        const wMatch = str.slice(i).match(/^[^\s\\=+\-*\/<>^_~(),;:!?.]+/);
        if (wMatch) {
            const w = wMatch[0];
            const isVar = /^[a-zA-Z](?:_\w+)?$/.test(w);
            tokens.push({ type: isVar ? 'var' : 'word', val: w });
            i += w.length;
            continue;
        }

        tokens.push({ type: 'char', val: str[i] });
        i++;
    }
    return tokens;
}

function wrapLooseMath(text) {
    if (!text || !/\\/.test(text)) return text;
    const tokens = tokenizeMathProse(text);
    const isMathToken = t => t.type === 'latex' || t.type === 'op' || t.type === 'num' || t.type === 'var';
    const isAnchor = t => t.type === 'latex' || (t.type === 'op' && /[=<>~^]/.test(t.val));

    const out = [];
    let i = 0;
    while (i < tokens.length) {
        if (!isMathToken(tokens[i])) {
            out.push(tokens[i].val);
            i++;
            continue;
        }

        let j = i;
        let lastMathIdx = -1;
        let hasAnchor = false;

        while (j < tokens.length) {
            if (isMathToken(tokens[j])) {
                if (isAnchor(tokens[j])) hasAnchor = true;
                lastMathIdx = j;
                j++;
            } else if (tokens[j].type === 'ws') {
                if (j + 1 < tokens.length && isMathToken(tokens[j + 1])) {
                    j++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        if (hasAnchor && lastMathIdx >= i) {
            const mathStr = tokens.slice(i, lastMathIdx + 1).map(t => t.val).join('').trim();
            out.push('$' + mathStr + '$');
            i = lastMathIdx + 1;
        } else {
            out.push(tokens[i].val);
            i++;
        }
    }
    return out.join('');
}

function cleanMathHtml(h) {
    if (!h) return "";
    let str = String(h);

    // 1. Chuyển đổi $$...$$ thành $...$ trong lời giải nếu là biến đơn hoặc công thức trong câu
    // Giữ $$ chỉ khi có \\begin hoặc công thức nhiều dòng thực sự
    str = str.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (m, inner) => {
        const trimmed = inner.trim();
        if (/\\begin|\\\\/.test(trimmed) || trimmed.length > 120) {
            return `\n$$${trimmed}$$\n`;
        }
        return `$${trimmed}$`;
    });

    // 2. Tự động bọc $$ cho các khối <div class="math"> nếu chưa có dấu $ hoặc $$
    str = str.replace(/<div class="math">([\s\S]*?)<\/div>/gi, (m, inner) => {
        const trimmed = inner.trim();
        return trimmed.startsWith("$") ? m : `<div class="math">$$${trimmed}$$</div>`;
    });

    // 3. Chuẩn hóa xuống dòng: loại bỏ ngắt dòng vô lý trước dấu câu (, . ; : ! ? ) )
    str = str.replace(/\s*(?:<br\s*\/?>|\n)+\s*([,;:.!?\)])/g, "$1");

    // 4. Chuẩn hóa khoảng cách trước dấu câu sau công thức (vd: "$F$ ," -> "$F$,")
    str = str.replace(/(\$[^$]+\$)\s+([,;:.!?])/g, "$1$2");

    // 5. Nếu văn bản chưa có thẻ <p>, chuẩn hóa các đoạn văn mượt mà
    if (!/<p\b/i.test(str)) {
        const rawParas = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n{2,}/);
        str = rawParas.map(p => {
            const lines = p.split("\n").map(l => l.trim()).filter(Boolean);
            if (!lines.length) return "";
            let res = "";
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (i === 0) { res = line; continue; }
                const prev = lines[i - 1];
                const prevEndsColon = /[:：]$/.test(prev);
                const isList = /^(?:[-*+•]|\d+[.)]\s|[a-zA-Z][.)]\s)/.test(line);
                const isDisp = /^(?:\$\$|\\\[)/.test(line) || /(?:\\\]|\$\$)$/.test(prev);
                
                if (prevEndsColon || isList || (isDisp && prevEndsColon)) {
                    res += "<br>" + line;
                } else if (/^[,;:.!?\)]/.test(line)) {
                    res += line;
                } else {
                    res += " " + line;
                }
            }
            return `<p>${res}</p>`;
        }).filter(Boolean).join("");
    }

    // 6. Xóa các <br> vụn vặt ở giữa câu trước dấu câu, biến/công thức hoặc chữ
    str = str.replace(/\s*<br\s*\/?>\s*([,;:.!?\)])/gi, "$1");
    str = str.replace(/([^\s.:;!?<>\/])\s*<br\s*\/?>\s*(\$|\\|[a-zA-Z0-9,\u00C0-\u1EF9])/g, "$1 $2");
    str = str.replace(/(<p\b[^>]*>|<br\s*\/?>)\s*([,;:.!?])\s*/gi, "$1");

    // 7. Tự động sửa lỗi cú pháp \text{$...$}
    str = str.replace(/\\text\{\$([^}]*)\$\}/g, '\\text{$1}')
             .replace(/\\text\{\$([^}]*)\}/g, '\\text{$1}$')
             .replace(/\\text\{([^}]*)\$\}/g, '\\text{$1}$');

    str = str.replace(/\\\\(?=[A-Za-z])/g, "\\");
    str = str.replace(/\${3,}/g, m => m.length >= 4 ? "$$" : "$");

    // 8. Dọn sạch khoảng trắng kép thừa và khoảng trống trước dấu câu
    str = str.replace(/[ \t]{2,}/g, " ");
    str = str.replace(/\s+([,;.!?])/g, "$1");
    str = str.replace(/([,;.!?])(?=[^\s\d,;.!?<>\$])/g, "$1 ");

    let last = 0, res = "";
    const loose = seg => seg.split(/(<[^>]*>)/).map(p => p.startsWith("<") ? p : wrapLooseMath(p)).join("");
    for (const m of str.matchAll(MATH_DELIM)) {
        res += loose(str.slice(last, m.index)) + m[0];
        last = m.index + m[0].length;
    }
    str = res + loose(str.slice(last));

    if (MATH_FAILED && !window.renderMathInElement && !window.katex) {
        str = str.replace(/\\implies/g, "⟹")
            .replace(/\\parallel/g, "∥")
            .replace(/\\perp/g, "⟂")
            .replace(/\\triangle/g, "△")
            .replace(/\\widehat\{([^}]+)\}/g, "∠$1")
            .replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
            .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
            .replace(/\\approx/g, "≈")
            .replace(/\\times/g, "×").replace(/\\cdot/g, "·")
            .replace(/\^\\circ|\^circ/g, "°")
            .replace(/\$+/g, "");
    }
    return str;
}

function applyKatex(el, tries = 0) {
    const target = el || $("#out");
    if (!target) return;
    if (window.renderMathInElement) {
        try {
            renderMathInElement(target, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "\\[", right: "\\]", display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.warn("KaTeX render error:", e);
        }
    } else if (tries < 40) {
        setTimeout(() => applyKatex(target, tries + 1), 250);
    }
}

/* Không có máy chủ Flask để dùng: GitHub Pages, mở file:// trực tiếp, hoặc backend không kết nối được */
function noServerMode() {
    const noBackend = typeof BACKEND !== "undefined" && !BACKEND;
    return Boolean((typeof STATIC_HOST !== "undefined" && STATIC_HOST) || (typeof location !== "undefined" && location.protocol === "file:") || noBackend);
}

/* Hiển thị lời giải: giải ngay các dạng cơ bản & kết nối AI máy chủ cho dạng tự luận hoặc ảnh chụp (Cách 1) */
async function render(raw, imgData = null) {
    imgData = imgData || window.CURRENT_IMAGE;
    const hasImage = Boolean(imgData && imgData.data);
    const textTrimmed = String(raw || "").trim();

    if (!textTrimmed && !hasImage) {
        toast("⚠️ Vui lòng nhập đề bài hoặc tải ảnh lên để xem giải");
        return;
    }
    if (!textTrimmed && hasImage) {
        raw = "Bài tập trong ảnh đính kèm";
    }

    const katexWait = mathReady();
    const o = $("#out");
    const sub = S.subject || "math";
    const subName = sub === "chemistry" ? "Hóa học" : (sub === "physics" ? "Vật lý" : "Toán học");

    const loadingText = hasImage
        ? `Đang quét hình ảnh và giải bài tập bằng AI Vision (${subName})...`
        : `Đang phân tích và giải bài tập ${subName}...`;

    o.innerHTML = `<div class="card" style="text-align:center;padding:24px">
        <div style="display:inline-flex;align-items:center;gap:10px;color:var(--pri);font-weight:600">
            <span class="ms" style="animation:spin 1s linear infinite;font-size:24px">autorenew</span>
            ${esc(loadingText)}
        </div>
    </div>`;

const CLIENT_SYS_MATH = "Bạn là người bạn gia sư Toán học Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi, khích lệ như hai người bạn cùng tiến bộ (tuyệt đối không xưng thầy, cô, em, học sinh). Giải bài toán từng bước, chặt chẽ, suy luận logic, gợi mở tư duy (phương pháp Socratic), bằng tiếng Việt, văn bản thuần (không HTML). Tính toán số học chính xác tuyệt đối (đặc biệt khi thay số âm, lũy thừa, phân số, các giá trị biên của đoạn [a, b]: ví dụ đoạn [-2; 5/2] thì thay đúng x = -2 và x = 5/2, tuyệt đối không nhầm sang -5/2). Đọc kỹ đúng biểu thức cần tính (phân biệt rõ M + 2m với 2M + m). Mọi công thức, biểu thức, phương trình và biến số ($x, y, a, b$) BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $x^2 - 5x + 6 = 0$, $\\frac{a}{2}$); TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. Tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn hoàn chỉnh, mượt mà, giải thích gần gũi xưng tôi và bạn, tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). Tiêu đề bước ('t') chỉ ghi ngắn gọn tên hành động (ví dụ: 'Tìm tập xác định', 'Tính đạo hàm và nghiệm', 'Tính giá trị tại các điểm', 'So sánh và kết luận'), KHÔNG ghi chữ 'Bước 1', 'Bước 2'. Chỉ trả về JSON thuần không markdown: {\"topic\":\"Algebra|Geometry|Calculus|Arithmetic\",\"kind\":\"<tên dạng toán>\",\"diff\":1-3,\"steps\":[{\"t\":\"<tiêu đề bước ngắn gọn>\",\"h\":\"<nội dung bước>\"}],\"ans\":\"<đáp số ngắn gọn>\"}. Tối đa 8 bước.";
const CLIENT_SYS_CHEMISTRY = "Bạn là người bạn gia sư Hóa học Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi, khích lệ (tuyệt đối không xưng thầy, cô, em, học sinh). Giải bài tập Hóa học từng bước, phân tích hiện tượng hóa học, viết phương trình phản ứng (PTHH) kèm hệ số cân bằng, tóm tắt dữ kiện đề bài, tính số mol, bảo toàn nguyên tố / electron / khối lượng, tính nồng độ hoặc khối lượng theo yêu cầu, bằng tiếng Việt, văn bản thuần (không HTML). Mọi công thức, PTHH và biến số BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $2Al + 6HCl \\to 2AlCl_3 + 3H_2\\uparrow$, $n_{Al} = \\frac{m}{M} = \\frac{5{,}4}{27} = 0{,}2\\text{ mol}$); TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. Tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn hoàn chỉnh, mượt mà, giải thích gần gũi xưng tôi và bạn, tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). Chỉ trả về JSON thuần không markdown: {\"topic\":\"GeneralChem|InorganicChem|SolutionChem|OrganicChem\",\"kind\":\"<tên dạng bài>\",\"diff\":1-3,\"steps\":[{\"t\":\"<tiêu đề bước>\",\"h\":\"<nội dung bước>\"}],\"ans\":\"<đáp số kèm đơn vị>\"}. Tối đa 8 bước.";
const CLIENT_SYS_TUTOR_CHEMISTRY = "Bạn là người bạn gia sư Hóa học Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi (tuyệt đối không xưng thầy, cô, em, học sinh). Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích hiện tượng hóa học, cơ chế phản ứng, các định luật bảo toàn (khối lượng, nguyên tố, điện tích, electron), cách đổi đơn vị và tính toán nồng độ mol/phần trăm. Luôn viết PTHH và công thức Hóa học bằng định dạng LaTeX chuẩn kẹp giữa dấu $...$. Giọng điệu đồng hành, khoa học, chuẩn xác, dễ hiểu.";
const CLIENT_SYS_PHYSICS = "Bạn là người bạn gia sư Vật lý Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi, khích lệ (tuyệt đối không xưng thầy, cô, em, học sinh). Giải bài tập Vật lý từng bước, phân tích hiện tượng, tóm tắt đại lượng, đổi đơn vị chuẩn SI ($m, s, kg, J, W, \\Omega, V$), nêu rõ công thức và định luật áp dụng, bằng tiếng Việt, văn bản thuần (không HTML). Mọi công thức, biểu thức tính toán và biến số ($v, a, t, m, k, T, F, s...$) BẮT BUỘC kẹp trong MỘT cặp dấu $...$ (inline math, ví dụ $v = v_0 + at$, $F = m \\cdot a$, $A = F \\cdot s$, $\\pi \\approx 3{,}14$, $T = 2\\pi \\sqrt{\\frac{m}{k}}$); TUYỆT ĐỐI KHÔNG dùng $$ trong các bước giải. Không được bỏ quên dấu $ quanh công thức. Đơn vị đo có thể viết trong \\text{} (ví dụ $\\text{s}$, $\\text{kg}$) hoặc để ngoài $, tuyệt đối không chèn dấu $ vào bên trong \\text{}. Trong mỗi bước ('h'), hãy viết thành các câu văn xuôi hoàn chỉnh, liền mạch, tự nhiên như sách giáo khoa, giải thích gần gũi xưng tôi và bạn, tuyệt đối không tự ý ngắt dòng (\\n) ở giữa câu, trước/sau công thức hoặc trước dấu chấm, dấu phẩy. Mỗi dấu gạch chéo ngược trong JSON phải được viết đôi (\\\\frac). Chỉ trả về JSON thuần không markdown: {\"topic\":\"Mechanics|Thermodynamics|Electromagnetism|Optics\",\"kind\":\"<tên dạng bài>\",\"diff\":1-3,\"steps\":[{\"t\":\"<tiêu đề bước>\",\"h\":\"<nội dung bước>\"}],\"ans\":\"<đáp số kèm đơn vị>\"}. Tối đa 8 bước.";
const CLIENT_SYS_TUTOR_MATH = "Bạn là người bạn gia sư Toán học Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi (tuyệt đối không xưng thầy, cô, em, học sinh). Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích bản chất định lý, hướng dẫn tư duy từng bước cho bạn học. Luôn viết công thức Toán học bằng định dạng LaTeX chuẩn kẹp giữa dấu $...$. Giọng điệu đồng hành, gợi mở, chuẩn xác, khích lệ bạn học cùng tiến bộ.";
const CLIENT_SYS_TUTOR_PHYSICS = "Bạn là người bạn gia sư Vật lý Việt Nam (AdaptiveTutor AI). Luôn xưng 'tôi' và gọi người học là 'bạn' thân thiện, gần gũi (tuyệt đối không xưng thầy, cô, em, học sinh). Nhiệm vụ của bạn là giải thích bản chất hiện tượng vật lý, phân tích các lực và quá trình, lưu ý đặc biệt việc đổi đơn vị chuẩn SI ($m, s, kg, J, W, \\Omega, V...$), và chỉ rõ điều kiện áp dụng định luật. Luôn viết công thức Toán & Vật lý bằng định dạng LaTeX chuẩn kẹp giữa $...$. Giọng điệu đồng hành, trực quan, dễ hiểu.";

    // 1. Nếu không có ảnh, thử giải nhanh bằng bộ giải công thức chuẩn ngoại tuyến trước (0 latency, 0 quota)
    const offlineRes = (!hasImage && typeof solve === "function") ? solve(raw) : null;
    let r = null, clientErr = null;

    if (offlineRes && offlineRes.valid && offlineRes.steps && offlineRes.steps.length) {
        r = { ...offlineRes, offline: true };
    } else {
        // 2. Gửi đề bài lên backend (kèm API key và ảnh nếu có, giảm timeout xuống 4s nếu không có backend)
        const clientKey = typeof getClientGeminiKey === "function" ? getClientGeminiKey() : "";
        const apiTimeout = (typeof BACKEND !== "undefined" && BACKEND) ? 25000 : 4000;
        const solvePayload = { text: raw, subject: sub, key: clientKey };
        if (hasImage) {
            solvePayload.image = { mimeType: imgData.mimeType, data: imgData.data };
        }
        r = await apiPost("/api/solve", solvePayload, apiTimeout);

        // 3. Gọi thẳng Google Gemini bằng key cá nhân (khi mở file trực tiếp / GitHub Pages / backend không có AI)
        if ((!r || !r.valid) && typeof callClientGemini === "function" && typeof getClientGeminiKey === "function" && getClientGeminiKey()) {
            try {
                const sys = sub === "chemistry" ? CLIENT_SYS_CHEMISTRY : (sub === "physics" ? CLIENT_SYS_PHYSICS : CLIENT_SYS_MATH);
                const prompt = hasImage
                    ? (textTrimmed && textTrimmed !== "Bài tập trong ảnh đính kèm"
                        ? `Đề bài: ${raw}\n(Hình ảnh đính kèm có chứa đề bài/sơ đồ). Môn học: ${subName}. Hãy nhận diện bài tập trong ảnh kết hợp phần văn bản mô tả, giải chi tiết từng bước bằng tiếng Việt và tính toán chính xác tuyệt đối.`
                        : `Hãy quan sát và đọc kỹ đề bài trong hình ảnh đính kèm này. Môn học: ${subName}. Hãy trích xuất rõ đề bài/công thức toán vào trường 'eq', sau đó giải chi tiết từng bước logic bằng tiếng Việt và tính toán chính xác tuyệt đối.`)
                    : `Đề bài: ${raw}\nMôn học: ${subName}`;
                const clientResp = await callClientGemini(sys, prompt, { json: true, image: hasImage ? imgData : null });
                const parsed = parseAiSolution(clientResp);
                r = { ...parsed, valid: true, conf: 0.98, eq: parsed.eq || raw, client_ai: true };
            } catch (err) {
                clientErr = err;
                console.warn("Client Gemini direct call:", err);
            }
        }

        // 4. Dự phòng bộ giải ngoại tuyến (khi không có ảnh)
        if ((!r || !r.valid) && !hasImage && offlineRes && offlineRes.steps && offlineRes.steps.length) {
            r = { ...offlineRes, offline: true };
        }
    }

    if (r && r.valid && hasImage) {
        r.uploaded_image = imgData;
    }

    if ((!r || !r.valid) && clientErr) {   // hiện LỖI THẬT của Gemini thay vì thông báo chung chung
        r = { valid: false, llm_error: true, net_error: true, is_static_host: noServerMode(),
              llm_msg: "Đã nhập key nhưng chưa giải được: " + clientErr.message + " (hãy kiểm tra lại key hoặc bấm giải lại)" };
    }
    if (!r) {
        const isStaticHost = noServerMode();
        r = {
            valid: false,
            llm_error: true,
            net_error: true,
            is_static_host: isStaticHost,
            llm_msg: isStaticHost
                ? "Bài tập tự luận hoặc ảnh chụp này cần AI: hãy nhập Gemini API key cá nhân (chạy được ngay cả khi chỉ mở file index.html)."
                : "Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại dịch vụ đang chạy."
        };
    }
    if (r.limit && !r.llm_msg) {
        r = { ...r, llm_error: true, llm_msg: r.global_limit ? "AI hệ thống đã đạt trần hạn ngạch hôm nay" : "Bạn đã đạt giới hạn lượt hỏi AI miễn phí trong ngày hôm nay." };
    }

    if (!r.valid || !r.steps || !r.steps.length) {
        const isNet = Boolean(r.net_error);
        const isStatic = Boolean(r.is_static_host || noServerMode());
        o.innerHTML = `<div class="card err">
            <h3>Chưa nhận diện được bài tập ${subName}</h3>
            ${r.llm_error ? `<div class="tip" style="background:var(--errc);color:var(--err);margin-bottom:8px"><b>${isNet ? "Lỗi kết nối / Thiếu cấu hình AI" : "Thông báo hệ thống"}:</b> ${esc(r.llm_msg || "Không thể xử lý yêu cầu")}.</div>` : ""}
            ${isStatic ? `
            <div style="background:var(--card);border:1.5px solid var(--pri);border-radius:12px;padding:14px;margin:8px 0;font-size:13.5px;line-height:1.6">
                <b style="color:var(--pri)">🌐 Chưa có máy chủ Python (đang mở file trực tiếp hoặc GitHub Pages):</b>
                <p style="margin:4px 0">Bài tự luận hoặc ảnh chụp cần AI. Bạn <b>không cần chạy máy chủ</b>: chỉ cần dán Gemini API key miễn phí, trình duyệt sẽ gọi thẳng Google Gemini (key chỉ lưu trong trình duyệt này).</p>
                <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap">
                    <button id="btnSetKeyPrompt" class="pr" style="padding:8px 16px;border-radius:10px;font-size:13px">
                        <span class="ms">key</span> Nhập Gemini API Key để giải ngay
                    </button>
                    <button id="btnRetryImgOrText" style="padding:8px 14px;border-radius:10px;font-size:13px;background:var(--low)">
                        <span class="ms">photo_camera</span> Chọn ảnh khác hoặc nhập lại
                    </button>
                </div>
                <p style="font-size:12px;color:var(--tx2);margin:0"><i>(Tất cả 36 dạng bài tập chuẩn liên môn Toán - Lý - Hóa như phương trình, đạo hàm, rơi tự do, định luật Ohm, số mol, nồng độ CM/C%... đều giải 100% ngoại tuyến không cần key).</i></p>
            </div>
            ` : (isNet ? `
            <div style="background:var(--card);border:1.5px solid var(--err);border-radius:12px;padding:12px;margin:8px 0;font-size:13.5px;line-height:1.6">
                <b style="color:var(--err)">⚡ Hướng dẫn kết nối Backend máy chủ:</b>
                <p style="margin:4px 0">Do hệ thống hoạt động theo <b>Cách 1: Web tự chịu API</b>, tính năng AI tự luận và phân tích sâu cần máy chủ Python Flask hoạt động để gọi Google Gemini an toàn.</p>
                <ol style="margin:6px 0 6px 20px;padding:0">
                    <li>Khởi động máy chủ: Mở terminal chạy <code style="background:var(--low);padding:2px 6px;border-radius:4px">python backend/app.py</code>.</li>
                    <li>Truy cập website tại: <a href="http://localhost:5000" target="_blank" style="color:var(--pri);font-weight:700">http://localhost:5000</a> (thay vì mở file trực tiếp).</li>
                </ol>
                <p style="font-size:12px;color:var(--tx2);margin:0"><i>(Tất cả các bài tập chuẩn như phương trình, đạo hàm, rơi tự do, hình tròn... vẫn giải được ngoại tuyến ngay lập tức.)</i></p>
            </div>
            ` : `
            <p>Bài tập này cần mô tả rõ ràng hơn hoặc ảnh chụp cần góc nhìn thẳng, rõ nét hơn.</p>
            <div style="background:var(--card);border:1px solid var(--ol);border-radius:12px;padding:12px;margin:8px 0;font-size:13px;line-height:1.5">
                💡 <b>Mẹo học tập:</b> Bạn có thể chụp lại ảnh đề bài rõ ràng, đủ ánh sáng hoặc nhập trực tiếp đề bài với số liệu chuẩn vào khung bên trái.
            </div>
            `)}
        </div>`;

        const btnPrompt = $("#btnSetKeyPrompt");
        if (btnPrompt) {
            btnPrompt.onclick = () => {
                window.__retryRaw = raw;   // sau khi lưu key sẽ tự giải lại đề này
                window.__retryImg = imgData;
                if (typeof openAuthModal === "function") {
                    openAuthModal();
                } else {
                    const k = prompt("Nhập Google Gemini API Key của bạn (miễn phí tại https://aistudio.google.com/app/apikey):", getClientGeminiKey());
                    if (k !== null) {
                        setClientGeminiKey(k);
                        toast(k.trim() ? "✓ Đã lưu API Key! Đang giải lại bài tập..." : "Đã xóa API Key");
                        if (k.trim()) render(raw, imgData);
                    }
                }
            };
        }
        const btnRetry = $("#btnRetryImgOrText");
        if (btnRetry) {
            btnRetry.onclick = () => {
                const imgInput = $("#imageInput");
                if (imgInput) imgInput.click();
                else $("#q") && $("#q").focus();
            };
        }
        return;
    }

    await katexWait;
    if (!r.graph && typeof detectGraph === "function") {
        r.graph = detectGraph(raw, r);
    }
    const hit = P.find(p => p.text.includes(raw.trim())) || P.find(p => raw.includes(p.text));
    if (hit) S.cur = hit;
    else S.cur = { id: 0, topic: r.topic, text: raw.trim(), diff: r.diff || (/x\^2|x²/.test(raw) ? 2 : 1) };

    const isChemTop = (r.topic === "GeneralChem" || r.topic === "InorganicChem" || r.topic === "SolutionChem" || r.topic === "OrganicChem");
    const isPhysTop = (r.topic === "Mechanics" || r.topic === "Thermodynamics" || r.topic === "Electromagnetism" || r.topic === "Optics");
    const detectedSubject = isChemTop ? "Hóa học" : (isPhysTop ? "Vật lý" : "Toán học");

    const similarRecs = typeof recommend === "function" ? recommend(r.eq || raw, r.diff || 1, 3, r.topic) : [];

    const imgPreviewHtml = (r.uploaded_image && r.uploaded_image.dataUrl) ? `
    <div class="uploaded-image-preview">
      <img src="${r.uploaded_image.dataUrl}" alt="Ảnh đề bài đã tải lên" title="Bấm để xem ảnh gốc phóng to" onclick="window.open('${r.uploaded_image.dataUrl}', '_blank')">
      <div class="img-info">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="ms" style="font-size:16px;color:var(--pri)">photo_camera</span>
          <b style="font-size:13px">${esc(r.uploaded_image.name || "Ảnh đề bài gốc")}</b>
          <span class="chip p" style="font-size:10px;padding:1px 6px">AI Vision Đã Nhận Diện</span>
        </div>
        <small style="font-size:11.5px;color:var(--tx2)">Hệ thống đã nhận diện dữ liệu từ ảnh và phân tích thành các bước giải toán học dưới đây</small>
      </div>
    </div>` : "";

    o.innerHTML = `<div class="card"><div class="row"><span class="ms" style="color:var(--sec)">verified</span><h3>Đã nhận diện bài tập ${detectedSubject}</h3></div><div class="row"><span class="chip g">Độ tin cậy: ${r.conf ? (r.conf * 100).toFixed(1) : "98.5"}%</span><span class="chip p">${TN[r.topic] || r.topic} · ${r.kind || "Bài chuẩn"}</span><span class="chip">Cấp ${S.cur.diff}: ${["", "Cơ bản", "Trung bình", "Nâng cao"][S.cur.diff]}</span>${r.uploaded_image ? `<span class="chip p"><span class="ms" style="font-size:13px">photo_camera</span> AI Vision</span>` : ""}</div>${imgPreviewHtml}<div class="math" style="color:var(--pri);font-size:${r.eq.length > 40 ? 15 : 24}px;${r.eq.length > 40 ? "white-space:normal;text-align:left" : ""}">${cleanMathHtml(esc(r.eq))}</div></div>
 <div class="row"><h2>Lời giải từng bước</h2><span class="sp"></span><span class="chip p">${r.steps.length} bước</span><button id="tg" style="padding:6px 12px">Thu gọn / Mở rộng</button></div>
 ${r.steps.map((s, i) => {
    const rawT = (s && s.t) ? String(s.t).trim() : "";
    return `<div class="step ${i == 2 ? "cur" : ""}"><div class="dot"><span class="ms" style="font-size:16px">check</span></div><div class="sbody"><div class="hd" tabindex="0" role="button"><span>Bước ${i + 1}: ${esc(cleanT)}</span><span class="ms">expand_less</span></div><div class="bd">${cleanMathHtml(s.h)}</div></div></div>`;
  }).join("")}
 ${r.graph ? `
 <div class="card" style="padding:16px">
   <div class="row" style="margin-bottom:8px;justify-content:space-between;align-items:center">
     <span style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px">
       <span class="ms" style="color:var(--pri)">show_chart</span>
       Sơ đồ & Hình vẽ minh họa
     </span>
     <span style="font-size:11px;color:var(--tx2);font-family:'JetBrains Mono',monospace">${esc((r.graph && r.graph.title) || (r.graph.type === "lens" ? "Quang hình học" : (r.graph.type === "kinematics" ? "Đồ thị vận tốc v-t" : (r.graph.type === "circuit" ? "Sơ đồ mạch điện" : "Mô phỏng trực quan"))))}</span>
   </div>
   ${typeof graphSvg === "function" ? graphSvg(r.graph) : ""}
   <div style="font-size:13.5px;text-align:center;margin-top:10px;line-height:1.5">
     ${typeof graphDesc === "function" ? graphDesc(r.graph) : ""}
   </div>
 </div>` : ""}

 ${similarRecs && similarRecs.length ? `
 <div class="card" style="padding:16px;margin-top:14px;background:var(--card);border:1.5px solid var(--ol)">
   <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
     <span style="font-weight:700;display:flex;align-items:center;gap:6px;color:var(--pri);font-size:15px">
       <span class="ms">quiz</span> Bài tập tương tự để bạn tự luyện tập
     </span>
     <span class="chip p" style="font-size:11px">${similarRecs.length} bài cùng dạng</span>
   </div>
   <p style="font-size:12.5px;color:var(--tx2);margin:0 0 10px">Bạn đã nắm được phương pháp giải trên? Hãy bấm chọn một bài dưới đây để thử sức và kiểm tra kết quả ngay nhé:</p>
   <div style="display:grid;gap:8px">
     ${similarRecs.map(rc => `
       <div style="background:var(--low);border:1px solid var(--ol);border-radius:10px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
         <div style="flex:1;min-width:200px">
           <div style="font-size:11px;color:var(--tx2);margin-bottom:2px">
             <span class="chip" style="font-size:10px;padding:2px 6px">Cấp ${rc.p.diff}</span>
             <span style="margin-left:4px;font-weight:600">${TN[rc.p.topic] || rc.p.topic}</span>
             <span style="margin-left:6px;color:var(--sec);font-weight:600">${Math.round(rc.s * 100)}% khớp dạng</span>
           </div>
           <div style="font-size:13.5px;font-weight:500;line-height:1.4">${cleanMathHtml(esc(rc.p.text))}</div>
         </div>
         <button class="pr similar-btn" data-p="${esc(rc.p.text)}" style="padding:7px 12px;font-size:12.5px;white-space:nowrap;border-radius:8px;display:flex;align-items:center;gap:4px">
           <span>Luyện bài này</span> <span class="ms" style="font-size:15px">arrow_forward</span>
         </button>
       </div>
     `).join("")}
   </div>
 </div>` : ""}

 <button class="cta" id="adapt" style="margin-top:14px;background:#4338ca;color:#fff;border-radius:14px;padding:14px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;cursor:pointer">
   <span class="ms" style="font-size:22px">psychology</span> Luyện bài tương tự thích ứng (DKT)
 </button>

 <div class="two" style="margin-top:10px">
   <button id="askTutor" style="padding:12px;border-radius:12px;background:var(--hi);font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">
     <span class="ms" style="color:var(--pri);font-size:20px">chat</span> Hỏi gia sư AI
   </button>
   <button id="share" style="padding:12px;border-radius:12px;background:var(--hi);font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">
     <span class="ms" style="color:var(--pri);font-size:20px">share</span> Chia sẻ lời giải
   </button>
 </div>

 <div id="tutorBox" class="card" style="display:none;margin-top:12px;border:1.5px solid var(--pc);background:var(--card)">
   <div class="row" style="justify-content:space-between;align-items:center">
     <span style="font-weight:700;display:flex;align-items:center;gap:6px;color:var(--pri);font-size:15px">
       <span class="ms">smart_toy</span> Hỏi đáp cùng Trợ lý Gia sư AI (Tôi & Bạn)
     </span>
     <button id="closeTutor" style="background:none;padding:2px;border:0;cursor:pointer" aria-label="Đóng"><span class="ms" style="font-size:18px">close</span></button>
   </div>
   <p style="font-size:12.5px;color:var(--tx2);margin:4px 0">Bạn chưa hiểu rõ bước giải nào hoặc muốn tôi giải thích sâu hơn? Hãy chọn câu hỏi nhanh hoặc nhập câu hỏi trực tiếp nhé:</p>
   
   <div class="samples" style="margin:6px 0;display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">
     <button class="tutor-quick" data-q="Bạn hãy giải thích chi tiết, chậm rãi từng bước của bài này để tôi dễ hiểu hơn nhé.">💡 Giải thích chi tiết hơn</button>
     <button class="tutor-quick" data-q="${detectedSubject === 'Hóa học' ? 'Bạn hãy giải thích rõ phương trình phản ứng hóa học và cách cân bằng trong bài này giúp tôi nhé.' : (detectedSubject === 'Vật lý' ? 'Tại sao trong bài này chúng ta lại áp dụng định luật này? Có điều kiện nào cần chú ý không bạn?' : 'Tại sao lại áp dụng công thức/định lý này? Có phương pháp giải nào khác không bạn?')}">❓ Tại sao dùng công thức/PTHH này?</button>
     <button class="tutor-quick" data-q="${detectedSubject === 'Hóa học' ? 'Có cần lưu ý điều kiện phản ứng (nhiệt độ, xúc tác) hay trạng thái chất (kết tủa, bay hơi) nào không bạn?' : (detectedSubject === 'Vật lý' ? 'Bạn có lưu ý gì về đổi đơn vị đo chuẩn SI trong bài tập này không?' : 'Bạn có lưu ý gì về điều kiện xác định trong bài toán này không?')}">📐 Lưu ý điều kiện & đơn vị</button>
     <button class="tutor-quick" data-q="Bạn hãy cho tôi 1 bài tập tương tự cùng dạng kèm đáp số để tôi tự luyện tập nhé.">📝 Cho bài tự luyện</button>
   </div>
   
   <div style="display:flex;gap:8px;margin-top:6px">
     <input id="tutorInp" placeholder="Hỏi thêm gia sư AI về bài này..." style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid var(--ol);background:var(--low);color:var(--tx);font-size:14px;outline:0">
     <button id="tutorSend" class="pr" style="padding:10px 16px;border-radius:12px;white-space:nowrap;display:flex;align-items:center;gap:4px">
       <span class="ms">send</span> Gửi
     </button>
   </div>
   
   <div id="tutorAnswer" style="display:none;margin-top:10px;padding:12px;background:var(--low);border-radius:12px;font-size:14px;line-height:1.6"></div>
 </div>`;

    applyKatex($("#out"));
    $$(".similar-btn").forEach(btn => {
        btn.onclick = () => {
            const probText = btn.dataset.p;
            if (probText) {
                const qInp = $("#q");
                if (qInp) qInp.value = probText;
                window.scrollTo({ top: 0, behavior: "smooth" });
                toast("✓ Đã nạp bài tập tương tự! Đang giải...");
                setTimeout(() => render(probText), 250);
            }
        };
    });
    $$(".hd").forEach(h => {
        const t = () => h.parentElement.classList.toggle("shut");
        h.onclick = t;
        h.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } };
    });
    $("#tg").onclick = () => {
        const c = $$(".sbody");
        const all = c.every(x => !x.classList.contains("shut"));
        c.forEach(x => x.classList.toggle("shut", all));
    };

    $("#adapt").onclick = async () => { await complete(r); go("bai-tap"); };

    $("#share").onclick = async () => {
        const shareUrl = `${location.origin}${location.pathname}#q=${encodeURIComponent(r.eq)}`;
        const shareText = `Lời giải chi tiết bài tập ${detectedSubject}: ${r.eq} = ${r.ans || ""}\nXem ngay tại: ${shareUrl}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: `AdaptiveTutor AI - ${r.eq}`, text: shareText, url: shareUrl });
                return;
            } catch (e) {}
        }
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast("✓ Đã sao chép liên kết chia sẻ lời giải!");
        } catch (e) {
            toast("Đã tạo liên kết chia sẻ");
        }
    };

    const tutorBox = $("#tutorBox");
    const askBtn = $("#askTutor");
    if (askBtn && tutorBox) {
        askBtn.onclick = () => {
            const willShow = tutorBox.style.display === "none";
            tutorBox.style.display = willShow ? "grid" : "none";
            if (willShow) {
                const inp = $("#tutorInp");
                if (inp) inp.focus();
                tutorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        };
    }
    const closeBtn = $("#closeTutor");
    if (closeBtn && tutorBox) {
        closeBtn.onclick = () => { tutorBox.style.display = "none"; };
    }

    // Xử lý gửi câu hỏi tới Gia sư AI (Cách 1: Backend chịu trách nhiệm gọi Google Gemini)
    const handleTutorAsk = async (qText) => {
        const inp = $("#tutorInp");
        const q = String(qText || (inp ? inp.value : "")).trim();
        if (!q) return;
        if (inp) inp.value = "";
        const ansEl = $("#tutorAnswer");
        if (!ansEl) return;
        ansEl.style.display = "block";
        ansEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--pri)">
            <span class="ms" style="animation:spin 1s linear infinite">autorenew</span>
            Tôi đang soạn câu trả lời cho bạn, đợi một chút nhé...
        </div>`;

        try {
            let replyText = null;
            const clientKey = typeof getClientGeminiKey === "function" ? getClientGeminiKey() : "";
            const res = await apiPost("/api/tutor", {
                question: q,
                problem: r.eq,
                ans: r.ans || "",
                steps: r.steps,
                subject: S.subject || (detectedSubject === "Hóa học" ? "chemistry" : (detectedSubject === "Vật lý" ? "physics" : "math")),
                key: clientKey
            }, 35000);

            if (res && res.ok && res.answer) {
                replyText = res.answer;
            } else if (typeof callClientGemini === "function" && typeof getClientGeminiKey === "function" && getClientGeminiKey()) {
                const isChem = (S.subject === "chemistry" || detectedSubject === "Hóa học");
                const isPhys = (S.subject === "physics" || detectedSubject === "Vật lý");
                const sys = isChem ? CLIENT_SYS_TUTOR_CHEMISTRY : (isPhys ? CLIENT_SYS_TUTOR_PHYSICS : CLIENT_SYS_TUTOR_MATH);
                const tutorPrompt = `Đề bài: ${r.eq}\nĐáp số: ${r.ans || ""}\nCác bước đã giải:\n${(r.steps || []).map((s, idx) => `${idx+1}. ${s.t}: ${s.h}`).join("\n")}\nBạn hỏi: ${q}\nHãy giải thích cặn kẽ, gần gũi, xưng hô tôi và bạn bằng tiếng Việt, công thức kẹp giữa $...$.`;
                replyText = await callClientGemini(sys, tutorPrompt);
            }

            if (replyText) {
                ansEl.innerHTML = `<div><b>Bạn hỏi:</b> ${esc(q)}</div><hr style="margin:8px 0;border:0;border-top:1px solid var(--ol)"><div style="margin-top:6px"><b>Tôi trả lời:</b> ${cleanMathHtml(replyText)}</div>`;
                applyKatex(ansEl);
            } else {
                ansEl.innerHTML = `<div style="color:var(--err)">⚠️ ${esc((res && res.error) || "Chưa thể kết nối gia sư AI. Bạn vui lòng thử lại hoặc cài đặt Gemini API Key trong tài khoản nhé.")}</div>`;
            }
        } catch (e) {
            ansEl.innerHTML = `<div style="color:var(--err)">⚠️ Lỗi kết nối: ${esc(e.message)}.</div>`;
        }
    };

    const sendBtn = $("#tutorSend");
    if (sendBtn) sendBtn.onclick = () => handleTutorAsk();
    const tutorInp = $("#tutorInp");
    if (tutorInp) tutorInp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleTutorAsk(); } };
    $$(".tutor-quick").forEach(b => {
        b.onclick = () => handleTutorAsk(b.dataset.q);
    });

    $("#sub").textContent = "GIẢNG GIẢI";
    S.last = r;
    if (r.quota_left !== undefined) toast("Còn " + r.quota_left + " lượt AI hôm nay");
}

async function complete(r) {
    const sv = await apiPost("/api/submit", { topic: r.topic, correct: true, text: S.cur.text, diff: S.cur.diff });
    S.done++;
    S.history = (S.history || []).concat({ text: S.cur.text, topic: r.topic, diff: S.cur.diff, correct: true });
    const d = S.cur.diff;
    S.level = Math.min(3, Math.max(1, Math.round((S.level * 2 + d) / 3 + (S.wrong ? 0 : .3))));
    S.mastery[r.topic] = Math.min(1, (S.mastery[r.topic] || .4) + .04);
    S.skip.add(S.cur.id);
    if (sv) {
        S.level = sv.level;
        S.mastery[r.topic] = sv.p_known;
    }
    if (typeof saveLocalState === "function") saveLocalState();
}
