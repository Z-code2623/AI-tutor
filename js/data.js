/* Dữ liệu bài tập liên môn Toán học, Vật lý & Hóa học, hằng số và trạng thái học sinh */
const P = [
  // --- TOÁN HỌC ---
  [1, "Algebra", "Tìm x biết 2x + 5 = 15", 1],
  [2, "Algebra", "Giải phương trình bậc hai x^2 - 5x + 6 = 0", 2],
  [3, "Calculus", "Tính đạo hàm của hàm số y = x^3 + 2x", 3],
  [4, "Geometry", "Tính diện tích hình tròn có bán kính r = 5", 2],
  [5, "Arithmetic", "Tính 15% của 240", 1],
  [6, "Algebra", "Giải hệ phương trình 2x + y = 7 và x - y = 2", 2],
  [7, "Geometry", "Tam giác vuông có hai cạnh góc vuông 3 và 4. Tính cạnh huyền", 2],
  [8, "Calculus", "Tìm nguyên hàm của hàm số y = 3x^2 + 2x", 3],
  // --- VẬT LÝ ---
  [9, "Mechanics", "Một vật chuyển động thẳng nhanh dần đều với v0 = 5 m/s, gia tốc a = 2 m/s^2 trong thời gian t = 4 s. Tính vận tốc v và quãng đường s.", 1],
  [10, "Mechanics", "Một vật rơi tự do từ độ cao h = 45 m, lấy g = 10 m/s^2. Tính thời gian rơi t và vận tốc chạm đất.", 1],
  [11, "Mechanics", "Tác dụng một lực không đổi F = 20 N vào vật có khối lượng m = 4 kg. Tính gia tốc a của vật.", 2],
  [12, "Mechanics", "Lực kéo F = 50 N tác dụng làm vật dịch chuyển s = 10 m trong t = 5 s. Tính công A và công suất P.", 2],
  [13, "Thermodynamics", "Khối khí có thể tích V1 = 10 lít ở áp suất p1 = 1 atm. Nén đẳng nhiệt đến thể tích V2 = 4 lít. Tính áp suất p2.", 2],
  [14, "Thermodynamics", "Tính nhiệt lượng cần cung cấp để đun sôi m = 2 kg nước từ t1 = 20 °C đến t2 = 100 °C, biết c = 4200 J/kg.K.", 1],
  [15, "Electromagnetism", "Đặt hiệu điện thế U = 24 V vào hai đầu điện trở R = 12 Ω. Tính cường độ dòng điện I chạy qua điện trở.", 1],
  [16, "Optics", "Vật sáng AB đặt vuông góc với trục chính của thấu kính hội tụ có tiêu cự f = 20 cm, cách thấu kính d = 30 cm. Xác định vị trí d' của ảnh.", 3],
  // --- HÓA HỌC ---
  [17, "GeneralChem", "Tính số mol của 5.4 gam Al, biết khối lượng mol của nhôm là 27 g/mol.", 1],
  [18, "GeneralChem", "Tính thể tích của 0.25 mol khí H2 ở điều kiện tiêu chuẩn (đktc).", 1],
  [19, "SolutionChem", "Hòa tan 0.2 mol NaCl vào nước để được 500 ml dung dịch. Tính nồng độ mol CM của dung dịch thu được.", 2],
  [20, "SolutionChem", "Hòa tan 20 gam đường vào 180 gam nước. Tính nồng độ phần trăm C% của dung dịch đường thu được.", 1],
  [21, "SolutionChem", "Tính pH của một dung dịch axit có nồng độ ion [H+] = 0.001 M.", 2],
  [22, "InorganicChem", "Cho 5.4 gam Al tác dụng hoàn toàn với dung dịch axit HCl dư. Tính thể tích khí H2 (đktc) thoát ra.", 2],
  [23, "GeneralChem", "Đốt cháy hoàn toàn 2.4 gam Mg trong khí oxi thu được 4.0 gam MgO. Tính khối lượng khí oxi O2 đã phản ứng theo định luật bảo toàn khối lượng.", 1],
  [24, "InorganicChem", "Cân bằng phương trình hóa học: Al + O2 -> Al2O3", 2],
  // --- BÀI TẬP BỔ SUNG & TƯƠNG TỰ ĐỂ TỰ LUYỆN TẬP ---
  // Toán học tương tự
  [25, "Algebra", "Tìm x biết 4x - 7 = 21", 1],
  [26, "Algebra", "Giải phương trình bậc hai x^2 - 7x + 12 = 0", 2],
  [27, "Geometry", "Cho tam giác ABC vuông tại A có AB = 6 cm và AC = 8 cm. Tính độ dài cạnh huyền BC", 2],
  [28, "Geometry", "Tính chu vi và diện tích hình tròn có bán kính r = 7 cm", 2],
  [29, "Algebra", "Tìm tọa độ đỉnh của parabol y = x^2 - 4x + 3", 2],
  [30, "Calculus", "Tính đạo hàm của hàm số y = 2x^3 - 4x + 5", 3],
  // Vật lý tương tự
  [31, "Mechanics", "Một con lắc lò xo có độ cứng k = 100 N/m, gắn vật nặng m = 0.25 kg. Tính chu kì dao động riêng của con lắc.", 2],
  [32, "Mechanics", "Một con lắc đơn có chiều dài l = 1 m, lấy g = 9.8 m/s^2. Tính chu kì dao động của con lắc đơn.", 2],
  [33, "Mechanics", "Một vật rơi tự do từ độ cao h = 20 m, lấy g = 10 m/s^2. Tính thời gian rơi t và vận tốc khi chạm đất.", 1],
  [34, "Mechanics", "Một vật chuyển động với vận tốc ban đầu v0 = 10 m/s, gia tốc a = 2 m/s^2 trong t = 3 s. Tính vận tốc v và quãng đường s.", 1],
  [35, "Electromagnetism", "Mạch điện có hiệu điện thế U = 12 V và hai điện trở R1 = 4 Ω, R2 = 2 Ω mắc nối tiếp. Tính cường độ dòng điện trong mạch.", 2],
  [36, "Optics", "Vật sáng AB đặt vuông góc trục chính thấu kính hội tụ có tiêu cự f = 15 cm, cách thấu kính d = 45 cm. Xác định vị trí ảnh d'.", 3],
  // Hóa học tương tự
  [37, "GeneralChem", "Tính số mol của 6.4 gam Cu, biết khối lượng mol của đồng là 64 g/mol.", 1],
  [38, "GeneralChem", "Tính thể tích của 0.5 mol khí O2 ở điều kiện tiêu chuẩn (đktc).", 1],
  [39, "SolutionChem", "Hòa tan 40 gam đường vào 160 gam nước. Tính nồng độ phần trăm C% của dung dịch thu được.", 1],
  [40, "SolutionChem", "Hòa tan 0.5 mol NaOH vào nước để được 2 lít dung dịch. Tính nồng độ mol CM của dung dịch.", 2],
  [41, "InorganicChem", "Cho 2.4 gam Mg tác dụng hoàn toàn với dung dịch axit HCl dư. Tính thể tích khí H2 (đktc) thoát ra.", 2],
  [42, "InorganicChem", "Cân bằng phương trình hóa học: Fe + HCl -> FeCl2 + H2", 2]
].map(a => ({ id: a[0], topic: a[1], text: a[2], diff: a[3] }));

