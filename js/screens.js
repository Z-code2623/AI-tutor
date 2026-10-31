/* Điều hướng, bộ chuyển đổi môn học Toán/Lý/Hóa, màn Bài tập AI và Lộ trình DKT */

const TABS = [
  ["giang-giai", "GIẢNG GIẢI", "calculate"],
  ["bai-tap", "BÀI TẬP AI", "psychology"],
  ["lo-trinh", "LỘ TRÌNH DKT", "show_chart"],
  ["mo-hinh", "HỆ THỐNG ML", "hub"]
];

const navHtml = TABS.map(t => `<a href="#${t[0]}" data-t="${t[0]}"><span class="ms">${t[2]}</span><span>${t[1].split(" ").slice(0, 2).join(" ")}</span></a>`).join("");
const navDeskEl = $("#navDesktop");
const navMobEl = $("#navMobile");
const navLegacyEl = $("#nav");
if (navDeskEl) navDeskEl.innerHTML = navHtml;
if (navMobEl) navMobEl.innerHTML = navHtml;
if (navLegacyEl && !navDeskEl) navLegacyEl.innerHTML = navHtml;

function toast(m) {
  const e = $("#toast");
  if (!e) return;
  e.textContent = m;
  e.hidden = false;
  e.style.display = "inline-flex";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    e.hidden = true;
    e.style.display = "none";
    e.textContent = "";
  }, 2200);
}

function go(id) {
  if (!TABS.some(t => t[0] === id)) id = "giang-giai";
  $$(".scr").forEach(s => s.classList.toggle("on", s.id === id));
  $$("nav a").forEach(a => a.classList.toggle("on", a.dataset.t === id));
  $("#sub").textContent = TABS.find(t => t[0] === id)[1];
  try { if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id); } catch (e) { }
  if (id === "bai-tap") drawRecs();
  if (id === "lo-trinh") drawPath();
  scrollTo(0, 0);
}
addEventListener("hashchange", () => go(location.hash.slice(1)));

/* Hỗ trợ tương thích ngược (đã chuyển sang chức năng Tải ảnh đề bài xem giải) */
function renderSamples() {}

/* Chuyển đổi môn học linh hoạt giữa Toán học, Vật lý và Hóa học */
function setSubject(sub, changeInput = false) {
  const isPhys = sub === "physics";
  const isChem = sub === "chemistry";
  S.subject = isChem ? "chemistry" : (isPhys ? "physics" : "math");
  try { localStorage.setItem("apt_subject", S.subject); } catch (e) { }

  const btnMath = $("#btnSubjectMath");
  const btnPhys = $("#btnSubjectPhysics");
  const btnChem = $("#btnSubjectChemistry");
  if (btnMath) {
    btnMath.classList.toggle("active", !isPhys && !isChem);
    btnMath.setAttribute("aria-selected", String(!isPhys && !isChem));
  }
  if (btnPhys) {
    btnPhys.classList.toggle("active", isPhys);
    btnPhys.setAttribute("aria-selected", String(isPhys));
  }
  if (btnChem) {
    btnChem.classList.toggle("active", isChem);
    btnChem.setAttribute("aria-selected", String(isChem));
  }

  const titleEl = $("#subjectTitle");
  if (titleEl) {
    titleEl.textContent = isChem ? "Nhập bài tập Hóa học" : (isPhys ? "Nhập bài tập Vật lý" : "Nhập bài toán");
  }

  const badgeEl = $("#subjectBadge");
  if (badgeEl) {
    badgeEl.textContent = isChem
      ? "Hóa đại cương · Vô cơ · Dung dịch · Hữu cơ"
      : (isPhys ? "Cơ học · Nhiệt học · Điện từ · Quang học" : "Đại số · Hình học · Giải tích · Số học");
  }

  const qInp = $("#q");
  if (qInp) {
    qInp.placeholder = isChem
      ? "Nhập bài tập Hóa học (vd: Cho 5.4g Al tác dụng với HCl dư, tính V khí H2 đktc; Hòa tan 20g đường vào 180g nước, tính C%...)"
      : (isPhys
        ? "Nhập bài tập Vật lý (vd: Một vật chuyển động với v0 = 5 m/s, gia tốc a = 2 m/s^2 trong t = 4 s. Tính v và s...)"
        : "Nhập bài toán (vd: Giải phương trình x^2 - 5x + 6 = 0, Tính đạo hàm y = x^3 + 2x, Tính diện tích hình tròn r = 5...)");
    if (changeInput || !qInp.value.trim()) {
      qInp.value = isChem
        ? "Cho 5.4 gam Al tác dụng hoàn toàn với dung dịch axit HCl dư. Tính thể tích khí H2 (đktc) thoát ra."
        : (isPhys
          ? "Một vật chuyển động với v0 = 5 m/s, gia tốc a = 2 m/s^2 trong thời gian t = 4 s. Tính vận tốc v và quãng đường s."
          : "Tìm x biết 2x + 5 = 15");
    }
  }

  renderSamples(S.subject);

  // Nếu đang mở màn bài tập AI thì cập nhật lại gợi ý theo môn
  const curScreen = $(".scr.on");
  if (curScreen && curScreen.id === "bai-tap") {
    drawRecs();
  }
}

