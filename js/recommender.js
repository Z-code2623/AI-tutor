/* TF-IDF, cosine similarity và gợi ý bài tập thích ứng */
const tok = t => String(t || "").toLowerCase().split(/[^\p{L}\p{N}^]+/u).filter(Boolean);
const docs = P.map(p => tok(p.text));
const vocab = [...new Set(docs.flat())];
const N = docs.length;
const idf = vocab.map(w => Math.log((1 + N) / (1 + docs.filter(d => d.includes(w)).length)) + 1);

const vec = docs.map(d => {
  const v = vocab.map((w, i) => d.filter(x => x === w).length * idf[i]);
  const n = Math.hypot(...v) || 1;
  return v.map(x => x / n);
});

function textToVec(text) {
  const d = tok(text);
  const v = vocab.map((w, i) => d.filter(x => x === w).length * idf[i]);
  const n = Math.hypot(...v) || 1;
  return v.map(x => x / n);
}

function simVec(v1, v2) {
  if (!v1 || !v2) return 0;
  return v1.reduce((s, x, i) => s + x * v2[i], 0);
}

/**
 * Gợi ý các bài tập tương tự dựa trên ID hoặc nội dung đề bài vừa giải
 * @param {number|string} idOrText - ID bài tập hoặc chuỗi đề bài vừa giải
 * @param {number} lvl - Trình độ hiện tại (1: Cơ bản, 2: Trung bình, 3: Nâng cao)
 * @param {number} n - Số lượng bài tập đề xuất cần lấy
 * @param {string} targetTopic - Chủ đề ưu tiên (vd: Algebra, Mechanics, GeneralChem...)
 */
function recommend(idOrText, lvl = 1, n = 4, targetTopic = null) {
  let vInput = null, excludedId = -1, rawText = "";

  if (typeof idOrText === "number" && idOrText > 0) {
    const idx = P.findIndex(p => p.id === idOrText);
    if (idx >= 0) {
      vInput = vec[idx];
      excludedId = idOrText;
      rawText = P[idx].text;
      if (!targetTopic) targetTopic = P[idx].topic;
    }
  } else if (typeof idOrText === "string" && idOrText.trim()) {
    rawText = idOrText.trim();
    const hit = P.find(p => p.text.trim() === rawText);
    if (hit) {
      const idx = P.findIndex(p => p.id === hit.id);
      vInput = vec[idx];
      excludedId = hit.id;
      if (!targetTopic) targetTopic = hit.topic;
    } else {
      vInput = textToVec(rawText);
    }
  }

  if (!vInput) vInput = vec[0];
  if (!targetTopic && typeof S !== "undefined" && S.cur && S.cur.topic) {
    targetTopic = S.cur.topic;
  }

  const scored = P.map((p, j) => {
    let s = simVec(vInput, vec[j]);
    // Tăng trọng số nếu cùng chủ đề (topic) với bài vừa giải
    if (targetTopic && p.topic === targetTopic) {
      s = Math.max(s, 0.6) + 0.25;
    }
    return { p, s: Math.min(0.99, s), j };
  });

  // Lọc bài khác với bài vừa giải
  let filtered = scored.filter(r => r.p.id !== excludedId && r.p.text !== rawText);

  // Ưu tiên các bài có độ khó vừa sức
  const filteredLevel = filtered.filter(r => Math.abs(r.p.diff - lvl) <= 1);
  if (filteredLevel.length >= n) {
    filtered = filteredLevel;
  }

  return filtered.sort((a, b) => b.s - a.s).slice(0, n);
}