const MATH_SAMPLES = [
  ["PT bậc 1", "Tìm x biết 2x + 5 = 15"],
  ["PT bậc 2", "Giải phương trình bậc hai x^2 - 5x + 6 = 0"],
  ["Đạo hàm", "Tính đạo hàm của hàm số y = x^3 + 2x"],
  ["Hình tròn", "Tính diện tích hình tròn có bán kính r = 5"],
  ["Hệ PT", "Giải hệ phương trình 2x + y = 7 và x - y = 2"],
  ["Nguyên hàm", "Tìm nguyên hàm của hàm số y = 3x^2 + 2x"],
  ["Tam giác", "Tam giác vuông có hai cạnh góc vuông 3 và 4. Tính cạnh huyền"],
  ["Phần trăm", "Tính 15% của 240"]
];

const PHYSICS_SAMPLES = [
  ["Chuyển động v-t", "Một vật chuyển động với v0 = 5 m/s, gia tốc a = 2 m/s^2 trong t = 4 s. Tính vận tốc v và quãng đường s."],
  ["Rơi tự do", "Một vật rơi tự do từ độ cao h = 45 m, lấy g = 10 m/s^2. Tính thời gian rơi t và vận tốc chạm đất."],
  ["Định luật II Newton", "Tác dụng một lực không đổi F = 20 N vào vật có khối lượng m = 4 kg. Tính gia tốc a của vật."],
  ["Công & Công suất", "Lực kéo F = 50 N tác dụng làm vật dịch chuyển s = 10 m trong t = 5 s. Tính công A và công suất P."],
  ["Định luật Boyle", "Khối khí có thể tích V1 = 10 lít ở áp suất p1 = 1 atm. Nén đẳng nhiệt đến thể tích V2 = 4 lít. Tính áp suất p2."],
  ["Nhiệt lượng", "Tính nhiệt lượng cần cung cấp để đun sôi m = 2 kg nước từ t1 = 20 °C đến t2 = 100 °C, biết c = 4200 J/kg.K."],
  ["Định luật Ohm", "Đặt hiệu điện thế U = 24 V vào hai đầu điện trở R = 12 Ω. Tính cường độ dòng điện I chạy qua điện trở."],
  ["Thấu kính hội tụ", "Vật sáng AB đặt vuông góc với trục chính của thấu kính hội tụ có tiêu cự f = 20 cm, cách thấu kính d = 30 cm. Xác định vị trí d' của ảnh."]
];

