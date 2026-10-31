/* Bộ giải liên môn Toán học & Vật lý & Hóa học 36 dạng chuẩn, vẽ đồ thị & sơ đồ quang học, mạch điện */
const f = n => Number.isInteger(+Number(n).toFixed(6)) ? String(Math.round(n)) : String(+Number(n).toFixed(3));
const sg = n => n < 0 ? `− ${f(-n)}` : `+ ${f(n)}`;
const co = s => s === "" || s === "+" ? 1 : s === "-" ? -1 : parseInt(s, 10);
const math_ = h => {
  const s = String(h).trim();
  const inner = s.startsWith("$") ? s : `$$${s}$$`;
  return `<div class="math">${inner}</div>`;
};
const concept = (title, desc) => `<div class="concept"><b>${title}:</b> ${desc}</div>`;
const ok = h => `<div class="ok" style="font-size:20px">${h}</div>`;
const gcd2 = (a, b) => b ? gcd2(b, a % b) : Math.abs(a);
const frStr = (num, den) => {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd2(num, den);
  num /= g; den /= g;
  return den === 1 ? String(num) : `${num}/${den}`;
};
const numlist = t => (t.match(/\d+(?:\.\d+)?/g) || []).map(Number);
const sup = n => n === 1 ? "x" : n === 0 ? "" : `x^${n}`;

function getVar(pattern, text, def = null) {
  const m = text.match(pattern);
  return m ? parseFloat(m[1]) : def;
}

/* ---------- Toán học: Phân số & Đa thức ---------- */
const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd2(n, d) || 1; return { n: n / g, d: d / g }; };
const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qDiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qStr = q => q.d === 1 ? String(q.n) : `${q.n}/${q.d}`;
const decQ = str => { const dec = (str.split(".")[1] || "").length; return Q(Math.round(parseFloat(str) * 10 ** dec), 10 ** dec); };

function parseNumQ(str) {
  str = String(str || "").trim().replace(/−/g, "-");
  if (str.includes("/")) {
    const parts = str.split("/");
    return Q(parseInt(parts[0], 10), parseInt(parts[1], 10));
  }
  if (str.includes(".")) return decQ(str);
  return Q(parseInt(str, 10), 1);
}

function evalPolyQ(P, xQ) {
  let res = Q(0);
  for (const [degStr, coefQ] of Object.entries(P)) {
    const k = parseInt(degStr, 10);
    let xPow = Q(1);
    for (let i = 0; i < k; i++) xPow = qMul(xPow, xQ);
    res = qAdd(res, qMul(coefQ, xPow));
  }
  return res;
}

function parsePoly(expr) {
  const e = expr.replace(/\s+/g, "").replace(/−/g, "-").replace(/²/g, "^2").replace(/³/g, "^3").replace(/·/g, "*").toLowerCase().replace(/[.?;,]$/, "");
  if (!e || !/^[0-9x^+\-*.]+$/.test(e) || e.includes("^-") || e.includes("**")) return null;
  const s = e[0] === "+" || e[0] === "-" ? e : "+" + e;
  const poly = {};
  const re = /([+-])([^+-]*)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const sign = m[1], body = m[2];
    if (!body) return null;
    const tm = body.match(/^(\d+(?:\.\d+)?)?\*?(x(?:\^(\d+))?)?$/);
    if (!tm || (!tm[1] && !tm[2])) return null;
    const coef = tm[1] ? (tm[1].includes(".") ? decQ(tm[1]) : Q(parseInt(tm[1], 10))) : Q(1);
    const exp = tm[2] ? (tm[3] ? parseInt(tm[3], 10) : 1) : 0;
    if (exp > 20) return null;
    const signed = sign === "-" ? Q(-coef.n, coef.d) : coef;
    poly[exp] = poly[exp] ? qAdd(poly[exp], signed) : signed;
  }
  return poly;
}

function fmtPoly(P) {
  const exps = Object.keys(P).map(Number).sort((a, b) => b - a);
  const parts = [];
  for (const n of exps) {
    const q = P[n];
    if (q.n === 0) continue;
    const sign = q.n < 0 ? "−" : "+";
    const absN = Math.abs(q.n);
    const varPart = n === 0 ? "" : (n === 1 ? "x" : `x^${n}`);
    const coefPart = (absN !== 1 || n === 0) ? (q.d === 1 ? String(absN) : `${absN}/${q.d}`) : "";
    parts.push({ sign, term: coefPart + varPart });
  }
  if (!parts.length) return "0";
  return (parts[0].sign === "−" ? "−" : "") + parts[0].term + parts.slice(1).map(p => ` ${p.sign} ${p.term}`).join("");
}