// Khởi tạo sự kiện bấm chuyển môn
if ($("#btnSubjectMath")) {
  $("#btnSubjectMath").onclick = () => {
    setSubject("math", true);
    toast("📐 Đã chuyển sang chế độ Gia sư Toán học");
  };
}
if ($("#btnSubjectPhysics")) {
  $("#btnSubjectPhysics").onclick = () => {
    setSubject("physics", true);
    toast("⚛️ Đã chuyển sang chế độ Gia sư Vật lý");
  };
}
if ($("#btnSubjectChemistry")) {
  $("#btnSubjectChemistry").onclick = () => {
    setSubject("chemistry", true);
    toast("🧪 Đã chuyển sang chế độ Gia sư Hóa học");
  };
}

async function drawRecs() {
  const c = S.cur, lv = S.level;
  const tags = [
    ["Tương tự nhất", "g"],
    ["Cùng dạng đề xuất", "p"],
    ["Thử thách nâng cao", "o"],
    ["Rèn luyện thêm", "g"],
    ["Mở rộng liên môn", "p"]
  ];
  const isPhys = S.subject === "physics";
  const isChem = S.subject === "chemistry";
  const validTopics = isChem ? CHEMISTRY_TOPICS : (isPhys ? PHYSICS_TOPICS : MATH_TOPICS);

  $("#lvchip").textContent = `Cấp ${lv} · ${["", "Cơ bản", "Trung bình", "Nâng cao"][lv]}`;
  $("#lprob").textContent = c.text;
  $("#ltopic").textContent = `Chủ đề: ${TN[c.topic] || c.topic}`;
  $("#ldiff").textContent = `Độ khó: Cấp ${c.diff}`;
  $("#lvl").innerHTML = `Level ${lv}<small class="lbl"> / 3</small>`;
  $("#comp").textContent = Math.min(99, 88 + S.done) + "%";

  let rs = null;
  // 1. Thử gọi API backend (có TF-IDF + BKT model)
  try {
    const apiRes = await apiCall(`/api/recommend?text=${encodeURIComponent(c.text)}&level=${lv}&n=12`);
    if (apiRes && Array.isArray(apiRes) && apiRes.length) {
      rs = apiRes.filter(r => !S.skip.has(r.p.id) && r.p.text !== c.text && validTopics.includes(r.p.topic));
    }
  } catch (e) {}

  // 2. Dự phòng bằng thuật toán Client-side TF-IDF thông minh (chính xác theo topic và text vừa giải)
  if (!rs || rs.length < 3) {
    const clientRecs = typeof recommend === "function" ? recommend(c.text || c.id, lv, 8, c.topic) : [];
    rs = (clientRecs || []).filter(r => !S.skip.has(r.p.id) && r.p.text !== c.text && validTopics.includes(r.p.topic));
  }

  // 3. Nếu vẫn thiếu, lấy thêm bài từ ngân hàng P cùng chủ đề môn học
  if (!rs || rs.length < 2) {
    const fallbacks = P.filter(p => validTopics.includes(p.topic) && p.text !== c.text && !S.skip.has(p.id));
    rs = (rs || []).concat(fallbacks.slice(0, 4).map(p => ({ p, s: 0.85 })));
  }

  rs = rs.slice(0, 5);

  $("#recs").innerHTML = rs.map((r, k) => `
    <div class="card rec">
      <div class="row">
        <span class="chip ${tags[k] ? tags[k][1] : 'p'}">${tags[k] ? tags[k][0] : 'Bài hay'}</span>
        <span class="lbl">#Bài ${r.p.id}</span>
        <span class="sp"></span>
        <b style="color:var(--pri)">${Math.round(r.s * 100)}% khớp dạng</b>
      </div>
      <div class="lbl">Chủ đề: ${TN[r.p.topic] || r.p.topic} · Cấp ${r.p.diff}${r.p.diff !== lv ? ` (${r.p.diff > lv ? "+" : "−"}1 cấp độ)` : ""}</div>
      <div class="math" style="font-size:16px;white-space:normal;text-align:left">${typeof cleanMathHtml === "function" ? cleanMathHtml(esc(r.p.text)) : esc(r.p.text)}</div>
      <div class="mrow">
        <div class="t lbl"><span>Độ tương đồng dạng bài</span><span>${Math.round(r.s * 100)}%</span></div>
        <div class="bar"><i style="width:${r.s * 100}%"></i></div>
      </div>
      <button class="pr full" data-go="giang-giai" data-p="${esc(r.p.text)}">Luyện bài này ngay</button>
    </div>
  `).join("") || `<div class="card"><p>Bạn đã hoàn thành các bài tập đề xuất. Nhấn nút bên dưới để nhận thêm bài tập mới!</p></div>`;
  if (typeof applyKatex === "function") applyKatex($("#recs"));
}