const CHEMISTRY_SAMPLES = [
  ["Tính số mol", "Tính số mol của 5.4 gam Al, biết M = 27 g/mol."],
  ["Khí ĐKTC", "Tính thể tích của 0.25 mol khí H2 ở điều kiện tiêu chuẩn (đktc)."],
  ["Nồng độ mol CM", "Hòa tan 0.2 mol NaCl vào nước được 500 ml dung dịch. Tính nồng độ mol CM."],
  ["Nồng độ C%", "Hòa tan 20 gam đường vào 180 gam nước. Tính nồng độ phần trăm C%."],
  ["Tính pH", "Tính pH của dung dịch có nồng độ ion [H+] = 0.001 M."],
  ["Kim loại + Axit", "Cho 5.4 gam Al tác dụng hoàn toàn với dung dịch HCl dư. Tính thể tích khí H2 thoát ra ở đktc."],
  ["Bảo toàn KL", "Đốt cháy hoàn toàn 2.4 gam Mg trong oxi thu được 4.0 gam MgO. Tính khối lượng O2 đã phản ứng."],
  ["Cân bằng PTHH", "Cân bằng phương trình phản ứng: Al + O2 -> Al2O3"]
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TN = {
  Algebra: "Đại số", Geometry: "Hình học", Calculus: "Giải tích", Arithmetic: "Số học",
  Mechanics: "Cơ học", Thermodynamics: "Nhiệt học", Electromagnetism: "Điện từ học", Optics: "Quang học",
  GeneralChem: "Hóa đại cương", InorganicChem: "Hóa vô cơ", SolutionChem: "Hóa dung dịch", OrganicChem: "Hóa hữu cơ"
};

const MATH_TOPICS = ["Algebra", "Geometry", "Calculus", "Arithmetic"];
const PHYSICS_TOPICS = ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"];
const CHEMISTRY_TOPICS = ["GeneralChem", "InorganicChem", "SolutionChem", "OrganicChem"];

// Khởi tạo trạng thái học sinh
let initialSubject = "math";
try {
  const savedSub = localStorage.getItem("apt_subject");
  if (savedSub === "physics" || savedSub === "math" || savedSub === "chemistry") initialSubject = savedSub;
} catch (e) { }

const S = {
  subject: initialSubject, // "math" | "physics" | "chemistry"
  cur: initialSubject === "chemistry" ? P[16] : (initialSubject === "physics" ? P[8] : P[0]),
  level: 1,
  done: 0,
  mastery: {
    Algebra: 0.85, Geometry: 0.62, Calculus: 0.40, Arithmetic: 0.95,
    Mechanics: 0.85, Thermodynamics: 0.65, Electromagnetism: 0.50, Optics: 0.70,
    GeneralChem: 0.80, InorganicChem: 0.65, SolutionChem: 0.70, OrganicChem: 0.55
  },
  wrong: 0,
  skip: new Set()
};

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