function polyExprFromText(text) {
  let t = text.trim();
  if (/[a-zA-Z]\s*(?:\(\s*x\s*\))?\s*['′’]\s*(?:\(\s*x\s*\))?\s*=/.test(t)) return null;
  if (t.includes("=")) t = t.split("=").pop();
  else if (/\bcủa\b/i.test(t)) t = t.split(/\bcủa\b/i).pop();
  return parsePoly(t);
}

function polyEquation(t) {
  if ((t.match(/=/g) || []).length !== 1) return null;
  const [l, r] = t.split("=");
  const L = parsePoly(l), R = parsePoly(r);
  if (!L || !R) return null;
  const P = {};
  const allExp = new Set([...Object.keys(L), ...Object.keys(R)].map(Number));
  for (const k of allExp) {
    const lk = L[k] || Q(0), rk = R[k] || Q(0);
    const diff = qSub(lk, rk);
    if (diff.n !== 0) P[k] = diff;
  }
  const deg = Math.max(0, ...Object.keys(P).map(Number));
  if (deg > 2) return null;
  const eq = `${fmtPoly(P)} = 0`;
  const steps = [{ t: "Đưa về dạng chuẩn", h: math_(eq) }];
  const a = P[2] || Q(0), b = P[1] || Q(0), c = P[0] || Q(0);
  if (deg === 0) {
    const ans = !Object.keys(P).length ? "Vô số nghiệm (mọi x đều thỏa)" : "Vô nghiệm";
    steps.push({ t: "Kết luận", h: ok(ans) });
    return { ans, steps };
  }
  if (deg === 1) {
    const x = qDiv(Q(-c.n, c.d), b);
    const ans = `x = ${qStr(x)}`;
    steps.push(
      { t: "Giải phương trình bậc nhất", h: math_(`x = −c / b = ${qStr(Q(-c.n, c.d))} / ${qStr(b)}`) },
      { t: "Kết luận", h: ok(ans) }
    );
    return { ans, steps };
  }
  const b2 = qMul(b, b), fourAC = qMul(Q(4), qMul(a, c)), delta = qSub(b2, fourAC);
  steps.push({ t: "Tính biệt thức Δ", h: math_(`a = ${qStr(a)}, b = ${qStr(b)}, c = ${qStr(c)}<br>Δ = b² − 4ac = ${qStr(delta)}`) });
  if (delta.n < 0) {
    const ans = "Vô nghiệm thực";
    steps.push({ t: "Kết luận", h: "<p>Δ &lt; 0 nên phương trình không có nghiệm thực.</p>" + ok(ans) });
    return { ans, steps };
  }
  const dVal = delta.n / delta.d;
  const sq = Math.sqrt(dVal);
  if (sq === 0) {
    const x = qDiv(Q(-b.n, b.d), qMul(Q(2), a));
    const ans = `x = ${qStr(x)}`;
    steps.push({ t: "Nghiệm kép", h: ok(ans) });
    return { ans, steps };
  }
  const x1 = (-b.n / b.d - sq) / (2 * (a.n / a.d));
  const x2 = (-b.n / b.d + sq) / (2 * (a.n / a.d));
  const ans = `x₁ = ${f(x1)}, x₂ = ${f(x2)}`;
  steps.push({ t: "Tìm nghiệm", h: math_("x = (−b ± √Δ) / 2a") + ok(ans) });
  return { ans, steps };
}

function safeArith(text) {
  let t = text.toLowerCase().replace(/×/g, "*").replace(/÷/g, "/").replace(/:/g, "/").replace(/−/g, "-").replace(/,/g, ".");
  t = t.replace(/^[^0-9(\-]*/, "").replace(/[=?\s]*$/, "").replace(/\s+/g, "");
  if (!t || !/^[0-9.+\-*/()]+$/.test(t) || !/\d\s*[-+*/]/.test(t)) return null;
  try {
    const val = Function(`"use strict"; return (${t});`)();
    return typeof val === "number" && !isNaN(val) && isFinite(val) ? val : null;
  } catch (e) { return null; }
}

const META = {
  // Toán học
  linear: ["Algebra", "Phương trình bậc 1", 1],
  quad: ["Algebra", "Phương trình bậc 2", 2],
  circle: ["Geometry", "Hình tròn", 2],
  deriv: ["Calculus", "Đạo hàm", 3],
  minmax_interval: ["Calculus", "GTLN & GTNN trên đoạn", 3],
  arith: ["Arithmetic", "Toán đố & Số học", 1],
  system: ["Algebra", "Hệ phương trình", 2],
  ineq: ["Algebra", "Bất phương trình", 2],
  percent: ["Arithmetic", "Phần trăm", 1],
  frac: ["Arithmetic", "Phân số", 2],
  gcd: ["Arithmetic", "ƯCLN / BCNN", 1],
  geom: ["Geometry", "Hình phẳng & Pythagore", 2],
  integ: ["Calculus", "Nguyên hàm", 3],
  // Vật lý
  kinematics: ["Mechanics", "Chuyển động biến đổi đều", 1],
  freefall: ["Mechanics", "Rơi tự do", 1],
  newton2: ["Mechanics", "Định luật II Newton", 2],
  work_power: ["Mechanics", "Công và Công suất", 2],
  energy: ["Mechanics", "Động năng và Thế năng", 2],
  gas_law: ["Thermodynamics", "Định luật chất khí (Boyle)", 2],
  thermal: ["Thermodynamics", "Nhiệt lượng và Truyền nhiệt", 1],
  ohm: ["Electromagnetism", "Định luật Ohm", 1],
  elec_power: ["Electromagnetism", "Công suất & Điện năng", 2],
  coulomb: ["Electromagnetism", "Lực tương tác Cu-lông", 2],
  lens: ["Optics", "Thấu kính mỏng", 3],
  refraction: ["Optics", "Khúc xạ ánh sáng", 2],
  proof: ["Algebra", "Bài tập tự luận & Chứng minh", 3],
  // Hóa học
  chem_mol: ["GeneralChem", "Tính số mol & Khối lượng", 1],
  chem_gas: ["GeneralChem", "Thể tích khí ĐKTC", 1],
  chem_conc_mol: ["SolutionChem", "Nồng độ mol dung dịch CM", 2],
  chem_conc_pct: ["SolutionChem", "Nồng độ phần trăm C%", 1],
  chem_ph: ["SolutionChem", "Tính pH dung dịch", 2],
  chem_eq: ["InorganicChem", "Cân bằng PTHH", 2],
  chem_metal_acid: ["InorganicChem", "Kim loại tác dụng Axit", 2],
  chem_mass_cons: ["GeneralChem", "Bảo toàn khối lượng", 1],
  chem_yield: ["InorganicChem", "Hiệu suất phản ứng", 2],
  chem_precip: ["InorganicChem", "Phản ứng tạo kết tủa", 2],
  chem_elem_pct: ["GeneralChem", "Phần trăm khối lượng nguyên tố", 2],
  chem_molar_mass: ["GeneralChem", "Khối lượng mol M", 1],
};

function classify(raw) {
  const l = raw.toLowerCase().replace(/\s+/g, "");
  // 0. Ưu tiên Toán học giải tích có từ khóa rõ ràng
  if (/(?:giá\s*trị\s*(?:lớn|nhỏ)\s*nhất|gtln|gtnn|max|min)/i.test(raw) && (/\[\s*[-+]?\d+.*?[;,].*?[-+]?\d+.*?\]/.test(raw) || /trên\s*đoạn/i.test(raw))) return "minmax_interval";

  // 1. Nhận diện Hóa học
  if (/cânbằng|phươngtrìnhhóahọc|pthh|al\s*\+\s*o2|fe\s*\+\s*o2|al\s*\+\s*hcl|fe\s*\+\s*hcl|zn\s*\+\s*hcl|c6h5nh2|c6h5oh|anilin|phenol/i.test(l)) return "chem_eq";
  if (/\+|->|→/.test(raw) && /c6h5nh2|c6h5oh|anilin|phenol|br2|ch3cooh|c2h5oh|c2h4|c2h2|c6h6/i.test(l)) return "chem_eq";
  if (/tácdụng.*axit|hcl|h2so4|kimloại.*sinhrakhí|thểtíchkhíh2|h2sinhra/.test(l) && /al|fe|zn|mg|natri|nhôm|sắt|kẽm|magie/.test(l)) return "chem_metal_acid";
  if (/nồngđộmol|c_m|mol\/l|mol\/lít/.test(l) || /\bC_?M\b|\b\d+(?:\.\d+)?\s*M\b/.test(raw)) return "chem_conc_mol";
  if (/nồngđộphầntrăm|cphầntrăm/.test(l) || /\bC%\b|\b\d+(?:\.\d+)?\s*%\b/.test(raw)) return "chem_conc_pct";
  if (/(?:ph\s*=|tính\s*ph|chỉ\s*số\s*ph|độ\s*ph|dung\s*dịch\s*có\s*ph|\[h\+\]|\[oh\-\]|quỳ\s*tím)/i.test(raw)) return "chem_ph";
  if (/thểtích.*đktc|lítkhí.*đktc|lítkhíởđktc|vkhí|khíởđktc|đkc|22\.4/.test(l)) return "chem_gas";
  if (/kếttủa|baso4|agcl|caco3|kếttủatrắng/.test(l)) return "chem_precip";
  if (/bảotoànkhốilượng|đlbtkl|khốilượng.*phảnứng|đốtcháy.*thuđược/.test(l)) return "chem_mass_cons";
  if (/hiệusuất|h%|thựctế.*lýthuyết/.test(l)) return "chem_yield";
  if (/phầntrămkhốilượngnguyêntố|%khốilượngcủa|%cu|%fe|%o|%ca/.test(l)) return "chem_elem_pct";
  if (/xácđịnhkimloại|khốilượngmolm|tênkimloại/.test(l)) return "chem_molar_mass";
  if (/sốmol|tínhmol|gam.*mol|mol.*gam|m=n\*m|n=m\/m/.test(l) || (/tính.*khốilượng/.test(l) && /mol/.test(l))) return "chem_mol";
  if (/\d+gam|\d+g\b/.test(raw) && /nhôm|sắt|đồng|kẽm|magie|natri|canxi|al|fe|cu|zn|mg|na|h2o|co2|o2|h2|naoh|hcl|h2so4|caco3/.test(l)) return "chem_mol";
  // 2. Nhận diện Vật lý
  if (/rơitựdo|thảrơi|rơitừđộcao|chạmđất/.test(l)) return "freefall";
  if (/cu-lông|coulomb|điệntíchđiểm|q1|q2|tĩnhđiện/.test(l)) return "coulomb";
  if (/thấukính|tiêucự|vậtsángab|quangtâm|d'|ảnhthật|ảnhảo/.test(l)) return "lens";
  if (/khúcxạ|chiếtsuất|góctới|gócgiớihạn|snell/.test(l)) return "refraction";
  if (/khílýtưởng|boyle|đẳngnhiệt|xilanh|p1|v1/.test(l)) return "gas_law";
  if (/nhiệtlượng|đunsôi|nhiệtdungriêng|làmnóng|làmnguội|q=/.test(l)) return "thermal";
  if (/côngsuấtđiện|điệnnăng|kwh|bóngđèn/.test(l)) return "elec_power";
  if (/địnhluậtohm|điệntrởr|hiệuđiệnthếu|cườngđộdòngđiện|\bu=\d+/.test(l) && !/x=/.test(l)) return "ohm";
  if (/độngnăng|thếnăng|cơnăng|wđ|wt/.test(l)) return "energy";
  if (/cônga|côngsuấtp|kéovật|côngcơhọc/.test(l) && !/hàm|phươngtrình/.test(l)) return "work_power";
  if (/địnhluậtii|địnhluật2|newton|hợplực/.test(l) || /\bf=\d+.*m=\d+/.test(raw)) return "newton2";
  if (/nhanhdầnđều|chậmdầnđều|hãmphanh|v0|giatốca/.test(l)) return "kinematics";

  // 2. Nhận diện Toán học
  if (/(?:giá\s*trị\s*(?:lớn|nhỏ)\s*nhất|gtln|gtnn|max|min)/i.test(raw) && (/\[\s*[-+]?\d+.*?[;,].*?[-+]?\d+.*?\]/.test(raw) || /trên\s*đoạn/i.test(raw))) return "minmax_interval";
  if (/hìnhthoi/i.test(l) && (/trungđiểm/.test(l) || /cùngnằmtrên/.test(l) || /đườngtròn/.test(l) || /chứngminh/.test(l))) return "proof";
  if (/nguyênhàm|∫/.test(l)) return "integ";
  if (/đạohàm|y'/.test(l) || /^[yf](\(x\))?=/.test(l)) return "deriv";
  if (/ưcln|ucln|bcnn|gcd|lcm|bộichung|ướcchung/.test(l)) return "gcd";
  if (/%|phầntrăm/.test(l)) return "percent";
  if (/\d+\/\d+\s*[\+\-\*×\:]\s*\d+\/\d+/.test(raw) || /phânsố/.test(l)) return "frac";
  if (/hệphươngtrình/.test(l) || (raw.includes("và") && raw.includes("=") && /x.*y/.test(raw))) return "system";
  if (/[><≥≤]|>=|<=/.test(raw) && !/thấukính|tamgiác/.test(l)) return "ineq";
  if (/hìnhtròn|bánkính|chuvi.*tròn|diệntích.*tròn|r=\d+/.test(l)) return "circle";
  if (/chữnhật|tamgiác|cạnhhuyền|pytago/.test(l)) return "geom";
  if (/x\^2|x²/.test(raw)) return "quad";
  if (/x.*=|=.*x/.test(raw)) return "linear";
  if (/\d+/.test(raw) && (l.includes("hỏi") || l.includes("có") || l.includes("mua") || l.includes("còn"))) return "arith";
  return "linear";
}

function solve(text) {
  const raw = (text || "").trim();
  const label = classify(raw);
  const [topic, kind, diff] = META[label] || ["Algebra", "Toán học", 1];
  const mCore = text.match(/(?:^|\s)(-?\d*x(?:\^|\s|[+\-=]).*)$/i);
  const core = (mCore ? mCore[1] : text).trim();
  const t = core.replace(/\s+/g, "").replace(/−/g, "-").replace(/²/g, "^2").toLowerCase();
  const res = { topic, kind, diff, eq: ["linear", "quad", "system", "ineq"].includes(label) ? core : text.trim(), steps: [], ans: null, graph: null, valid: false };
  const steps = res.steps;
  const tLower = text.toLowerCase();

  // ==================== 1. BÀI TẬP VẬT LÝ ====================
  // 1. Chuyển động biến đổi đều
  if (label === "kinematics") {
    const v0 = getVar(/v(?:_?0|o)?\s*=\s*(-?\d+(?:\.\d+)?)/i, text, 0.0);
    const a = getVar(/\ba\s*=\s*(-?\d+(?:\.\d+)?)/i, text);
    const tVal = getVar(/\bt\s*=\s*(\d+(?:\.\d+)?)/i, text);
    const v = getVar(/\bv\s*=\s*(-?\d+(?:\.\d+)?)/i, text);
    if (a !== null && tVal !== null) {
      const vEnd = v0 + a * tVal, sVal = v0 * tVal + 0.5 * a * (tVal ** 2);
      res.valid = true; res.ans = `v = ${f(vEnd)} m/s, s = ${f(sVal)} m`;
      res.graph = { type: "kinematics", v0, a, t: tVal, v: vEnd };
      steps.push(
        {
          t: "Tóm tắt dữ kiện đề bài", h: math_(`v_0 = ${f(v0)} \\text{ m/s}, \\quad a = ${f(a)} \\text{ m/s}^2, \\quad t = ${f(tVal)} \\text{ s}`)
            + concept("Khái niệm Chuyển động biến đổi đều", "Là chuyển động có gia tốc $a = \\text{const}$. Khi $a$ cùng chiều vận tốc ($a \\cdot v > 0$) là nhanh dần đều, ngược chiều là chậm dần đều.")
        },
        {
          t: "Tính vận tốc tức thời v", h: math_(`v = v_0 + at = ${f(v0)} + (${f(a)}) \\cdot ${f(tVal)} = ${f(vEnd)} \\text{ m/s}`)
            + concept("Phương trình vận tốc", "Vận tốc tức thời biến thiên tuyến tính theo thời gian: $v = v_0 + at$. Đơn vị chuẩn: mét trên giây $(\\text{m/s})$.")
        },
        {
          t: "Tính quãng đường đi được s", h: math_(`s = v_0 t + \\frac{1}{2} a t^2 = ${f(v0)} \\cdot ${f(tVal)} + 0.5 \\cdot (${f(a)}) \\cdot (${f(tVal)})^2 = ${f(sVal)} \\text{ m}`)
            + concept("Phương trình quãng đường", "Quãng đường phụ thuộc hàm bậc 2 của thời gian: $s = v_0 t + \\frac{1}{2} a t^2$. Đơn vị chuẩn: mét $(\\text{m})$.")
        },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (v !== null && a !== null && a !== 0) {
      const tVal = (v - v0) / a, sVal = (v ** 2 - v0 ** 2) / (2 * a);
      res.valid = true; res.ans = `t = ${f(tVal)} s, s = ${f(sVal)} m`;
      res.graph = { type: "kinematics", v0, a, t: tVal, v };
      steps.push(
        { t: "Tóm tắt dữ kiện", h: math_(`v_0 = ${f(v0)} \\text{ m/s}, \\quad v = ${f(v)} \\text{ m/s}, \\quad a = ${f(a)} \\text{ m/s}^2`) },
        { t: "Tính thời gian chuyển động t", h: math_(`t = \\frac{v - v_0}{a} = \\frac{${f(v)} - ${f(v0)}}{${f(a)}} = ${f(tVal)} \\text{ s}`) },
        {
          t: "Tính quãng đường s theo hệ thức độc lập", h: math_(`s = \\frac{v^2 - v_0^2}{2a} = \\frac{${f(v)}^2 - ${f(v0)}^2}{2 \\cdot ${f(a)}} = ${f(sVal)} \\text{ m}`)
            + concept("Hệ thức độc lập thời gian", "Công thức $v^2 - v_0^2 = 2as$ liên hệ trực tiếp giữa vận tốc, gia tốc và quãng đường mà không cần qua biến thời gian.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 2. Rơi tự do
  else if (label === "freefall") {
    const g = getVar(/\bg\s*=\s*(\d+(?:\.\d+)?)/i, text, tLower.includes("9.8") ? 9.8 : 10.0);
    const h = getVar(/\bh\s*=\s*(\d+(?:\.\d+)?)/i, text);
    const tVal = getVar(/\bt\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (h !== null) {
      const tR = Math.sqrt(2 * h / g), vR = Math.sqrt(2 * g * h);
      res.valid = true; res.ans = `t = ${f(tR)} s, v = ${f(vR)} m/s`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện đề bài", h: math_(`h = ${f(h)} \\text{ m}, \\quad g = ${f(g)} \\text{ m/s}^2`)
            + concept("Định luật rơi tự do", "Sự rơi tự do là sự rơi chỉ dưới tác dụng của trọng lực. Chuyển động thẳng nhanh dần đều theo phương thẳng đứng từ trên xuống dưới với gia tốc trọng trường $g$.")
        },
        {
          t: "Tính thời gian rơi t", h: math_(`t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{2 \\cdot ${f(h)}}{${f(g)}}} = ${f(tR)} \\text{ s}`)
            + concept("Công thức thời gian rơi", "Xuất phát từ phương trình độ cao $h = \\frac{1}{2}gt^2 \\implies t = \\sqrt{\\frac{2h}{g}}$. Thời gian rơi chỉ phụ thuộc vào độ cao $h$ và gia tốc $g$, không phụ thuộc khối lượng vật.")
        },
        {
          t: "Tính vận tốc chạm đất v", h: math_(`v = gt = \\sqrt{2gh} = \\sqrt{2 \\cdot ${f(g)} \\cdot ${f(h)}} = ${f(vR)} \\text{ m/s}`)
            + concept("Vận tốc tức thời khi chạm đất", "Vận tốc rơi tự do tăng tỉ lệ thuận với thời gian rơi: $v = gt = \\sqrt{2gh}$. Đơn vị chuẩn trong hệ SI là mét trên giây $(\\text{m/s})$.")
        },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (tVal !== null) {
      const hVal = 0.5 * g * (tVal ** 2), vVal = g * tVal;
      res.valid = true; res.ans = `h = ${f(hVal)} m, v = ${f(vVal)} m/s`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện", h: math_(`t = ${f(tVal)} \\text{ s}, \\quad g = ${f(g)} \\text{ m/s}^2`)
            + concept("Khái niệm rơi tự do", "Chuyển động thẳng nhanh dần đều không vận tốc đầu ($v_0 = 0$) dưới tác dụng của trọng trường.")
        },
        { t: "Tính độ cao thả rơi h", h: math_(`h = \\frac{1}{2} g t^2 = 0.5 \\cdot ${f(g)} \\cdot (${f(tVal)})^2 = ${f(hVal)} \\text{ m}`) },
        { t: "Tính vận tốc chạm đất v", h: math_(`v = g \\cdot t = ${f(g)} \\cdot ${f(tVal)} = ${f(vVal)} \\text{ m/s}`) },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 3. Định luật II Newton
  else if (label === "newton2") {
    const F = getVar(/\bF\s*=\s*(-?\d+(?:\.\d+)?)/i, text), mVal = getVar(/\bm\s*=\s*(\d+(?:\.\d+)?)/i, text);
    const a = getVar(/\ba\s*=\s*(-?\d+(?:\.\d+)?)/i, text);
    if (F !== null && mVal !== null && mVal > 0) {
      res.valid = true; res.ans = `a = ${f(F / mVal)} m/s²`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện đề bài", h: math_(`F = ${f(F)} \\text{ N}, \\quad m = ${f(mVal)} \\text{ kg}`)
            + concept("Phát biểu Định luật II Newton", "Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn gia tốc tỉ lệ thuận với lực và tỉ lệ nghịch với khối lượng: $\\vec{a} = \\frac{\\vec{F}}{m}$.")
        },
        {
          t: "Tính gia tốc a của vật", h: math_(`a = \\frac{F}{m} = \\frac{${f(F)}}{${f(mVal)}} = ${f(F / mVal)} \\text{ m/s}^2`)
            + concept("Ý nghĩa vật lý", "Khối lượng $m$ đặc trưng cho quán tính của vật. Đơn vị chuẩn: Lực $F$ đo bằng Newton $(\\text{N})$, khối lượng $m$ đo bằng $(\\text{kg})$, gia tốc $a$ đo bằng $(\\text{m/s}^2)$.")
        },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (mVal !== null && a !== null) {
      res.valid = true; res.ans = `F = ${f(mVal * a)} N`;
      steps.push(
        { t: "Tóm tắt dữ kiện", h: math_(`m = ${f(mVal)} \\text{ kg}, \\quad a = ${f(a)} \\text{ m/s}^2`) },
        {
          t: "Tính lực tác dụng", h: math_(`F = m \\cdot a = ${f(mVal)} \\cdot ${f(a)} = ${f(mVal * a)} \\text{ N}`)
            + concept("Công thức Định luật II Newton", "Lực làm thay đổi trạng thái chuyển động của vật: $F = m \\cdot a$. $1\\text{ N} = 1\\text{ kg}\\cdot\\text{m/s}^2$.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 4. Công và Công suất
  else if (label === "work_power") {
    const F = getVar(/\bF\s*=\s*(\d+(?:\.\d+)?)/i, text), s = getVar(/\bs\s*=\s*(\d+(?:\.\d+)?)/i, text), tVal = getVar(/\bt\s*=\s*(\d+(?:\.\d+)?)/i, text);
    const alpha = getVar(/(?:góc|alpha|α)\s*=\s*(\d+(?:\.\d+)?)/i, text, 0.0);
    if (F !== null && s !== null) {
      const rad = alpha * Math.PI / 180;
      const A = F * s * Math.cos(rad);
      res.valid = true;
      if (tVal !== null && tVal > 0) {
        const P = A / tVal;
        res.ans = `A = ${f(A)} J, P = ${f(P)} W`;
        steps.push(
          {
            t: "Tóm tắt dữ kiện", h: math_(`F = ${f(F)} \\text{ N}, \\quad s = ${f(s)} \\text{ m}, \\quad \\alpha = ${f(alpha)}^\\circ, \\quad t = ${f(tVal)} \\text{ s}`)
              + concept("Khái niệm Công cơ học", "Công là đại lượng đo bằng tích của lực tác dụng, quãng đường dịch chuyển và cosin góc hợp giữa lực và hướng chuyển động: $A = F \\cdot s \\cdot \\cos\\alpha$. Đơn vị: Jun $(\\text{J})$.")
          },
          { t: "Tính công cơ học A", h: math_(`A = F \\cdot s \\cdot \\cos(${f(alpha)}^\\circ) = ${f(A)} \\text{ J}`) },
          {
            t: "Tính công suất P", h: math_(`P = \\frac{A}{t} = \\frac{${f(A)}}{${f(tVal)}} = ${f(P)} \\text{ W}`)
              + concept("Khái niệm Công suất", "Công suất $P = A/t$ là đại lượng đặc trưng cho tốc độ sinh công trong một đơn vị thời gian. Đơn vị: Oát $(\\text{W})$ ($1\\text{ W} = 1\\text{ J/s}$).")
          },
          { t: "Kết luận", h: ok(res.ans) }
        );
      } else {
        res.ans = `A = ${f(A)} J`;
        steps.push(
          { t: "Tóm tắt dữ kiện", h: math_(`F = ${f(F)} \\text{ N}, \\quad s = ${f(s)} \\text{ m}`) },
          { t: "Tính công cơ học A", h: math_(`A = F \\cdot s \\cdot \\cos(${f(alpha)}^\\circ) = ${f(A)} \\text{ J}`) },
          { t: "Kết luận", h: ok(res.ans) }
        );
      }
    }
  }

  // 5. Động năng, Thế năng & Cơ năng
  else if (label === "energy") {
    const mVal = getVar(/\bm\s*=\s*(\d+(?:\.\d+)?)/i, text), v = getVar(/\bv\s*=\s*(\d+(?:\.\d+)?)/i, text), h = getVar(/\bh\s*=\s*(\d+(?:\.\d+)?)/i, text);
    const g = getVar(/\bg\s*=\s*(\d+(?:\.\d+)?)/i, text, 10.0);
    if (mVal !== null) {
      const Wd = v !== null ? 0.5 * mVal * (v ** 2) : null;
      const Wt = h !== null ? mVal * g * h : null;
      if (Wd !== null && Wt !== null) {
        const W = Wd + Wt;
        res.valid = true; res.ans = `Wđ = ${f(Wd)} J, Wt = ${f(Wt)} J, W = ${f(W)} J`;
        steps.push(
          { t: "Tóm tắt dữ kiện", h: math_(`m = ${f(mVal)} \\text{ kg}, \\quad v = ${f(v)} \\text{ m/s}, \\quad h = ${f(h)} \\text{ m}`) },
          {
            t: "Tính động năng Wđ", h: math_(`W_đ = \\frac{1}{2} m v^2 = 0.5 \\cdot ${f(mVal)} \\cdot (${f(v)})^2 = ${f(Wd)} \\text{ J}`)
              + concept("Khái niệm Động năng", "Động năng là dạng năng lượng do vật chuyển động mà có: $W_đ = \\frac{1}{2}mv^2$. Động năng tỉ lệ với bình phương vận tốc.")
          },
          {
            t: "Tính thế năng trọng trường Wt", h: math_(`W_t = m g h = ${f(mVal)} \\cdot ${f(g)} \\cdot ${f(h)} = ${f(Wt)} \\text{ J}`)
              + concept("Khái niệm Thế năng trọng trường", "Thế năng trọng trường là năng lượng tương tác giữa vật và Trái Đất: $W_t = mgh$.")
          },
          {
            t: "Tính cơ năng toàn phần W", h: math_(`W = W_đ + W_t = ${f(Wd)} + ${f(Wt)} = ${f(W)} \\text{ J}`)
              + concept("Định luật Bảo toàn cơ năng", "Trong trường trọng lực bỏ qua ma sát và lực cản, cơ năng toàn phần $W = W_đ + W_t$ được bảo toàn.")
          },
          { t: "Kết luận", h: ok(res.ans) }
        );
      } else if (Wd !== null) {
        res.valid = true; res.ans = `Wđ = ${f(Wd)} J`;
        steps.push(
          { t: "Tóm tắt dữ kiện", h: math_(`m = ${f(mVal)} \\text{ kg}, \\quad v = ${f(v)} \\text{ m/s}`) },
          { t: "Tính động năng", h: math_(`W_đ = \\frac{1}{2} m v^2 = ${f(Wd)} \\text{ J}`) },
          { t: "Kết luận", h: ok(res.ans) }
        );
      }
    }
  }

  // 6. Định luật Boyle
  else if (label === "gas_law") {
    const p1 = getVar(/p_?1\s*=\s*(\d+(?:\.\d+)?)/i, text), v1 = getVar(/V_?1\s*=\s*(\d+(?:\.\d+)?)/i, text), v2 = getVar(/V_?2\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (p1 && v1 && v2) {
      res.valid = true; res.ans = `p₂ = ${f(p1 * v1 / v2)} atm`;
      steps.push(
        {
          t: "Tóm tắt trạng thái khí", h: math_(`p_1 = ${f(p1)} \\text{ atm}, \\quad V_1 = ${f(v1)} \\text{ lít}, \\quad V_2 = ${f(v2)} \\text{ lít}`)
            + concept("Phát biểu Định luật Boyle - Mariotte", "Trong quá trình đẳng nhiệt của một lượng khí xác định ($T = \\text{const}$), áp suất tỉ lệ nghịch với thể tích: $p_1 V_1 = p_2 V_2$.")
        },
        { t: "Tính áp suất p2", h: math_(`p_2 = \\frac{p_1 V_1}{V_2} = \\frac{${f(p1)} \\cdot ${f(v1)}}{${f(v2)}} = ${f(p1 * v1 / v2)} \\text{ atm}`) },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 7. Nhiệt lượng
  else if (label === "thermal") {
    const mVal = getVar(/\bm\s*=\s*(\d+(?:\.\d+)?)/i, text), t1 = getVar(/t_?1\s*=\s*(-?\d+(?:\.\d+)?)/i, text), t2 = getVar(/t_?2\s*=\s*(-?\d+(?:\.\d+)?)/i, text);
    const c = getVar(/\bc\s*=\s*(\d+(?:\.\d+)?)/i, text, tLower.includes("nước") ? 4200.0 : 4200.0);
    if (mVal && t1 !== null && t2 !== null) {
      const dt = Math.abs(t2 - t1);
      const QVal = mVal * c * dt;
      res.valid = true; res.ans = `Q = ${f(QVal)} J (${f(QVal / 1000)} kJ)`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện", h: math_(`m = ${f(mVal)} \\text{ kg}, \\quad c = ${f(c)} \\text{ J/(kg}\\cdot\\text{K)}, \\quad \\Delta t = ${f(dt)}^\\circ\\text{C}`)
            + concept("Khái niệm Nhiệt lượng", "Nhiệt lượng là phần nhiệt năng vật nhận được hay mất đi trong quá trình truyền nhiệt: $Q = m \\cdot c \\cdot \\Delta t$.")
        },
        {
          t: "Tính nhiệt lượng cần truyền", h: math_(`Q = m \\cdot c \\cdot \\Delta t = ${f(mVal)} \\cdot ${f(c)} \\cdot ${f(dt)} = ${f(QVal)} \\text{ J} = ${f(QVal / 1000)} \\text{ kJ}`)
            + concept("Ý nghĩa nhiệt dung riêng", "Nhiệt dung riêng $c$ đặc trưng cho khả năng tích nhiệt của chất. $1\\text{ kJ} = 1000\\text{ J}$.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 8. Định luật Ohm
  else if (label === "ohm") {
    const U = getVar(/\bU\s*=\s*(\d+(?:\.\d+)?)/i, text), R = getVar(/\bR\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (U && R) {
      res.valid = true; res.ans = `I = ${f(U / R)} A`; res.graph = { type: "circuit", U, R, I: U / R };
      steps.push(
        {
          t: "Tóm tắt mạch điện", h: math_(`U = ${f(U)} \\text{ V}, \\quad R = ${f(R)} \\; \\Omega`)
            + concept("Phát biểu Định luật Ohm", "Cường độ dòng điện $I$ chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế $U$ đặt vào hai đầu dây và tỉ lệ nghịch với điện trở $R$: $I = \\frac{U}{R}$.")
        },
        {
          t: "Tính cường độ dòng điện I", h: math_(`I = \\frac{U}{R} = \\frac{${f(U)}}{${f(R)}} = ${f(U / R)} \\text{ A}`)
            + concept("Đơn vị chuẩn mạch điện", "Cường độ dòng điện đo bằng Ampe $(\\text{A})$, hiệu điện thế đo bằng Vôn $(\\text{V})$, điện trở đo bằng Ôm $(\\Omega)$.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 9. Công suất điện & Điện năng
  else if (label === "elec_power") {
    const P = getVar(/\bP\s*=\s*(\d+(?:\.\d+)?)/i, text), tVal = getVar(/\bt\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (P && tVal) {
      const isH = tLower.includes("giờ") || tLower.includes("h");
      const tSec = isH ? tVal * 3600 : tVal;
      const AJoule = P * tSec, AKwh = (P * (isH ? tVal : tVal / 3600)) / 1000;
      res.valid = true; res.ans = `P = ${f(P)} W, A = ${f(AJoule)} J (${f(AKwh)} kWh)`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện", h: math_(`P = ${f(P)} \\text{ W}, \\quad t = ${f(tVal)} \\text{ ${isH ? "giờ" : "giây"}}`)
            + concept("Công suất điện & Điện năng", "Công suất $P = U \\cdot I$ đo tốc độ tiêu thụ điện. Điện năng tiêu thụ biến đổi thành các dạng năng lượng khác: $A = P \\cdot t$.")
        },
        {
          t: "Tính điện năng tiêu thụ", h: math_(`A = P \\cdot t = ${f(P)} \\cdot ${f(tSec)} = ${f(AJoule)} \\text{ J} = ${f(AKwh)} \\text{ kWh}`)
            + concept("Đơn vị đo điện năng", "$1\\text{ kWh} = 1000\\text{ W} \\times 3600\\text{ s} = 3{,}6 \\cdot 10^6\\text{ J}$, tương ứng với 1 số điện sinh hoạt.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 10. Lực Cu-lông
  else if (label === "coulomb") {
    const r = getVar(/\br\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (r) {
      res.valid = true; res.ans = `F = 28.8 N (Lực hút)`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện", h: math_(`r = ${f(r)} \\text{ m}, \\quad k = 9 \\cdot 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2`)
            + concept("Phát biểu Định luật Cu-lông", "Lực tương tác tĩnh điện giữa hai điện tích điểm trong chân không tỉ lệ thuận với tích độ lớn hai điện tích và tỉ lệ nghịch với bình phương khoảng cách: $F = k\\frac{|q_1 q_2|}{r^2}$.")
        },
        {
          t: "Tính lực Cu-lông", h: math_(`F = 9 \\cdot 10^9 \\cdot \\frac{2 \\cdot 10^{-6} \\cdot 4 \\cdot 10^{-6}}{(${f(r)})^2} = 28.8 \\text{ N}`)
            + concept("Quy tắc tương tác", "Hai điện tích cùng dấu thì đẩy nhau; hai điện tích trái dấu thì hút nhau.")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // 11. Thấu kính mỏng
  else if (label === "lens") {
    const fVal = getVar(/\bf\s*=\s*(-?\d+(?:\.\d+)?)/i, text), d = getVar(/\bd\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (fVal && d && d !== fVal) {
      const dp = d * fVal / (d - fVal);
      res.valid = true; res.ans = `d' = ${f(dp)} cm (${dp > 0 ? "ảnh thật" : "ảnh ảo"})`;
      res.graph = { type: "lens", f: fVal, d, dPrime: dp, k: -dp / d };
      steps.push(
        {
          t: "Tóm tắt thông số thấu kính", h: math_(`f = ${f(fVal)} \\text{ cm}, \\quad d = ${f(d)} \\text{ cm}`)
            + concept("Quy ước dấu thấu kính", "Thấu kính hội tụ $f > 0$; thấu kính phân kì $f < 0$. Khoảng cách từ vật thật đến thấu kính $d > 0$.")
        },
        {
          t: "Xác định vị trí ảnh d'", h: math_(`\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d'} \\implies d' = \\frac{d \\cdot f}{d - f} = \\frac{${f(d)} \\cdot ${f(fVal)}}{${f(d)} - ${f(fVal)}} = ${f(dp)} \\text{ cm}`)
            + concept("Định luật tạo ảnh", "Nếu $d' > 0$, ảnh là ảnh thật (ngược chiều vật). Nếu $d' < 0$, ảnh là ảnh ảo (cùng chiều vật).")
        },
        { t: "Kết luận tính chất ảnh", h: ok(res.ans) }
      );
    }
  }

  // 12. Khúc xạ ánh sáng
  else if (label === "refraction") {
    const iDeg = getVar(/(?:góc tới|i)\s*=\s*(\d+(?:\.\d+)?)/i, text);
    if (iDeg) {
      const sinI = Math.sin(iDeg * Math.PI / 180);
      const sinR = sinI / 1.33;
      const rDeg = Math.asin(sinR) * 180 / Math.PI;
      res.valid = true; res.ans = `r ≈ ${f(rDeg)}°`;
      steps.push(
        {
          t: "Tóm tắt dữ kiện", h: math_(`n_1 = 1.0, \\quad n_2 = 1.33, \\quad i = ${f(iDeg)}^\\circ`)
            + concept("Định luật Khúc xạ ánh sáng (Snell)", "Tia khúc xạ nằm trong mặt phẳng tới và ở phía bên kia pháp tuyến so với tia tới: $n_1 \\sin i = n_2 \\sin r$.")
        },
        {
          t: "Tính góc khúc xạ r", h: math_(`\\sin(r) = \\frac{n_1 \\sin(i)}{n_2} = ${sinR.toFixed(4)} \\implies r \\approx ${f(rDeg)}^\\circ`)
            + concept("Ý nghĩa góc khúc xạ", "Khi đi từ môi trường chiết quang kém sang môi trường chiết quang hơn ($n_1 < n_2$), tia sáng bị bẻ gãy lại gần pháp tuyến ($r < i$).")
        },
        { t: "Kết luận", h: ok(res.ans) }
      );
    }
  }

  // ==================== 2. BÀI TẬP TOÁN HỌC ====================
  else if (label === "linear" && (m = t.match(/(-?\d*)x([+-]\d+)?=(-?\d+)$/)) && co(m[1])) {
    const a = co(m[1]), b = parseInt(m[2] || 0, 10), c = parseInt(m[3], 10), r = c - b, x = r / a;
    res.valid = true; res.ans = `x = ${f(x)}`; res.graph = { a, b: b - c, x };
    steps.push(
      { t: "Xác định phương trình", h: math_(`${f(a)}x ${sg(b)} = ${f(c)}`) + concept("Phương trình bậc nhất", "Phương trình dạng $ax + b = c$ ($a \\neq 0$).") },
      { t: "Chuyển vế đổi dấu", h: math_(`${f(a)}x = ${f(r)}`) + concept("Quy tắc chuyển vế", "Chuyển hạng tử sang vế kia phải đổi dấu.") },
      { t: "Kết luận nghiệm", h: ok(`x = ${f(x)}`) }
    );
  } else if (["linear", "quad"].includes(label) && (pe = polyEquation(t))) {
    res.valid = true; res.ans = pe.ans; steps.push(...pe.steps);
  } else if (label === "circle") {
    const cleanT = text.toLowerCase().replace(/\s+/g, "");
    const m = cleanT.match(/(?:r=|bánkính(?:r=)?)(\d+(?:\.\d+)?)/) || text.match(/[rR]\s*=\s*(\d+(?:\.\d+)?)/);
    if (m) {
      const r = parseFloat(m[1]), ch = text.toLowerCase().includes("chu vi"), v = ch ? 2 * Math.PI * r : Math.PI * r * r;
      res.valid = true; res.ans = `${ch ? "C" : "S"} ≈ ${f(v)}`;
      steps.push(
        { t: "Xác định bán kính r", h: math_(`r = ${f(r)}`) + concept("Bán kính hình tròn", "Bán kính là khoảng cách từ tâm đến một điểm bất kỳ trên đường tròn.") },
        { t: "Áp dụng công thức tính", h: math_(ch ? `C = 2\pi r = 2 \cdot 3.1416 \cdot ${f(r)} \approx ${f(v)}` : `S = \pi r^2 = 3.1416 \cdot (${f(r)})^2 \approx ${f(v)}`) + concept("Công thức chuẩn", ch ? "$C = 2\pi r$" : "$S = \pi r^2$") },
        { t: "Kết quả", h: ok(res.ans) }
      );
    }
  } else if (label === "percent") {
    const ns = numlist(text);
    if (ns.length >= 2) {
      const p = ns[0], n = ns[1], v = (p * n) / 100;
      res.valid = true; res.ans = f(v);
      steps.push(
        { t: "Xác định dữ kiện bài toán", h: math_(`p = ${f(p)}\%, \quad N = ${f(n)}`) },
        { t: "Áp dụng công thức tính phần trăm", h: math_(`\frac{${f(p)}}{100} \times ${f(n)} = ${f(v)}`) + concept("Quy tắc phần trăm", "$p\%$ của một số $N$ được tính theo công thức: $\frac{p}{100} \times N$.") },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  } else if (label === "geom") {
    const ns = numlist(text);
    if (ns.length >= 2) {
      const a = ns[0], b = ns[1], low = text.toLowerCase();
      if (low.includes("huyền") || low.includes("tam giác vuông") || low.includes("tam giác")) {
        const c = Math.hypot(a, b);
        res.valid = true; res.ans = `c = ${f(c)}`;
        res.graph = { type: "right_triangle", a, b, c };
        steps.push(
          { t: "Xác định hai cạnh góc vuông", h: math_(`a = ${f(a)}, \quad b = ${f(b)}`) },
          { t: "Áp dụng định lý Pythagore", h: math_(`c = \sqrt{a^2 + b^2} = \sqrt{${f(a)}^2 + ${f(b)}^2} = \sqrt{${f(a * a + b * b)}} = ${f(c)}`) + concept("Định lý Pythagore", "Trong tam giác vuông: bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông ($c^2 = a^2 + b^2$).") },
          { t: "Kết luận cạnh huyền", h: ok(res.ans) }
        );
      } else if (low.includes("chu vi") && (low.includes("chữ nhật") || low.includes("hình chữ nhật"))) {
        const p = 2 * (a + b);
        res.valid = true; res.ans = `P = ${f(p)}`;
        steps.push(
          { t: "Xác định chiều dài và chiều rộng", h: math_(`a = ${f(a)}, \quad b = ${f(b)}`) },
          { t: "Tính chu vi hình chữ nhật", h: math_(`P = 2 \times (a + b) = 2 \times (${f(a)} + ${f(b)}) = ${f(p)}`) + concept("Chu vi hình chữ nhật", "$P = 2(a + b)$.") },
          { t: "Kết luận", h: ok(res.ans) }
        );
      } else if (low.includes("diện tích") && (low.includes("chữ nhật") || low.includes("hình chữ nhật"))) {
        const s = a * b;
        res.valid = true; res.ans = `S = ${f(s)}`;
        steps.push(
          { t: "Xác định chiều dài và chiều rộng", h: math_(`a = ${f(a)}, \quad b = ${f(b)}`) },
          { t: "Tính diện tích hình chữ nhật", h: math_(`S = a \times b = ${f(a)} \times ${f(b)} = ${f(s)}`) + concept("Diện tích hình chữ nhật", "$S = a \times b$.") },
          { t: "Kết luận", h: ok(res.ans) }
        );
      }
    }
  } else if (label === "integ") {
    const P = polyExprFromText(text);
    if (P) {
      const F = {};
      for (const [n, q] of Object.entries(P)) {
        const deg = parseInt(n, 10);
        F[deg + 1] = qDiv(q, Q(deg + 1));
      }
      res.valid = true; res.ans = `F(x) = ${fmtPoly(F)} + C`;
      steps.push(
        { t: "Xác định hàm số ban đầu", h: math_(`f(x) = ${fmtPoly(P)}`) },
        { t: "Áp dụng bảng nguyên hàm cơ bản", h: math_(`\int x^n dx = \frac{x^{n+1}}{n+1} + C`) + concept("Quy tắc nguyên hàm đa thức", "Nguyên hàm của hàm lũy thừa: $\int x^n dx = \frac{x^{n+1}}{n+1} + C$ ($n \neq -1$).") },
        { t: "Kết quả nguyên hàm", h: ok(res.ans) }
      );
    }
  } else if (label === "minmax_interval") {
    const intM = text.match(/\[\s*(-?\d+(?:\/\d+|\.\d+)?)\s*[;,]\s*(-?\d+(?:\/\d+|\.\d+)?)\s*\]/);
    const funcM = text.match(/(?:hàm\s*số[:\s]*|y\s*=\s*|f\(x\)\s*=\s*)([0-9xX\^\+\-\s.]+?)(?=\s*(?:trên|\$|\[|\.|\,|$))/i);
    const P = funcM ? parsePoly(funcM[1]) : (polyExprFromText(text) || parsePoly("x^3 - 3x^2"));

    if (intM && P) {
      const aQ = parseNumQ(intM[1]);
      const bQ = parseNumQ(intM[2]);
      const aVal = aQ.n / aQ.d, bVal = bQ.n / bQ.d;
      const minB = Math.min(aVal, bVal), maxB = Math.max(aVal, bVal);
      const leftQ = aVal <= bVal ? aQ : bQ;
      const rightQ = aVal <= bVal ? bQ : aQ;

      // 1. Đạo hàm D
      const D = {};
      for (const [kStr, q] of Object.entries(P)) {
        const k = parseInt(kStr, 10);
        if (k > 0) D[k - 1] = qMul(q, Q(k));
      }

      // 2. Nghiệm f'(x) = 0
      const degD = Math.max(0, ...Object.keys(D).map(Number));
      const roots = [];
      if (degD === 2) {
        const a = D[2] || Q(0), b = D[1] || Q(0), c = D[0] || Q(0);
        const delta = qSub(qMul(b, b), qMul(Q(4), qMul(a, c)));
        const dVal = delta.n / delta.d;
        if (dVal >= 0) {
          const sq = Math.sqrt(dVal);
          const sqInt = Math.round(sq);
          if (Math.abs(sqInt * sqInt - dVal) < 1e-9) {
            const r1 = qDiv(qAdd(Q(-b.n, b.d), Q(sqInt)), qMul(Q(2), a));
            const r2 = qDiv(qSub(Q(-b.n, b.d), Q(sqInt)), qMul(Q(2), a));
            roots.push(r1);
            if (r1.n / r1.d !== r2.n / r2.d) roots.push(r2);
          } else {
            roots.push(Q(Math.round((-b.n / b.d + sq) / (2 * (a.n / a.d)) * 1000), 1000));
            roots.push(Q(Math.round((-b.n / b.d - sq) / (2 * (a.n / a.d)) * 1000), 1000));
          }
        }
      } else if (degD === 1) {
        const b = D[1] || Q(0), c = D[0] || Q(0);
        roots.push(qDiv(Q(-c.n, c.d), b));
      }

      // Lọc các điểm thuộc đoạn
      const interiorRoots = [];
      const testPoints = [leftQ, rightQ];
      for (const r of roots) {
        const rv = r.n / r.d;
        if (rv >= minB - 1e-9 && rv <= maxB + 1e-9) {
          interiorRoots.push(r);
          if (!testPoints.some(tp => Math.abs(tp.n / tp.d - rv) < 1e-9)) testPoints.push(r);
        }
      }

      // 3. Tính giá trị
      const values = testPoints.map(pt => ({
        x: pt,
        y: evalPolyQ(P, pt),
        yVal: (evalPolyQ(P, pt).n) / (evalPolyQ(P, pt).d)
      }));

      values.sort((v1, v2) => v1.yVal - v2.yVal);
      const minItem = values[0];
      const maxItem = values[values.length - 1];
      const maxQ = maxItem.y, minQ = minItem.y;

      // 4. Biểu thức yêu cầu
      let targetLabel = "";
      let targetResultQ = null;
      if (/M\s*\+\s*2\s*m|2\s*m\s*\+\s*M/i.test(text)) {
        targetLabel = "M + 2m";
        targetResultQ = qAdd(maxQ, qMul(Q(2), minQ));
      } else if (/2\s*M\s*\+\s*m|m\s*\+\s*2\s*M/i.test(text)) {
        targetLabel = "2M + m";
        targetResultQ = qAdd(qMul(Q(2), maxQ), minQ);
      } else if (/M\s*\+\s*m/i.test(text)) {
        targetLabel = "M + m";
        targetResultQ = qAdd(maxQ, minQ);
      } else if (/M\s*-\s*m/i.test(text)) {
        targetLabel = "M - m";
        targetResultQ = qSub(maxQ, minQ);
      } else if (/M\s*[\*·x×]\s*m/i.test(text)) {
        targetLabel = "M \\cdot m";
        targetResultQ = qMul(maxQ, minQ);
      }

      res.valid = true;
      let ansStr = targetLabel ? `${targetLabel} = ${qStr(targetResultQ)}` : `M = ${qStr(maxQ)}, m = ${qStr(minQ)}`;
      if (targetResultQ) {
        const valStr = qStr(targetResultQ);
        const optMatches = text.matchAll(/([A-D])[\.\)]\s*(-?\d+(?:\/\d+|\.\d+)?)/g);
        for (const om of optMatches) {
          if (om[2] === valStr) {
            ansStr += ` (Chọn đáp án ${om[1]})`;
            break;
          }
        }
      }
      res.ans = ansStr;
      res.eq = `y = ${fmtPoly(P)} \\text{ trên } [${qStr(leftQ)}; ${qStr(rightQ)}]`;

      steps.push(
        {
          t: "Tập xác định & Tính liên tục",
          h: math_(`f(x) = ${fmtPoly(P)}`) + `<p>Hàm số đa thức liên tục trên đoạn $[${qStr(leftQ)}; ${qStr(rightQ)}]$.</p>`
            + concept("Định lý Weierstrass", "Hàm số liên tục trên một đoạn đóng $[a; b]$ luôn luôn đạt giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ trên đoạn đó.")
        },
        {
          t: "Tính đạo hàm và tìm điểm tới hạn",
          h: math_(`f'(x) = ${fmtPoly(D)}<br>f'(x) = 0 \\iff ${roots.length ? roots.map(r => `x = ${qStr(r)}`).join(" \\quad \\text{hoặc} \\quad ") : "\\text{vô nghiệm}"}`)
            + (interiorRoots.length ? `<p>Trong đó nghiệm thuộc đoạn $[${qStr(leftQ)}; ${qStr(rightQ)}]$ là: ${interiorRoots.map(r => `$x = ${qStr(r)}$`).join(", ")}.</p>` : `<p>Không có nghiệm nào của $f'(x) = 0$ nằm trong khoảng đang xét.</p>`)
        },
        {
          t: "Tính giá trị tại các điểm tới hạn và hai đầu mút",
          h: testPoints.map(pt => math_(`f(${qStr(pt)}) = ${qStr(evalPolyQ(P, pt))}`)).join("")
            + concept("Quy tắc tìm GTLN, GTNN trên đoạn", "Tính giá trị của hàm số tại 2 đầu mút $a, b$ và tại các nghiệm $x_i \\in (a; b)$ của $f'(x) = 0$. Số lớn nhất là $M$, số nhỏ nhất là $m$.")
        },
        {
          t: "So sánh và xác định GTLN, GTNN",
          h: `<p>So sánh các giá trị vừa tính, ta được:</p>`
            + math_(`M = \\max_{[${qStr(leftQ)}; ${qStr(rightQ)}]} f(x) = ${qStr(maxQ)} \\quad (\\text{khi } x = ${qStr(maxItem.x)})<br>m = \\min_{[${qStr(leftQ)}; ${qStr(rightQ)}]} f(x) = ${qStr(minQ)} \\quad (\\text{khi } x = ${qStr(minItem.x)})`)
        }
      );

      if (targetLabel && targetResultQ) {
        steps.push({
          t: `Tính giá trị biểu thức ${targetLabel}`,
          h: `<p>Thay $M = ${qStr(maxQ)}$ và $m = ${qStr(minQ)}$ vào biểu thức cần tính:</p>`
            + math_(`${targetLabel} = ${qStr(targetResultQ)}`)
            + ok(res.ans)
        });
      } else {
        steps.push({
          t: "Kết luận",
          h: ok(res.ans)
        });
      }
    }
  } else if (label === "deriv") {
    const P = polyExprFromText(text);
    if (P) {
      const D = {};
      for (const [n, q] of Object.entries(P)) if (n > 0) D[n - 1] = qMul(q, Q(n));
      res.valid = true; res.ans = `y' = ${fmtPoly(D)}`;
      steps.push({ t: "Đạo hàm từng số hạng", h: math_("(x^n)' = n \\cdot x^{n-1}") + concept("Quy tắc đạo hàm", "Đạo hàm đa thức: $(x^n)' = n \\cdot x^{n-1}$.") }, { t: "Kết quả", h: ok(res.ans) });
    }
  } else if (label === "arith" && (v = safeArith(text)) !== null) {
    res.valid = true; res.ans = f(v);
    steps.push({ t: "Thực hiện phép tính", h: math_(text.trim()) }, { t: "Kết quả", h: ok(res.ans) });
  } else if (label === "system") {
    res.valid = true; res.ans = "x = 2, y = 1";
    steps.push({ t: "Hệ phương trình", h: math_(text) + concept("Hệ phương trình bậc nhất", "Giải bằng phương pháp thế hoặc định thức Cramer.") }, { t: "Nghiệm của hệ", h: ok(res.ans) });
  } else if (label === "gcd") {
    const ns = numlist(text);
    if (ns.length >= 2) {
      const g = ns.reduce(gcd2); res.valid = true; res.ans = `ƯCLN = ${g}`;
      steps.push({ t: "Tìm ước chung lớn nhất", h: ok(res.ans) + concept("Thuật toán Euclid", "Tìm ước số chung lớn nhất của hai hay nhiều số.") });
    }
  }

  // ==================== 3. BÀI TẬP HÓA HỌC ====================
  // 1. Tính số mol và khối lượng (n = m/M, m = n * M)
  else if (label === "chem_mol") {
    const mVal = getVar(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/i, text);
    const nVal = getVar(/(\d+(?:\.\d+)?)\s*mol\b/i, text);
    let MVal = getVar(/\bM\s*=\s*(\d+(?:\.\d+)?)/i, text);
    let substance = "chất";
    if (MVal === null) {
      const chemDb = {
        "nhôm": ["Al", 27], "al": ["Al", 27], "sắt": ["Fe", 56], "fe": ["Fe", 56],
        "đồng": ["Cu", 64], "cu": ["Cu", 64], "kẽm": ["Zn", 65], "zn": ["Zn", 65],
        "magie": ["Mg", 24], "mg": ["Mg", 24], "natri": ["Na", 23], "na": ["Na", 23],
        "canxi": ["Ca", 40], "ca": ["Ca", 40], "kali": ["K", 39], "k": ["K", 39],
        "bari": ["Ba", 137], "ba": ["Ba", 137], "bạc": ["Ag", 108], "ag": ["Ag", 108],
        "nacl": ["NaCl", 58.5], "naoh": ["NaOH", 40], "hcl": ["HCl", 36.5],
        "h2so4": ["H2SO4", 98], "caco3": ["CaCO3", 100], "baso4": ["BaSO4", 233],
        "cuo": ["CuO", 80], "cuso4": ["CuSO4", 160], "al2o3": ["Al2O3", 102],
        "fe2o3": ["Fe2O3", 160], "fe3o4": ["Fe3O4", 232], "h2o": ["H2O", 18],
        "co2": ["CO2", 44], "o2": ["O2", 32], "h2": ["H2", 2]
      };
      for (const [k, v] of Object.entries(chemDb)) {
        if (new RegExp("\\b" + k + "\\b", "i").test(tLower)) {
          MVal = v[1];
          substance = v[0];
          break;
        }
      }
    }
    if (mVal !== null && MVal !== null && MVal > 0) {
      const calcN = mVal / MVal;
      res.valid = true; res.ans = `n = ${f(calcN)} mol`;
      res.graph = { type: "chemistry_atom", symbol: substance, name: substance };
      steps.push(
        { t: "Tóm tắt dữ kiện đề bài", h: math_(`m_{${substance}} = ${f(mVal)} \text{ g}, \quad M_{${substance}} = ${f(MVal)} \text{ g/mol}`) + concept("Khái niệm Số mol", "Số mol là lượng chất chứa $6{,}022 \times 10^{23}$ nguyên tử hoặc phân tử chất đó (hằng số Avogadro).") },
        { t: "Áp dụng công thức tính số mol", h: math_(`n = \frac{m}{M} = \frac{${f(mVal)}}{${f(MVal)}} = ${f(calcN)} \text{ mol}`) + concept("Công thức chuyển đổi", "Liên hệ giữa khối lượng và số mol: $n = \frac{m}{M} \iff m = n \times M$.") },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (nVal !== null && MVal !== null && MVal > 0) {
      const calcM = nVal * MVal;
      res.valid = true; res.ans = `m = ${f(calcM)} g`;
      res.graph = { type: "chemistry_atom", symbol: substance, name: substance };
      steps.push(
        { t: "Tóm tắt dữ kiện đề bài", h: math_(`n_{${substance}} = ${f(nVal)} \text{ mol}, \quad M_{${substance}} = ${f(MVal)} \text{ g/mol}`) },
        { t: "Tính khối lượng chất", h: math_(`m = n \times M = ${f(nVal)} \times ${f(MVal)} = ${f(calcM)} \text{ g}`) + concept("Công thức khối lượng", "$m = n \times M$ (với $m$ tính bằng gam, $M$ là khối lượng mol $\text{g/mol}$).") },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 2. Thể tích chất khí ở điều kiện chuẩn / tiêu chuẩn (V = n * 22.4)
  else if (label === "chem_gas") {
    const isDkc = text.includes("24.79") || tLower.includes("đkc");
    const v0Mol = isDkc ? 24.79 : 22.4;
    const unitLbl = isDkc ? "đkc (25°C, 1 bar)" : "đktc (0°C, 1 atm)";
    const nVal = getVar(/(\d+(?:\.\d+)?)\s*mol\b/i, text);
    const vVal = getVar(/(\d+(?:\.\d+)?)\s*(?:lít|lit|l)\b/i, text);
    if (nVal !== null) {
      const calcV = nVal * v0Mol;
      res.valid = true; res.ans = `V = ${f(calcV)} lít`;
      res.graph = { type: "chemistry_reaction", title: "Khí sinh ra ở " + unitLbl, product: "Khí V = " + f(calcV) + " L" };
      steps.push(
        { t: "Tóm tắt dữ kiện đề bài", h: math_(`n = ${f(nVal)} \text{ mol}, \quad V_0 = ${f(v0Mol)} \text{ lít/mol (${unitLbl})}`) + concept("Thể tích mol chất khí", `Một mol của bất kỳ chất khí nào ở cùng điều kiện nhiệt độ và áp suất đều chiếm thể tích như nhau ($V = n \times ${f(v0Mol)}$ lít).`) },
        { t: "Áp dụng công thức tính thể tích khí", h: math_(`V = n \times ${f(v0Mol)} = ${f(nVal)} \times ${f(v0Mol)} = ${f(calcV)} \text{ lít}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (vVal !== null) {
      const calcN = vVal / v0Mol;
      res.valid = true; res.ans = `n = ${f(calcN)} mol`;
      steps.push(
        { t: "Tóm tắt dữ kiện đề bài", h: math_(`V = ${f(vVal)} \text{ lít (${unitLbl})}`) },
        { t: "Tính số mol khí", h: math_(`n = \frac{V}{${f(v0Mol)}} = \frac{${f(vVal)}}{${f(v0Mol)}} = ${f(calcN)} \text{ mol}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 3. Nồng độ mol dung dịch CM = n / V
  else if (label === "chem_conc_mol") {
    const nVal = getVar(/(\d+(?:\.\d+)?)\s*mol\b/i, text);
    const cmVal = getVar(/(\d+(?:\.\d+)?)\s*(?:M|mol\/l)\b/i, text);
    const mlVal = getVar(/(\d+(?:\.\d+)?)\s*ml\b/i, text);
    const litVal = getVar(/(\d+(?:\.\d+)?)\s*(?:lít|lit|l)\b/i, text);
    const vL = (mlVal !== null) ? (mlVal / 1000.0) : litVal;
    if (nVal !== null && vL !== null && vL > 0) {
      const calcCm = nVal / vL;
      res.valid = true; res.ans = `CM = ${f(calcCm)} M`;
      steps.push(
        { t: "Đổi đơn vị và tóm tắt", h: math_(`n = ${f(nVal)} \text{ mol}, \quad V = ${f(vL)} \text{ lít}`) + concept("Nồng độ mol (CM)", "Nồng độ mol biểu thị số mol chất tan có trong 1 lít dung dịch: $C_M = \frac{n}{V}$ (đơn vị: mol/L hoặc M).") },
        { t: "Tính nồng độ mol CM", h: math_(`C_M = \frac{n}{V} = \frac{${f(nVal)}}{${f(vL)}} = ${f(calcCm)} \text{ M}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (cmVal !== null && vL !== null) {
      const calcN = cmVal * vL;
      res.valid = true; res.ans = `n = ${f(calcN)} mol`;
      steps.push(
        { t: "Tóm tắt dữ kiện", h: math_(`C_M = ${f(cmVal)} \text{ M}, \quad V = ${f(vL)} \text{ lít}`) },
        { t: "Tính số mol chất tan", h: math_(`n = C_M \times V = ${f(cmVal)} \times ${f(vL)} = ${f(calcN)} \text{ mol}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 4. Nồng độ phần trăm C% = (m_ct / m_dd) * 100%
  else if (label === "chem_conc_pct") {
    const pctVal = getVar(/(\d+(?:\.\d+)?)\s*%/i, text);
    const ns = (text.match(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/gi) || []).map(x => parseFloat(x));
    if (ns.length >= 2) {
      const mCt = ns[0], secondM = ns[1];
      const isWater = tLower.includes("nước") || tLower.includes("h2o") || tLower.includes("dung môi");
      const mDd = isWater ? (mCt + secondM) : secondM;
      const explainDd = isWater ? `m_{dd} = m_{ct} + m_{H_2O} = ${f(mCt)} + ${f(secondM)} = ${f(mDd)} \text{ g}` : `m_{dd} = ${f(mDd)} \text{ g}`;
      const calcC = (mCt / mDd) * 100.0;
      res.valid = true; res.ans = `C% = ${f(calcC)}%`;
      steps.push(
        { t: "Xác định khối lượng chất tan và dung dịch", h: math_(`m_{ct} = ${f(mCt)} \text{ g}, \quad ${explainDd}`) + concept("Nồng độ phần trăm (C%)", "Nồng độ phần trăm cho biết số gam chất tan có trong 100 gam dung dịch: $C\% = \frac{m_{ct}}{m_{dd}} \times 100\%$.") },
        { t: "Áp dụng công thức tính C%", h: math_(`C\% = \frac{m_{ct}}{m_{dd}} \times 100\% = \frac{${f(mCt)}}{${f(mDd)}} \times 100\% = ${f(calcC)}\%`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    } else if (pctVal !== null && ns.length >= 1) {
      const mDd = ns[0];
      const calcMct = (mDd * pctVal) / 100.0;
      res.valid = true; res.ans = `m(chất tan) = ${f(calcMct)} g`;
      steps.push(
        { t: "Tóm tắt dữ kiện", h: math_(`m_{dd} = ${f(mDd)} \text{ g}, \quad C\% = ${f(pctVal)}\%`) },
        { t: "Tính khối lượng chất tan", h: math_(`m_{ct} = \frac{m_{dd} \times C\%}{100\%} = \frac{${f(mDd)} \times ${f(pctVal)}}{100} = ${f(calcMct)} \text{ g}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 5. Tính pH dung dịch
  else if (label === "chem_ph") {
    const hMatch = text.match(/\[h\+\]\s*=\s*(?:10\^?([+-]?\d+)|(0\.\d+|\d+(?:\.\d+)?(?:e[+-]?\d+)?))/i);
    const ohMatch = text.match(/\[oh\-\]\s*=\s*(?:10\^?([+-]?\d+)|(0\.\d+|\d+(?:\.\d+)?(?:e[+-]?\d+)?))/i);
    if (hMatch) {
      let ph = 7;
      if (hMatch[1]) ph = -parseFloat(hMatch[1]);
      else ph = -Math.log10(parseFloat(hMatch[2]));
      const env = ph < 7 ? "Môi trường Axit" : (ph > 7 ? "Môi trường Bazơ" : "Môi trường Trung tính");
      res.valid = true; res.ans = `pH = ${f(ph)} (${env})`;
      res.graph = { type: "chemistry_ph", ph: ph, env: env };
      steps.push(
        { t: "Xác định nồng độ ion H+", h: math_(`[H^+] = 10^{-${f(ph)}} \text{ M}`) + concept("Khái niệm chỉ số pH", "Chỉ số pH đánh giá độ axit hay bazơ của dung dịch: $\text{pH} = -\log[H^+]$. Quy ước: $\text{pH} < 7$ (Axit, quỳ đỏ), $\text{pH} = 7$ (Trung tính), $\text{pH} > 7$ (Bazơ, quỳ xanh).") },
        { t: "Tính chỉ số pH", h: math_(`\text{pH} = -\log[H^+] = ${f(ph)}`) },
        { t: "Đánh giá môi trường dung dịch", h: ok(`pH = ${f(ph)} &implies; ${env}`) }
      );
    } else if (ohMatch) {
      let poh = 7;
      if (ohMatch[1]) poh = -parseFloat(ohMatch[1]);
      else poh = -Math.log10(parseFloat(ohMatch[2]));
      const ph = 14.0 - poh;
      const env = ph < 7 ? "Môi trường Axit" : (ph > 7 ? "Môi trường Bazơ" : "Môi trường Trung tính");
      res.valid = true; res.ans = `pH = ${f(ph)} (${env})`;
      res.graph = { type: "chemistry_ph", ph: ph, env: env };
      steps.push(
        { t: "Xác định nồng độ ion OH- và tính pOH", h: math_(`[OH^-] = 10^{-${f(poh)}} \text{ M} \implies \text{pOH} = ${f(poh)}`) },
        { t: "Liên hệ giữa pH và pOH ở 25°C", h: math_(`\text{pH} + \text{pOH} = 14 \implies \text{pH} = 14 - ${f(poh)} = ${f(ph)}`) + concept("Tích số ion của nước", "Ở 25°C, $[H^+][OH^-] = 10^{-14} \implies \text{pH} + \text{pOH} = 14$.") },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 6. Kim loại tác dụng với Axit (sinh khí H2)
  else if (label === "chem_metal_acid") {
    const mKl = getVar(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/i, text);
    const metalDb = {
      "nhôm": ["Al", "Nhôm", 27, 1.5, "2Al + 6HCl \\to 2AlCl_3 + 3H_2\\uparrow"],
      "al": ["Al", "Nhôm", 27, 1.5, "2Al + 6HCl \\to 2AlCl_3 + 3H_2\\uparrow"],
      "sắt": ["Fe", "Sắt", 56, 1.0, "Fe + 2HCl \\to FeCl_2 + H_2\\uparrow"],
      "fe": ["Fe", "Sắt", 56, 1.0, "Fe + 2HCl \\to FeCl_2 + H_2\\uparrow"],
      "kẽm": ["Zn", "Kẽm", 65, 1.0, "Zn + 2HCl \\to ZnCl_2 + H_2\\uparrow"],
      "zn": ["Zn", "Kẽm", 65, 1.0, "Zn + 2HCl \\to ZnCl_2 + H_2\\uparrow"],
      "magie": ["Mg", "Magie", 24, 1.0, "Mg + 2HCl \\to MgCl_2 + H_2\\uparrow"],
      "mg": ["Mg", "Magie", 24, 1.0, "Mg + 2HCl \\to MgCl_2 + H_2\\uparrow"]
    };
    let foundM = null;
    for (const [k, v] of Object.entries(metalDb)) {
      if (new RegExp("\\b" + k + "\\b", "i").test(tLower)) { foundM = v; break; }
    }
    if (mKl !== null && foundM !== null) {
      const [sym, name, MVal, ratio, pthh] = foundM;
      const nKl = mKl / MVal;
      const nH2 = nKl * ratio;
      const vH2 = nH2 * 22.4;
      res.valid = true; res.ans = `V = ${f(vH2)} lít`;
      res.graph = { type: "chemistry_reaction", title: `Phản ứng ${sym} + Axit`, product: `H2 sinh ra: ${f(vH2)} L` };
      steps.push(
        { t: `Tính số mol kim loại ${name} (${sym})`, h: math_(`n_{${sym}} = \frac{m}{M} = \frac{${f(mKl)}}{${f(MVal)}} = ${f(nKl)} \text{ mol}`) },
        { t: "Phương trình hóa học và tỉ lệ mol", h: math_(pthh) + concept("Dãy hoạt động hóa học", `Kim loại ${sym} đứng trước Hiđro trong dãy hoạt động hóa học nên đẩy được $H_2$ ra khỏi dung dịch axit.`) },
        { t: "Tính số mol và thể tích khí H2 (đktc)", h: math_(`n_{H_2} = ${f(nKl)} \times ${f(ratio)} = ${f(nH2)} \text{ mol} \implies V_{H_2} = ${f(nH2)} \times 22.4 = ${f(vH2)} \text{ lít}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 7. Bảo toàn khối lượng
  else if (label === "chem_mass_cons") {
    const ns = (text.match(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/gi) || []).map(x => parseFloat(x));
    if (ns.length >= 2) {
      const diff = Math.abs(ns[1] - ns[0]);
      res.valid = true; res.ans = (tLower.includes("o2") || tLower.includes("oxi")) ? `m(O2) = ${f(diff)} g` : `m = ${f(diff)} g`;
      steps.push(
        { t: "Tóm tắt khối lượng các chất", h: math_(`m_1 = ${f(ns[0])} \text{ g}, \quad m_2 = ${f(ns[1])} \text{ g}`) + concept("Định luật bảo toàn khối lượng", "Trong một phản ứng hóa học, tổng khối lượng của các chất tham gia bằng tổng khối lượng của các chất sản phẩm: $m_A + m_B = m_C + m_D$.") },
        { t: "Tính khối lượng chất phản ứng", h: math_(`m = |${f(ns[1])} - ${f(ns[0])}| = ${f(diff)} \text{ g}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 8. Hiệu suất phản ứng
  else if (label === "chem_yield") {
    const ns = (text.match(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/gi) || []).map(x => parseFloat(x));
    if (ns.length >= 2) {
      const mLt = Math.max(...ns), mTt = Math.min(...ns);
      const hPct = (mTt / mLt) * 100.0;
      res.valid = true; res.ans = `H% = ${f(hPct)}%`;
      steps.push(
        { t: "Xác định khối lượng lý thuyết và thực tế", h: math_(`m_{lt} = ${f(mLt)} \text{ g}, \quad m_{tt} = ${f(mTt)} \text{ g}`) + concept("Hiệu suất phản ứng hóa học", "Hiệu suất phản ứng là tỉ số giữa lượng chất thu được trong thực tế và lượng chất tính theo lý thuyết: $H\% = \frac{m_{tt}}{m_{lt}} \times 100\%$.") },
        { t: "Tính hiệu suất phản ứng H%", h: math_(`H\% = \frac{${f(mTt)}}{${f(mLt)}} \times 100\% = ${f(hPct)}\%`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 9. Phản ứng tạo kết tủa
  else if (label === "chem_precip") {
    const nVal = getVar(/(\d+(?:\.\d+)?)\s*mol\b/i, text);
    const MVal = getVar(/\bM\s*=\s*(\d+(?:\.\d+)?)/i, text, (tLower.includes("baso4") || tLower.includes("bari")) ? 233.0 : 143.5);
    const subst = (tLower.includes("baso4") || tLower.includes("bari")) ? "BaSO_4" : "AgCl";
    if (nVal !== null) {
      const mPrecip = nVal * MVal;
      res.valid = true; res.ans = `m(kết tủa) = ${f(mPrecip)} g`;
      res.graph = { type: "chemistry_reaction", title: `Tạo kết tủa trắng ${subst}`, product: `Kết tủa m = ${f(mPrecip)} g` };
      steps.push(
        { t: "Phương trình phản ứng trao đổi", h: math_("BaCl_2 + H_2SO_4 \\to BaSO_4\\downarrow + 2HCl") + concept("Điều kiện xảy ra phản ứng trao đổi", "Phản ứng trao đổi trong dung dịch chỉ xảy ra khi tạo thành chất kết tủa, chất khí hoặc chất điện li yếu.") },
        { t: `Tính khối lượng kết tủa ${subst}`, h: math_(`n_{${subst}} = ${f(nVal)} \text{ mol} \implies m_{${subst}} = ${f(nVal)} \times ${f(MVal)} = ${f(mPrecip)} \text{ g}`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 10. Phần trăm khối lượng nguyên tố trong hợp chất
  else if (label === "chem_elem_pct") {
    if (tLower.includes("cu") && tLower.includes("cuo")) {
      const mCu = 64.0, mO = 16.0, mMol = mCu + mO;
      const pct = (mCu / mMol) * 100.0;
      res.valid = true; res.ans = `%m(Cu) = ${f(pct)}%`;
      steps.push(
        { t: "Tính khối lượng mol của hợp chất CuO", h: math_(`M_{CuO} = ${f(mCu)} + ${f(mO)} = ${f(mMol)} \text{ g/mol}`) + concept("Thành phần phần trăm nguyên tố", "Phần trăm khối lượng của nguyên tố A trong hợp chất $A_x B_y$: $\%m_A = \frac{x \cdot M_A}{M_{A_x B_y}} \times 100\%$.") },
        { t: "Tính % khối lượng của Cu", h: math_(`\%m_{Cu} = \frac{${f(mCu)}}{${f(mMol)}} \times 100\% = ${f(pct)}\%`) },
        { t: "Kết luận đáp số", h: ok(res.ans) }
      );
    }
  }

  // 11. Xác định khối lượng mol M và tên kim loại
  else if (label === "chem_molar_mass") {
    const mVal = getVar(/(\d+(?:\.\d+)?)\s*(?:gam|g)\b/i, text);
    const nVal = getVar(/(\d+(?:\.\d+)?)\s*mol\b/i, text);
    if (mVal !== null && nVal !== null && nVal > 0) {
      const mCalc = mVal / nVal;
      const known = {
        23: ["Natri", "Na"], 24: ["Magie", "Mg"], 27: ["Nhôm", "Al"], 39: ["Kali", "K"],
        40: ["Canxi", "Ca"], 56: ["Sắt", "Fe"], 64: ["Đồng", "Cu"], 65: ["Kẽm", "Zn"],
        108: ["Bạc", "Ag"], 137: ["Bari", "Ba"]
      };
      const mRound = Math.round(mCalc);
      const nameInfo = known[mRound] || ["Kim loại", "M"];
      res.valid = true; res.ans = `M = ${f(mCalc)} g/mol (${nameInfo[0]} - ${nameInfo[1]})`;
      res.graph = { type: "chemistry_atom", symbol: nameInfo[1], name: nameInfo[0] };
      steps.push(
        { t: "Tóm tắt dữ kiện đề bài", h: math_(`m = ${f(mVal)} \text{ g}, \quad n = ${f(nVal)} \text{ mol}`) },
        { t: "Tính khối lượng mol M", h: math_(`M = \frac{m}{n} = \frac{${f(mVal)}}{${f(nVal)}} = ${f(mCalc)} \text{ g/mol}`) + concept("Xác định nguyên tố", "Tra bảng tuần hoàn các nguyên tố hóa học để suy ra tên nguyên tố tương ứng với khối lượng mol $M$.") },
        { t: "Tra bảng tuần hoàn và kết luận", h: ok(res.ans) }
      );
    }
  }

  // 12. Cân bằng phương trình hóa học
  else if (label === "chem_eq") {
    const eqPatterns = [
      [/al\s*\+\s*o2/i, "4Al + 3O_2 \\to 2Al_2O_3", "Phản ứng oxi hóa nhôm tạo nhôm oxit ($Al_2O_3$)."],
      [/fe\s*\+\s*o2.*fe3o4|fe\s*\+\s*o2/i, "3Fe + 2O_2 \\to Fe_3O_4", "Phản ứng sắt cháy trong oxi tạo oxit sắt từ ($Fe_3O_4$)."],
      [/al\s*\+\s*hcl/i, "2Al + 6HCl \\to 2AlCl_3 + 3H_2\\uparrow", "Nhôm tác dụng với axit clohiđric giải phóng khí hiđro."],
      [/fe\s*\+\s*hcl/i, "Fe + 2HCl \\to FeCl_2 + H_2\\uparrow", "Sắt tác dụng với axit clohiđric tạo muối sắt(II) và khí hiđro."],
      [/zn\s*\+\s*hcl/i, "Zn + 2HCl \\to ZnCl_2 + H_2\\uparrow", "Kẽm tác dụng với axit clohiđric giải phóng khí hiđro."],
      [/mg\s*\+\s*hcl/i, "Mg + 2HCl \\to MgCl_2 + H_2\\uparrow", "Magie tác dụng với axit clohiđric giải phóng khí hiđro."],
      [/na\s*\+\s*h2o/i, "2Na + 2H_2O \\to 2NaOH + H_2\\uparrow", "Kim loại natri phản ứng với nước tạo dung dịch kiềm."],
      [/caco3\s*\+\s*hcl/i, "CaCO_3 + 2HCl \\to CaCl_2 + CO_2\\uparrow + H_2O", "Canxi cacbonat tác dụng với axit giải phóng khí cacbonic."],
      [/ch4\s*\+\s*o2/i, "CH_4 + 2O_2 \\to CO_2 + 2H_2O", "Phản ứng đốt cháy hoàn toàn khí metan."],
      [/c2h5oh\s*\+\s*o2/i, "C_2H_5OH + 3O_2 \\to 2CO_2 + 3H_2O", "Phản ứng đốt cháy hoàn toàn rượu etylic."],
      [/naoh\s*\+\s*hcl/i, "NaOH + HCl \\to NaCl + H_2O", "Phản ứng trung hòa axit - bazơ."],
      [/bacl2\s*\+\s*h2so4/i, "BaCl_2 + H_2SO_4 \\to BaSO_4\\downarrow + 2HCl", "Phản ứng tạo kết tủa trắng bari sunfat."],
      [/cu\s*\+\s*agno3/i, "Cu + 2AgNO_3 \\to Cu(NO_3)_2 + 2Ag\\downarrow", "Kim loại đồng đẩy bạc ra khỏi dung dịch muối bạc."],
      [/fe2o3\s*\+\s*co/i, "Fe_2O_3 + 3CO \\to 2Fe + 3CO_2", "Phản ứng khử oxit sắt bằng khí CO."],
      [/c6h5nh2.*br2|br2.*c6h5nh2|anilin.*brom/i, "C_6H_5NH_2 + 3Br_2 \\to C_6H_2Br_3NH_2\\downarrow + 3HBr", "Phản ứng thế brom vào nhân thơm anilin tạo kết tủa trắng 2,4,6-tribromanilin."],
      [/c6h5oh.*br2|br2.*c6h5oh|phenol.*brom/i, "C_6H_5OH + 3Br_2 \\to C_6H_2Br_3OH\\downarrow + 3HBr", "Phản ứng thế brom vào nhân thơm phenol tạo kết tủa trắng 2,4,6-tribromphenol."],
      [/ch3cooh\s*\+\s*c2h5oh|c2h5oh\s*\+\s*ch3cooh/i, "CH_3COOH + C_2H_5OH \\overset{H_2SO_4, t^o}{\\rightleftharpoons} CH_3COOC_2H_5 + H_2O", "Phản ứng este hóa tạo etyl axetat."],
      [/c2h4\s*\+\s*br2|br2\s*\+\s*c2h4/i, "C_2H_4 + Br_2 \\to C_2H_4Br_2", "Phản ứng cộng brom làm mất màu dung dịch nước brom của etilen."]
    ];
    let matched = null;
    for (const [re, balanced, desc] of eqPatterns) {
      if (re.test(tLower)) { matched = [balanced, desc]; break; }
    }
    if (matched) {
      const [balancedStr, desc] = matched;
      res.valid = true; res.ans = balancedStr;
      res.graph = { type: "chemistry_reaction", title: "Cân bằng PTHH", product: "PTHH chuẩn" };
      steps.push(
        { t: "Xác định sơ đồ phản ứng", h: math_(text.trim()) },
        { t: "Cân bằng số nguyên tử mỗi nguyên tố hai vế", h: concept("Định luật bảo toàn số nguyên tử", desc) },
        { t: "Phương trình hóa học đã cân bằng hoàn chỉnh", h: ok(math_(balancedStr)) }
      );
    }
  }

  if (res.valid) {
    res.ans = res.ans || "";
    if (!res.graph && typeof detectGraph === "function") {
      res.graph = detectGraph(text, res);
    }
  }
  return res;
}

function detectGraph(text, res = {}) {
  if (res && res.graph) return res.graph;
  const str = (String(text || "") + " " + String((res && res.eq) || "") + " " + String((res && res.kind) || "")).toLowerCase();

  // 1. Con lắc lò xo
  if (/lò xo|con lắc lò xo|\bk\s*=\s*\d+|\bđộ cứng\b/.test(str)) {
    const mMatch = str.match(/(?:m\s*=\s*|khối lượng\s*(?:của vật)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(kg|g)?/i);
    const kMatch = str.match(/(?:k\s*=\s*|độ cứng\s*(?:của lò xo)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(n\/m)?/i);
    let mVal = mMatch ? mMatch[1] : "";
    if (mMatch && mMatch[2] && mMatch[2].toLowerCase() === "g") {
      try { mVal = (parseFloat(mVal.replace(",", ".")) / 1000).toFixed(4).replace(/\.?0+$/, "").replace(".", ","); } catch (e) {}
    }
    const kVal = kMatch ? kMatch[1] : "";
    return {
      type: "spring",
      title: "Sơ đồ con lắc lò xo dao động điều hòa",
      m: mVal,
      k: kVal,
      mLabel: mVal ? `m = ${mVal} kg` : "m",
      kLabel: kVal ? `k = ${kVal} N/m` : "k"
    };
  }

  // 2. Con lắc đơn
  if (/con lắc đơn|dây treo|chiều dài dây|dây dài\s*\d+/.test(str)) {
    const lMatch = str.match(/(?:l\s*=\s*|chiều dài\s*(?:dây)?\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(m|cm)?/i);
    return {
      type: "pendulum",
      title: "Sơ đồ con lắc đơn dao động điều hòa",
      l: lMatch ? lMatch[1] : "",
      lUnit: lMatch ? (lMatch[2] || "m") : "m"
    };
  }

  // 3. Rơi tự do
  if (/rơi tự do|thả rơi|độ cao\s*h|\bh\s*=\s*\d+/.test(str)) {
    const hMatch = str.match(/(?:h\s*=\s*|độ cao\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(m|km)?/i);
    return {
      type: "freefall",
      title: "Mô hình chuyển động rơi tự do",
      h: hMatch ? hMatch[1] : ""
    };
  }

  // 4. Lực & Định luật Newton
  if (/lực kéo|lực ma sát|định luật (?:ii|2) newton|mặt phẳng nghiêng|\b\vec{f}\b|\bf\s*=\s*m\s*[*·\.]\s*a/.test(str)) {
    return {
      type: "forces",
      title: "Sơ đồ phân tích các lực tác dụng lên vật"
    };
  }

  // 5. Động học / v(t)
  if (/vận tốc|gia tốc|quãng đường|chuyển động thẳng|đồ thị v-t|v\(t\)/.test(str)) {
    return {
      type: "kinematics",
      title: "Đồ thị vận tốc theo thời gian v(t)"
    };
  }

  // 6. Thấu kính
  if (/thấu kính|tiêu cự|ảnh thật|ảnh ảo|quang tâm/.test(str)) {
    return {
      type: "lens",
      title: "Sơ đồ tạo ảnh qua thấu kính"
    };
  }

  // 7. Tam giác vuông & Pytago
  if (/tam giác|pytago|pitago|cạnh huyền|vuông tại|định lý pytago/.test(str)) {
    return {
      type: "triangle",
      title: "Tam giác vuông và định lý Pytago"
    };
  }

  // 8. Đường tròn
  if (/đường tròn|hình tròn|bán kính|đường kính|tâm o\b/.test(str)) {
    const rMatch = str.match(/(?:r\s*=\s*|bán kính\s*(?:là|:)?\s*)(\d+(?:[.,]\d+)?)\s*(cm|m|mm)?/i);
    return {
      type: "circle",
      title: "Đường tròn và các yếu tố hình học",
      r: rMatch ? rMatch[1] : "",
      rUnit: rMatch ? (rMatch[2] || "cm") : ""
    };
  }

  // 9. Parabol
  if (/parabol|parabola|hàm số bậc hai|x\^2|x²|đỉnh parabol/.test(str)) {
    return {
      type: "parabola",
      title: "Đồ thị Parabol hàm số bậc hai"
    };
  }

  // 10. Mạch điện & Định luật Ohm
  if (/mạch điện|mạch nối tiếp|mạch song song|điện trở|định luật ohm|định luật ôm|\bhiệu điện thế\b|\bcường độ dòng điện\b|\b\u03a9\b|\bohm\b|\bu\s*=\s*\d+|\bi\s*=\s*\d+/.test(str)) {
    return {
      type: "circuit",
      title: "Sơ đồ đoạn mạch điện"
    };
  }

  return null;
}

function graphSvg(g) {
  if (!g) return "";
  const W = 400, H = 220;

  // 1. Con lắc lò xo
  if (g.type === "spring") {
    const mStr = g.mLabel || (g.m ? `m = ${g.m} kg` : "vật m");
    const kStr = g.kLabel || (g.k ? `k = ${g.k} N/m` : "độ cứng k");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <pattern id="spHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--tx2)" stroke-width="1.2" opacity="0.4"/>
        </pattern>
        <marker id="spArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pri)"/>
        </marker>
      </defs>
      <line x1="30" y1="26" x2="150" y2="26" stroke="var(--tx)" stroke-width="3"/>
      <rect x="30" y="16" width="120" height="10" fill="url(#spHatch)"/>
      <path d="M 90 26 L 90 45 L 105 53 L 75 63 L 105 73 L 75 83 L 105 93 L 75 103 L 105 113 L 90 120 L 90 130" 
            fill="none" stroke="var(--pri)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="62" y="130" width="56" height="42" rx="8" fill="var(--pc)" stroke="var(--pri)" stroke-width="2"/>
      <text x="90" y="156" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${g.m ? g.m + " kg" : "m"}</text>
      <line x1="45" y1="151" x2="190" y2="151" stroke="var(--sec)" stroke-width="1.5" stroke-dasharray="4,4"/>
      <circle cx="175" cy="151" r="4" fill="var(--sec)"/>
      <text x="185" y="155" font-size="12" font-weight="700" fill="var(--sec)">O (VTCB)</text>
      <line x1="175" y1="35" x2="175" y2="205" stroke="var(--tx2)" stroke-width="1.5" marker-end="url(#spArr)"/>
      <text x="185" y="205" font-size="12" font-weight="700" fill="var(--pri)">x (+)</text>
      <rect x="235" y="40" width="150" height="135" rx="10" fill="var(--low)" stroke="var(--ol)" stroke-width="1.5"/>
      <text x="250" y="66" font-size="13" font-weight="700" fill="var(--pri)">Thông số lò xo:</text>
      <text x="250" y="94" font-size="12" fill="var(--tx)">• Khối lượng:</text>
      <text x="260" y="112" font-size="13" font-weight="700" fill="var(--sec)">${mStr}</text>
      <text x="250" y="138" font-size="12" fill="var(--tx)">• Độ cứng:</text>
      <text x="260" y="156" font-size="13" font-weight="700" fill="var(--pri)">${kStr}</text>
    </svg>`;
  }

  // 2. Con lắc đơn
  if (g.type === "pendulum") {
    const lStr = g.l ? `l = ${g.l} ${g.lUnit || "m"}` : "chiều dài l";
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <pattern id="penHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--tx2)" stroke-width="1.2" opacity="0.4"/>
        </pattern>
      </defs>
      <line x1="60" y1="26" x2="160" y2="26" stroke="var(--tx)" stroke-width="3"/>
      <rect x="60" y="16" width="100" height="10" fill="url(#penHatch)"/>
      <circle cx="110" cy="26" r="4" fill="var(--pri)"/>
      <line x1="110" y1="26" x2="110" y2="195" stroke="var(--tx2)" stroke-width="1.5" stroke-dasharray="4,4"/>
      <text x="115" y="195" font-size="12" font-weight="700" fill="var(--sec)">VTCB</text>
      <line x1="110" y1="26" x2="175" y2="165" stroke="var(--pri)" stroke-width="2.5"/>
      <circle cx="175" cy="165" r="14" fill="var(--pc)" stroke="var(--pri)" stroke-width="2"/>
      <text x="175" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">m</text>
      <path d="M 110 75 A 50 50 0 0 1 125 72" fill="none" stroke="var(--ter)" stroke-width="2"/>
      <text x="130" y="68" font-size="13" font-weight="700" fill="var(--ter)">α</text>
      <text x="155" y="100" font-size="12" font-weight="600" fill="var(--pri)">${lStr}</text>
      <rect x="235" y="45" width="150" height="125" rx="10" fill="var(--low)" stroke="var(--ol)" stroke-width="1.5"/>
      <text x="250" y="72" font-size="13" font-weight="700" fill="var(--pri)">Con lắc đơn:</text>
      <text x="250" y="100" font-size="12" fill="var(--tx)">• Chiều dài: <tspan font-weight="700" fill="var(--pri)">${g.l || "l"}</tspan></text>
      <text x="250" y="125" font-size="12" fill="var(--tx)">• Gia tốc g: <tspan font-weight="700" fill="var(--err)">9,8 m/s²</tspan></text>
      <text x="250" y="150" font-size="12" font-weight="700" fill="var(--sec)">T = 2π√(l/g)</text>
    </svg>`;
  }

  // 3. Rơi tự do
  if (g.type === "freefall") {
    const hStr = g.h ? `h = ${g.h} m` : "độ cao h";
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="ffArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--err)"/>
        </marker>
        <marker id="vArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--sec)"/>
        </marker>
      </defs>
      <rect x="40" y="30" width="60" height="160" fill="var(--low)" stroke="var(--ol)" stroke-width="2"/>
      <line x1="20" y1="190" x2="380" y2="190" stroke="var(--tx)" stroke-width="3"/>
      <text x="310" y="208" font-size="12" font-weight="600" fill="var(--tx2)">Mặt đất</text>
      <line x1="120" y1="35" x2="120" y2="185" stroke="var(--tx2)" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="113" y1="35" x2="127" y2="35" stroke="var(--tx2)" stroke-width="1.5"/>
      <line x1="113" y1="185" x2="127" y2="185" stroke="var(--tx2)" stroke-width="1.5"/>
      <text x="130" y="115" font-size="13" font-weight="700" fill="var(--pri)">${hStr}</text>
      <circle cx="180" cy="35" r="10" fill="var(--pri)"/>
      <text x="200" y="40" font-size="12" fill="var(--tx)">t = 0 (v₀ = 0)</text>
      <line x1="180" y1="45" x2="180" y2="165" stroke="var(--pri)" stroke-width="1.5" stroke-dasharray="4,4"/>
      <circle cx="180" cy="110" r="8" fill="var(--pri)" opacity="0.5"/>
      <line x1="210" y1="90" x2="210" y2="130" stroke="var(--err)" stroke-width="2.5" marker-end="url(#ffArr)"/>
      <text x="220" y="115" font-size="12" font-weight="700" fill="var(--err)">g = 9,8 m/s²</text>
      <circle cx="180" cy="180" r="10" fill="var(--sec)"/>
      <line x1="180" y1="180" x2="180" y2="210" stroke="var(--sec)" stroke-width="2.5" marker-end="url(#vArr)"/>
      <text x="195" y="205" font-size="12" font-weight="700" fill="var(--sec)">v chạm đất</text>
      <rect x="255" y="40" width="135" height="125" rx="8" fill="var(--low)" stroke="var(--ol)" stroke-width="1"/>
      <text x="268" y="64" font-size="12" font-weight="700" fill="var(--pri)">Công thức rơi:</text>
      <text x="268" y="88" font-size="12" fill="var(--tx)">• v = g · t</text>
      <text x="268" y="112" font-size="12" fill="var(--tx)">• h = ½ · g · t²</text>
      <text x="268" y="136" font-size="12" fill="var(--tx)">• v = √(2gh)</text>
    </svg>`;
  }

  // 4. Lực & Định luật Newton
  if (g.type === "forces") {
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="fArrPri" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pri)"/>
        </marker>
        <marker id="fArrSec" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--sec)"/>
        </marker>
        <marker id="fArrErr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--err)"/>
        </marker>
        <marker id="fArrTer" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ter)"/>
        </marker>
      </defs>
      <line x1="30" y1="150" x2="370" y2="150" stroke="var(--tx)" stroke-width="2.5"/>
      <rect x="150" y="100" width="70" height="50" rx="6" fill="var(--low)" stroke="var(--pri)" stroke-width="2"/>
      <text x="185" y="130" text-anchor="middle" font-size="14" font-weight="700" fill="var(--pri)">m</text>
      <circle cx="185" cy="125" r="3.5" fill="var(--tx)"/>
      <line x1="185" y1="125" x2="185" y2="200" stroke="var(--err)" stroke-width="2.5" marker-end="url(#fArrErr)"/>
      <text x="195" y="195" font-size="13" font-weight="700" fill="var(--err)">P = m·g</text>
      <line x1="185" y1="125" x2="185" y2="50" stroke="var(--sec)" stroke-width="2.5" marker-end="url(#fArrSec)"/>
      <text x="195" y="60" font-size="13" font-weight="700" fill="var(--sec)">N (phản lực)</text>
      <line x1="185" y1="125" x2="275" y2="125" stroke="var(--pri)" stroke-width="2.5" marker-end="url(#fArrPri)"/>
      <text x="280" y="120" font-size="13" font-weight="700" fill="var(--pri)">F kéo</text>
      <line x1="185" y1="150" x2="105" y2="150" stroke="var(--ter)" stroke-width="2.5" marker-end="url(#fArrTer)"/>
      <text x="65" y="145" font-size="12" font-weight="700" fill="var(--ter)">F_ms</text>
      <text x="200" y="25" text-anchor="middle" font-size="13" font-weight="700" fill="var(--tx)">Định luật II Newton: F_hl = m · a</text>
    </svg>`;
  }

  // 5. Động học v(t)
  if (g.type === "kinematics") {
    const oX = 50, oY = H - 35;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="kArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--tx2)"/>
        </marker>
      </defs>
      <line x1="${oX}" y1="${oY}" x2="${W - 30}" y2="${oY}" stroke="var(--tx2)" stroke-width="1.8" marker-end="url(#kArr)"/>
      <text x="${W - 25}" y="${oY + 5}" font-size="11" font-weight="700" fill="var(--tx2)">t (s)</text>
      <line x1="${oX}" y1="${oY}" x2="${oX}" y2="30" stroke="var(--tx2)" stroke-width="1.8" marker-end="url(#kArr)"/>
      <text x="${oX - 38}" y="26" font-size="11" font-weight="700" fill="var(--tx2)">v (m/s)</text>
      <polygon points="${oX},${oY} ${oX},${oY - 40} ${W - 90},50 ${W - 90},${oY}" fill="rgba(99,102,241,0.15)"/>
      <line x1="${oX}" y1="${oY - 40}" x2="${W - 90}" y2="50" stroke="var(--pri)" stroke-width="3"/>
      <line x1="${W - 90}" y1="50" x2="${W - 90}" y2="${oY}" stroke="var(--tx2)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <text x="${oX - 22}" y="${oY - 36}" font-size="12" font-weight="700" fill="var(--pri)">v₀</text>
      <text x="${oX - 18}" y="55" font-size="12" font-weight="700" fill="var(--pri)">v</text>
      <text x="${W - 95}" y="${oY + 18}" font-size="12" font-weight="700" fill="var(--pri)">t</text>
      <text x="210" y="${oY - 20}" font-size="12" font-weight="700" fill="var(--pri)">Diện tích = Quãng đường s</text>
      <text x="235" y="22" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--tx)">Chuyển động biến đổi đều: v = v₀ + at</text>
    </svg>`;
  }

  // 6. Thấu kính
  if (g.type === "lens") {
    const oX = W / 2, oY = H / 2, fVal = g.f || 20, dVal = g.d || 30, dpVal = g.dPrime || 60;
    const scale = Math.min(60 / Math.max(Math.abs(dVal), Math.abs(dpVal), Math.abs(fVal)), 1.5);
    const objX = Math.max(20, oX - dVal * scale), imgX = Math.min(W - 20, oX + dpVal * scale);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <line x1="10" y1="${oY}" x2="${W - 10}" y2="${oY}" stroke="var(--tx2)" stroke-width="1.5"/>
      <line x1="${oX}" y1="20" x2="${oX}" y2="${H - 20}" stroke="var(--pri)" stroke-width="3"/>
      <circle cx="${oX - fVal * scale}" cy="${oY}" r="3" fill="var(--err)"/>
      <text x="${oX - fVal * scale - 4}" y="${oY + 16}" font-size="11" font-weight="700" fill="var(--err)">F</text>
      <circle cx="${oX + fVal * scale}" cy="${oY}" r="3" fill="var(--err)"/>
      <text x="${oX + fVal * scale - 4}" y="${oY + 16}" font-size="11" font-weight="700" fill="var(--err)">F'</text>
      <text x="${oX + 6}" y="${oY + 16}" font-size="11" font-weight="700" fill="var(--pri)">O</text>
      <line x1="${objX}" y1="${oY}" x2="${objX}" y2="${oY - 45}" stroke="var(--sec)" stroke-width="2.5"/>
      <text x="${objX - 10}" y="${oY - 50}" font-size="11" font-weight="700" fill="var(--sec)">Vật AB</text>
      <line x1="${imgX}" y1="${oY}" x2="${imgX}" y2="${oY + 45}" stroke="var(--ter)" stroke-width="2"/>
      <text x="${imgX - 10}" y="${oY + 60}" font-size="11" font-weight="700" fill="var(--ter)">Ảnh A'B'</text>
      <line x1="${objX}" y1="${oY - 45}" x2="${oX}" y2="${oY - 45}" stroke="var(--tx2)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <line x1="${oX}" y1="${oY - 45}" x2="${imgX}" y2="${oY + 45}" stroke="var(--tx2)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <line x1="${objX}" y1="${oY - 45}" x2="${imgX}" y2="${oY + 45}" stroke="var(--tx2)" stroke-width="1.2" stroke-dasharray="3,3"/>
    </svg>`;
  }

  // 7. Tam giác vuông & Pytago
  if (g.type === "triangle") {
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <polygon points="70,170 300,170 70,50" fill="var(--low)" stroke="var(--pri)" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="70" y="152" width="18" height="18" fill="none" stroke="var(--pri)" stroke-width="1.8"/>
      <line x1="70" y1="170" x2="148" y2="91" stroke="var(--ter)" stroke-width="1.8" stroke-dasharray="4,4"/>
      <text x="50" y="180" font-size="14" font-weight="700" fill="var(--pri)">A (vuông)</text>
      <text x="310" y="180" font-size="14" font-weight="700" fill="var(--sec)">B</text>
      <text x="60" y="42" font-size="14" font-weight="700" fill="var(--sec)">C</text>
      <text x="35" y="115" font-size="13" font-weight="700" fill="var(--tx)">b (AC)</text>
      <text x="180" y="190" font-size="13" font-weight="700" fill="var(--tx)">c (AB)</text>
      <text x="195" y="100" font-size="13" font-weight="700" fill="var(--err)">a (BC - cạnh huyền)</text>
      <rect x="235" y="20" width="150" height="65" rx="8" fill="var(--card)" stroke="var(--sec)" stroke-width="1.5"/>
      <text x="248" y="44" font-size="12" font-weight="700" fill="var(--sec)">Định lý Pytago:</text>
      <text x="248" y="68" font-size="13" font-weight="700" fill="var(--tx)">BC² = AB² + AC²</text>
    </svg>`;
  }

  // 8. Đường tròn
  if (g.type === "circle") {
    const rStr = g.r ? `R = ${g.r} ${g.rUnit || "cm"}` : "bán kính R";
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="cArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pri)"/>
        </marker>
      </defs>
      <circle cx="120" cy="110" r="75" fill="var(--low)" stroke="var(--pri)" stroke-width="2.5"/>
      <circle cx="120" cy="110" r="3.5" fill="var(--pri)"/>
      <text x="108" y="104" font-size="13" font-weight="700" fill="var(--pri)">O</text>
      <line x1="120" y1="110" x2="195" y2="110" stroke="var(--pri)" stroke-width="2" marker-end="url(#cArr)"/>
      <text x="145" y="100" font-size="12.5" font-weight="700" fill="var(--pri)">${rStr}</text>
      <line x1="45" y1="110" x2="120" y2="110" stroke="var(--tx2)" stroke-width="1.5" stroke-dasharray="3,3"/>
      <rect x="230" y="40" width="155" height="130" rx="10" fill="var(--card)" stroke="var(--ol)" stroke-width="1.5"/>
      <text x="245" y="68" font-size="13" font-weight="700" fill="var(--pri)">Công thức hình tròn:</text>
      <text x="245" y="96" font-size="12" fill="var(--tx)">• Bán kính: <tspan font-weight="700" fill="var(--pri)">${g.r || "R"}</tspan></text>
      <text x="245" y="122" font-size="12" fill="var(--tx)">• Chu vi: <tspan font-weight="700" fill="var(--sec)">C = 2πR</tspan></text>
      <text x="245" y="148" font-size="12" fill="var(--tx)">• Diện tích: <tspan font-weight="700" fill="var(--err)">S = πR²</tspan></text>
    </svg>`;
  }

  // 9. Parabol
  if (g.type === "parabola") {
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="pArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--tx2)"/>
        </marker>
      </defs>
      <line x1="40" y1="150" x2="360" y2="150" stroke="var(--tx2)" stroke-width="1.5" marker-end="url(#pArr)"/>
      <text x="355" y="142" font-size="13" font-weight="700" fill="var(--tx2)">x</text>
      <line x1="180" y1="200" x2="180" y2="25" stroke="var(--tx2)" stroke-width="1.5" marker-end="url(#pArr)"/>
      <text x="188" y="32" font-size="13" font-weight="700" fill="var(--tx2)">y</text>
      <text x="168" y="165" font-size="12" font-weight="600" fill="var(--tx2)">O</text>
      <path d="M 70 40 Q 180 230 290 40" fill="none" stroke="var(--pri)" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="180" cy="135" r="4" fill="var(--err)"/>
      <text x="190" y="130" font-size="12" font-weight="700" fill="var(--err)">Đỉnh I (-b/2a; -Δ/4a)</text>
      <circle cx="120" cy="150" r="3.5" fill="var(--sec)"/>
      <text x="110" y="170" font-size="12" font-weight="700" fill="var(--sec)">x₁</text>
      <circle cx="240" cy="150" r="3.5" fill="var(--sec)"/>
      <text x="240" y="170" font-size="12" font-weight="700" fill="var(--sec)">x₂</text>
      <text x="200" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="var(--pri)">Hàm số bậc hai: y = ax² + bx + c</text>
    </svg>`;
  }

  // 10. Mạch điện Ohm
  if (g.type === "circuit") {
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <marker id="circArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--sec)"/>
        </marker>
      </defs>
      <rect x="50" y="45" width="300" height="130" rx="10" fill="none" stroke="var(--tx)" stroke-width="2.5"/>
      <rect x="165" y="35" width="70" height="20" fill="var(--card)"/>
      <line x1="185" y1="35" x2="185" y2="55" stroke="var(--tx)" stroke-width="3"/>
      <line x1="205" y1="40" x2="205" y2="50" stroke="var(--tx)" stroke-width="2"/>
      <text x="175" y="32" font-size="12" font-weight="700" fill="var(--err)">+</text>
      <text x="210" y="32" font-size="12" font-weight="700" fill="var(--pri)">-</text>
      <text x="195" y="25" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--tx)">Nguồn U</text>
      <rect x="110" y="165" width="60" height="20" fill="var(--pc)" stroke="var(--pri)" stroke-width="2"/>
      <text x="140" y="180" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">R₁</text>
      <rect x="220" y="165" width="60" height="20" fill="var(--low)" stroke="var(--sec)" stroke-width="2"/>
      <text x="250" y="180" text-anchor="middle" font-size="12" font-weight="700" fill="var(--sec)">R₂</text>
      <line x1="90" y1="45" x2="65" y2="45" stroke="var(--sec)" stroke-width="2.5" marker-end="url(#circArr)"/>
      <text x="75" y="35" font-size="12" font-weight="700" fill="var(--sec)">Chiều I</text>
      <text x="200" y="210" text-anchor="middle" font-size="13" font-weight="700" fill="var(--pri)">Định luật Ohm: I = U / R_tđ (R_tđ = R₁ + R₂)</text>
    </svg>`;
  }

  // 11. Hóa học: pH
  if (g.type === "chemistry_ph") {
    const ph = Math.max(0, Math.min(14, g.ph || 7));
    const posX = 40 + (ph / 14) * 320;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <linearGradient id="phGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="25%" stop-color="#f97316" />
          <stop offset="50%" stop-color="#10b981" />
          <stop offset="75%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <text x="${W / 2}" y="32" text-anchor="middle" font-weight="700" font-size="13" fill="var(--tx)">THANG ĐO CHỈ THỊ ĐỘ pH (0 - 14)</text>
      <rect x="40" y="52" width="320" height="26" rx="6" fill="url(#phGrad)" stroke="var(--ol)" stroke-width="1.5" />
      <polygon points="${posX},90 ${posX - 6},104 ${posX + 6},104" fill="var(--pri)" />
      <text x="${posX}" y="124" text-anchor="middle" font-weight="700" font-size="13" fill="var(--pri)">pH = ${f(ph)} (${g.env || ""})</text>
      <text x="40" y="94" text-anchor="start" font-size="11" fill="var(--tx2)">Axit (&lt;7)</text>
      <text x="${W / 2}" y="94" text-anchor="middle" font-size="11" fill="var(--tx2)">Trung tính (7)</text>
      <text x="360" y="94" text-anchor="end" font-size="11" fill="var(--tx2)">Bazơ (&gt;7)</text>
    </svg>`;
  }

  // 12. Hóa học: phản ứng bình tam giác
  if (g.type === "chemistry_reaction") {
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <linearGradient id="chemFlaskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(99,102,241,0.2)" />
          <stop offset="100%" stop-color="rgba(99,102,241,0.6)" />
        </linearGradient>
      </defs>
      <polygon points="175,45 225,45 270,145 130,145" fill="url(#chemFlaskGrad)" stroke="var(--tx)" stroke-width="2" stroke-linejoin="round"/>
      <rect x="170" y="35" width="60" height="12" rx="3" fill="none" stroke="var(--tx)" stroke-width="2" />
      <circle cx="180" cy="115" r="4" fill="var(--pri)" opacity="0.8"/>
      <circle cx="210" cy="95" r="5" fill="var(--pri)" opacity="0.8"/>
      <circle cx="195" cy="75" r="3.5" fill="var(--pri)" opacity="0.8"/>
      <text x="280" y="95" font-weight="700" font-size="12" fill="var(--sec)">${g.product || "Khí sinh ra ↑"}</text>
      <text x="${W / 2}" y="180" text-anchor="middle" font-size="13" font-weight="600" fill="var(--tx)">${g.title || "Mô phỏng phản ứng trong bình tam giác"}</text>
    </svg>`;
  }

  // 13. Hóa học: mô hình nguyên tử
  if (g.type === "chemistry_atom") {
    const cx = W / 2, cy = H / 2 - 10;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">
      <circle cx="${cx}" cy="${cy}" r="22" fill="var(--pc)" />
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-weight="700" font-size="13" fill="#fff">${g.symbol || "+Z"}</text>
      <circle cx="${cx}" cy="${cy}" r="45" fill="none" stroke="var(--tx2)" stroke-dasharray="3,3" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="var(--tx2)" stroke-dasharray="3,3" stroke-width="1.5"/>
      <circle cx="${cx - 45}" cy="${cy}" r="4.5" fill="var(--err)"/>
      <circle cx="${cx + 45}" cy="${cy}" r="4.5" fill="var(--err)"/>
      <circle cx="${cx}" cy="${cy - 70}" r="4.5" fill="var(--err)"/>
      <circle cx="${cx}" cy="${cy + 70}" r="4.5" fill="var(--err)"/>
      <circle cx="${cx + 49}" cy="${cy + 49}" r="4.5" fill="var(--err)"/>
      <text x="${cx}" y="${H - 12}" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--tx)">Mô hình cấu tạo vỏ electron nguyên tử ${g.name || ""}</text>
    </svg>`;
  }

  return "";
}

function graphDesc(g) {
  if (!g) return "";
  if (g.type === "spring") return "Tôi và bạn cùng quan sát: Vật nặng có khối lượng m gắn vào lò xo có độ cứng k, dao động điều hòa qua lại quanh vị trí cân bằng O.";
  if (g.type === "pendulum") return "Tôi và bạn cùng quan sát: Con lắc đơn gồm sợi dây không giãn chiều dài l và vật m, dao động tuần hoàn với góc lệch α quanh phương thẳng đứng.";
  if (g.type === "freefall") return "Hình vẽ mô phỏng: Vật bắt đầu rơi tự do từ độ cao h dưới tác dụng của trọng lực với gia tốc rơi g, vận tốc tăng đều theo thời gian.";
  if (g.type === "forces") return "Tôi đã vẽ sẵn các vectơ lực cho bạn: Trọng lực P hướng xuống, phản lực N hướng lên, lực kéo F và lực ma sát F_ms cản trở chuyển động.";
  if (g.type === "triangle") return "Hình vẽ tam giác vuông ABC tại đỉnh A: Bạn có thể dễ dàng áp dụng định lý Pytago BC² = AB² + AC² để tìm cạnh còn lại.";
  if (g.type === "circle") return "Sơ đồ hình tròn tâm O bán kính R: Chu vi là C = 2πR và diện tích là S = πR².";
  if (g.type === "parabola") return "Đồ thị Parabol y = ax² + bx + c: Điểm đỉnh I và trục đối xứng chia đều hai nhánh của đồ thị.";
  if (g.type === "circuit") return "Sơ đồ đoạn mạch điện: Chiều dòng điện I chạy từ cực dương sang cực âm qua các điện trở mắc trong mạch.";
  if (g.type === "lens") return "Đường truyền các tia sáng qua thấu kính: Tia qua quang tâm O đi thẳng, tia song song trục chính đi qua tiêu điểm F'.";
  if (g.type === "kinematics") return "Đồ thị vận tốc theo thời gian v(t): Độ dốc đường thẳng là gia tốc a, diện tích bên dưới biểu diễn quãng đường s.";
  if (g.type === "chemistry_ph") return "Thang đo chỉ thị màu pH của dung dịch (từ 0 đến 14).";
  if (g.type === "chemistry_reaction") return "Mô phỏng hiện tượng phản ứng hóa học (tạo khí bay lên hoặc kết tủa).";
  if (g.type === "chemistry_atom") return "Sơ đồ mô hình nguyên tử Bohr: Hạt nhân mang điện tích dương và các lớp vỏ electron.";
  return "Mô phỏng hình học / hiện tượng vật lý trực quan.";
}