async function drawPath() {
  const mm = await apiCall("/api/mastery");
  if (mm) Object.assign(S.mastery, mm);

  $("#hist").innerHTML = (S.history || []).slice(-5).reverse().map(h => `<div class="row"><span class="chip ${h.correct ? "g" : "r"}">${TN[h.topic] || esc(h.topic)}</span><span style="flex:1;font-size:13px">${esc(h.text)}</span></div>`).join("") || '<p class="lbl">Chưa có lịch sử. Hãy giải một bài!</p>';

  const v = Object.values(S.mastery), avg = Math.round(v.reduce((a, b) => a + b, 0) / v.length * 100 + 3);
  $("#mast").textContent = Math.min(99, avg) + "%";
  $("#wk").textContent = "+" + (12 + S.done) + "% tuần này";
  $("#mbar").parentElement.className = "bar";
  $("#mbar").style.width = Math.min(99, avg) + "%";
  $("#xp").textContent = `Cấp độ hiện tại: Level ${(S.level + .8).toFixed(1)} · còn ${Math.max(0, 120 - S.done * 30)} XP`;

  // Hiển thị chia rõ ba nhóm Toán học, Vật lý và Hóa học
  const renderTopicBars = (topicKeys) => topicKeys.map(k => {
    const m = S.mastery[k] || 0.5;
    return `<div class="mrow"><div class="t"><span>${TN[k] || k}</span><span style="color:var(--pri)">${Math.round(m * 100)}%</span></div><div class="bar ${m > .8 ? "g" : m < .5 ? "o" : ""}"><i style="width:${m * 100}%"></i></div></div>`;
  }).join("");

  $("#topics").innerHTML = `
    <div style="font-weight:700;color:var(--pri);margin-top:4px">📐 Môn Toán học:</div>
    ${renderTopicBars(MATH_TOPICS)}
    <div style="font-weight:700;color:var(--pri);margin-top:12px">⚛️ Môn Vật lý:</div>
    ${renderTopicBars(PHYSICS_TOPICS)}
    <div style="font-weight:700;color:var(--pri);margin-top:12px">🧪 Môn Hóa học:</div>
    ${renderTopicBars(CHEMISTRY_TOPICS)}
  `;
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if (!b) return;
  if (b.dataset.p) {
    $("#q").value = b.dataset.p;
    render(b.dataset.p);
  }
  go(b.dataset.go);
});

/* ==============================================================================
   Xử lý Tải ảnh đề bài (AI Vision / OCR Đề Bài)
   ============================================================================== */
window.CURRENT_IMAGE = null;

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function clearUploadedImage() {
  window.CURRENT_IMAGE = null;
  const input = $("#imageInput");
  if (input) input.value = "";
  const card = $("#imagePreviewCard");
  if (card) card.style.display = "none";
  const zone = $("#imageUploadZone");
  if (zone) zone.style.display = "flex";
  const imgEl = $("#imagePreviewImg");
  if (imgEl) imgEl.src = "";
}

function processImageFile(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith("image/")) {
    toast("⚠️ Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, WebP...)");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    const img = new Image();
    img.onload = function() {
      // Tự động tối ưu kích thước ảnh (tối đa 1600px) bằng Canvas để gửi AI siêu nhanh mà chữ toán vẫn cực nét
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;

      let targetDataUrl = rawDataUrl;
      let mimeType = file.type || "image/jpeg";

      if (width > maxDim || height > maxDim || file.size > 600 * 1024) {
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        mimeType = "image/jpeg";
        targetDataUrl = canvas.toDataURL(mimeType, 0.88);
      }

      const base64Data = targetDataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

      window.CURRENT_IMAGE = {
        data: base64Data,
        mimeType: mimeType,
        name: file.name || "de-bai.jpg",
        size: file.size,
        dataUrl: targetDataUrl
      };

      const card = $("#imagePreviewCard");
      const zone = $("#imageUploadZone");
      const imgEl = $("#imagePreviewImg");
      const nameEl = $("#imagePreviewName");
      const sizeEl = $("#imagePreviewSize");

      if (imgEl) imgEl.src = targetDataUrl;
      if (nameEl) nameEl.textContent = file.name || "de-bai.jpg";
      if (sizeEl) sizeEl.textContent = formatFileSize(file.size);

      if (zone) zone.style.display = "none";
      if (card) card.style.display = "flex";

      toast("📷 Đã tải ảnh lên! Bấm 'Giải ngay' để AI phân tích");
    };
    img.onerror = function() {
      toast("⚠️ Không thể đọc nội dung ảnh này. Vui lòng thử ảnh khác.");
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

// Thiết lập các sự kiện tương tác ảnh
const uploadZone = $("#imageUploadZone");
const fileInput = $("#imageInput");
const cameraBtn = $("#quickCameraBtn");
const removeImgBtn = $("#imageRemoveBtn");

if (uploadZone && fileInput) {
  uploadZone.onclick = () => fileInput.click();
  uploadZone.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  };

  // Kéo & Thả (Drag & Drop)
  ["dragenter", "dragover"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("dragover");
    });
  });

  ["dragleave", "dragend"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove("dragover");
    });
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  });
}

if (cameraBtn && fileInput) {
  cameraBtn.onclick = () => fileInput.click();
}

if (fileInput) {
  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };
}

if (removeImgBtn) {
  removeImgBtn.onclick = (e) => {
    e.stopPropagation();
    clearUploadedImage();
    toast("Đã gỡ ảnh");
  };
}

// Lắng nghe dán ảnh từ Clipboard (Ctrl + V trên toàn trang)
document.addEventListener("paste", (e) => {
  const items = (e.clipboardData || window.clipboardData)?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        processImageFile(blob);
        toast("📋 Đã dán ảnh đề bài từ bộ nhớ tạm!");
        break;
      }
    }
  }
});

$("#solve").onclick = () => render($("#q").value, window.CURRENT_IMAGE);
$("#q").onkeydown = e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    render($("#q").value, window.CURRENT_IMAGE);
  }
};
$("#clr").onclick = () => {
  $("#q").value = "";
  clearUploadedImage();
  $("#q").focus();
};
$("#refresh").onclick = () => {
  S.skip.clear();
  drawRecs();
  toast("Đã làm mới gợi ý bài tập");
};

// Kiểm tra nếu trang yêu cầu hiển thị Hóa học mặc định
if (typeof DEFAULT_SUBJECT !== "undefined" && DEFAULT_SUBJECT === "chemistry") {
  setSubject("chemistry", true);
} else if (location.hash === "#hoa" || location.search.includes("subject=chemistry")) {
  setSubject("chemistry", true);
}
