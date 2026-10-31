# AdaptiveTutor AI - Gia Sư Thông Minh Liên Môn Toán Học, Vật Lý & Hóa Học

Hệ thống gia sư AI liên môn thích ứng: tích hợp toàn diện cả **Toán học** (Đại số, Hình học, Giải tích, Số học), **Vật lý** (Cơ học, Nhiệt học, Điện từ học, Quang học) và **Hóa học** (Hóa đại cương, Vô cơ, Dung dịch, Hữu cơ). Hệ thống hỗ trợ chuyển đổi linh hoạt giữa 3 môn học 1-chạm, tự động phân loại dạng bài (TF-IDF + Logistic Regression), giải chi tiết từng bước 36 dạng chuẩn, gợi ý học tập thích ứng (Deep Knowledge Tracing - BKT), và kết nối **Google Gemini AI**.

Hỗ trợ 3 hình thức trải nghiệm:
1. **Giao diện Web Trực tiếp trên GitHub Pages**: 100% Client-side, không cần cài đặt Python.
2. **Giao diện Web Localhost với Máy chủ Flask**: Chạy qua lệnh `python backend/app.py` hoặc mở trực tiếp `index.html`.
3. **Ứng dụng Python Native trên Terminal**: Chạy trực tiếp qua `python main.py` hỗ trợ giao diện console tiện lợi.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

### 1. Hỗ Trợ Đa Nền Tảng: GitHub Pages, Localhost & Python CLI
* **Chế độ Web Tĩnh (GitHub Pages):** Hoạt động ngay lập tức không cần cài đặt Python. Toàn bộ 36 thuật toán giải Toán, Lý & Hóa chạy trực tiếp trong trình duyệt bằng JavaScript ngoại tuyến. Học sinh có thể gắn khóa Gemini AI cá nhân trong giao diện web (lưu trữ cục bộ `localStorage`, an toàn tuyệt đối).
* **Chế độ Máy Chủ Tập Trung (Backend Flask):** Dành cho trường học hoặc lớp học, máy chủ quản lý tập trung khóa `GEMINI_API_KEY` trong `.env`, học sinh chỉ cần truy cập `http://localhost:5000` là dùng ngay mà không cần tài khoản hay API key.
* **Chế độ Python Native (Terminal CLI):** Chạy trực tiếp qua lệnh `python main.py`, giải ngay lập tức trên màn hình dòng lệnh với tiếng Việt UTF-8 chuẩn.

### 2. Tích Hợp 3 Môn Trong 1 & Nút Chuyển Môn 1-Chạm
* **Bộ chuyển đổi môn học chuyên dụng:** Chuyển đổi mượt mà giữa **[ 📐 Toán học ]**, **[ ⚛️ Vật lý ]** và **[ 🧪 Hóa học ]**.
* **Đồng bộ hóa toàn diện khi đổi môn:**
  * Tự động chuyển đổi đề bài mẫu, gợi ý nhập liệu và nhãn phân môn.
  * Tự động điều chỉnh nhân cách sư phạm của Gia sư AI:
    * **Toán học:** Tập trung vào suy luận logic, định lý, biến đổi đại số, vẽ đồ thị.
    * **Vật lý:** Tập trung vào phân tích hiện tượng, điều kiện định luật, đổi đơn vị chuẩn SI, vẽ sơ đồ lực/mạch điện/quang hình.
    * **Hóa học:** Tập trung vào hiện tượng phản ứng, viết PTHH cân bằng, bảo toàn nguyên tố/khối lượng/electron, nồng độ dung dịch và tính pH.
  * Lộ trình học tập và theo dõi tri thức (DKT/BKT) ghi nhận tiến trình riêng biệt cho cả Toán, Lý và Hóa.

### 3. Giao Diện Đáp Ứng Cao Cấp (Modern Responsive Design)
* **Bố cục 2 cột trên Desktop:** Bảng điều khiển nhập liệu và chọn môn học luôn ghim cạnh lời giải, KaTeX công thức sắc nét và biểu đồ SVG trực quan.
* **Tối ưu Mobile:** Thanh điều hướng đáy tiện lợi, thao tác ngón tay mượt mà với hiệu ứng kính mờ (glassmorphism).
* **Chế độ Sáng/Tối (Light/Dark Mode):** Chuyển đổi linh hoạt với bảng màu HSL hài hòa, bảo vệ mắt khi học tập ban đêm.

### 4. Bộ Giải 36 Dạng Chuẩn & Đồ Thị / Sơ Đồ Trực Quan
* **12 Dạng Toán học:** Phương trình bậc 1, bậc 2, hệ phương trình, bất phương trình, đạo hàm, nguyên hàm, hình tròn, tam giác Pythagore, số học, phân số, phần trăm, ƯCLN/BCNN.
* **12 Dạng Vật lý:** Chuyển động biến đổi đều, rơi tự do, định luật 2 Newton, công & công suất, định luật chất khí Boyle, nhiệt lượng & truyền nhiệt, định luật Ohm, thấu kính mỏng, mạch điện...
* **12 Dạng Hóa học:** Tính số mol & khối lượng ($n = m/M$), thể tích khí đktc ($V = n \times 22.4$), nồng độ mol $C_M$, nồng độ phần trăm $C\%$, tính pH dung dịch axit/bazơ, cân bằng PTHH, kim loại tác dụng axit sinh khí $H_2$, bảo toàn khối lượng, hiệu suất phản ứng $H\%$, phản ứng tạo kết tủa, xác định khối lượng mol kim loại $M$, phần trăm khối lượng nguyên tố trong hợp chất.
* **Sơ đồ mô phỏng:** Đồ thị vận tốc - thời gian $v(t)$, sơ đồ tia sáng thấu kính hội tụ, sơ đồ mạch điện SVG và thang đo pH.

---

## 📁 CẤU TRÚC DỰ ÁN

```
AdaptiveTutor_AI_Unified/
├── .env.example              # Mẫu biến môi trường an toàn (không chứa key thật)
├── .gitignore                # Chặn commit file .env, database SQLite và cache
├── .nojekyll                 # Đảm bảo GitHub Pages nhận đầy đủ các tệp tĩnh
├── index.html                # Giao diện web hợp nhất chuẩn Responsive (2 cột Desktop / Mobile)
├── main.py                   # Ứng dụng gia sư Python trực tiếp trên Terminal (CLI Native)
├── README.md                 # Tài liệu hướng dẫn sử dụng & triển khai
├── css/
│   └── style.css             # Giao diện hiện đại, responsive tokens, Dark/Light Mode, glassmorphism
├── js/
│   ├── api.js                # Quản lý giao tiếp API backend & gọi trực tiếp Gemini client
│   ├── auth.js               # Quản lý cấu hình khóa Gemini cho trình duyệt & ngoại tuyến
│   ├── config.js             # Cấu hình hệ thống & điểm cuối API
│   ├── data.js               # Bộ 1.200+ bài tập mẫu Toán, Lý, Hóa & hằng số tri thức
│   ├── explain.js            # Hiển thị giải thích KaTeX, sơ đồ SVG & đối thoại gia sư Socratic
│   ├── main.js               # Khởi tạo theme, router và trạng thái ứng dụng
│   ├── ml-screen.js          # Giám sát mô hình phân loại ML & thuật toán gợi ý
│   ├── recommender.js        # Gợi ý bài tập tương đồng TF-IDF
│   ├── screens.js            # Điều hướng tab, chuyển đổi môn học Toán/Lý/Hóa
│   └── solver.js             # Bộ giải ngoại tuyến 36 dạng chuẩn Toán, Lý & Hóa (100% JavaScript)
└── backend/
    ├── app.py                # Máy chủ Flask: API giải bài, API gia sư, rate limiting
    ├── accounts.py           # Quản lý lưu trạng thái, mã hóa an toàn
    ├── ai_providers.py       # Bộ gọi AI bảo mật (Google Gemini, OpenAI, Claude, DeepSeek)
    ├── llm.py                # Prompt Socratic chuyên sâu Toán, Lý, Hóa, parse KaTeX JSON
    ├── solver.py             # Bộ giải 36 dạng chuẩn Toán, Lý, Hóa trên Python server
    ├── ml.py                 # Bộ phân loại TF-IDF + Logistic Regression, BKT
    ├── requirements.txt      # Thư viện Python cần thiết
    ├── data/
    │   └── problems.csv      # Ngữ liệu liên môn chuẩn hóa (1.200+ bài tập mẫu)
    └── tests/
        ├── test_security.py  # Kiểm thử an toàn thông tin & bảo vệ khóa
        └── test_solver.py    # Kiểm thử bộ giải Toán, Lý, Hóa
```

---

## 🚀 HƯỚNG DẪN CHẠY VÀ TRIỂN KHAI

### CÁCH 1: Triển khai trực tiếp lên GitHub Pages (Nhanh nhất & Miễn phí)

1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn:
   ```bash
   git push origin main
   ```
2. Trên GitHub, vào mục **Settings** -> **Pages** (cột bên trái).
3. Tại phần **Build and deployment**:
   - **Source:** Chọn `Deploy from a branch`
   - **Branch:** Chọn nhánh `main` và thư mục `/ (root)`
   - Nhấn **Save**.
4. Sau 1-2 phút, GitHub Pages sẽ kích hoạt đường dẫn website dạng:
   `https://<username>.github.io/<repo-name>/`
5. **Cách hoạt động trên GitHub Pages:**
   - 36 dạng toán, vật lý và hóa học cơ bản giải ngay lập tức không cần máy chủ.
   - Để kích hoạt AI tự luận phân tích sâu: Nhấn vào biểu tượng chìa khóa góc trên bên phải, dán Google Gemini API Key miễn phí (lấy tại [Google AI Studio](https://aistudio.google.com/app/apikey)) rồi bấm **Lưu**. Khóa được lưu an toàn trong trình duyệt của bạn và **không bao giờ bị đẩy lên GitHub**.

---

### CÁCH 2: Chạy Web cục bộ trên máy tính (Localhost)

1. **Chạy ngoại tuyến tức thì (không cần Python):**
   - Nhấp đúp chuột mở trực tiếp tệp `index.html` trong bất kỳ trình duyệt nào (Chrome, Edge, Firefox).
   - Toàn bộ 36 dạng toán, vật lý, hóa học giải được ngay lập tức 100% ngoại tuyến.

2. **Hoặc chạy với Máy chủ Flask (kết nối AI tự luận):**
   ```bash
   # Cài đặt thư viện Python (chỉ cần làm 1 lần đầu)
   pip install -r backend/requirements.txt

   # Khởi chạy máy chủ
   python backend/app.py
   ```
   Mở trình duyệt tại: `http://localhost:5000`.

---

### CÁCH 3: Chạy trực tiếp trên Terminal (Python Native)

Chạy ứng dụng gia sư trực tiếp trong dòng lệnh mà không cần mở trình duyệt web:
```bash
python main.py
```
Nhập bất kỳ bài toán, bài vật lý hoặc hóa học (hoặc chọn các bài mẫu) để xem lời giải chi tiết từng bước.

---

## 👤 TÀI KHOẢN & AI RIÊNG CỦA TỪNG TÀI KHOẢN

Khi chạy bằng máy chủ Flask (`python backend/app.py`), bấm nút chìa khóa góc trên bên phải:

1. **Đăng nhập bằng email**: nhập email, nhận mã 6 số (khi chạy thử với `MAIL_DEV=1` mã được điền sẵn; khi triển khai thật hãy cấu hình SMTP và đặt `MAIL_DEV=0`).
2. **Dán API key một lần**: key được kiểm tra rồi **mã hóa ở máy chủ** (Fernet, khóa dẫn xuất từ `SECRET_KEY`) và gắn với tài khoản. API **không bao giờ trả key về trình duyệt**.
3. Lần sau đăng nhập, tài khoản đó **tự động dùng AI của chính mình**, không tốn hạn mức hệ thống.

Thứ tự chọn AI: **key của tài khoản** → `GEMINI_API_KEY` của máy chủ (có giới hạn theo tài khoản / IP khách / toàn cục) → key dán trong trình duyệt (chưa đăng nhập).

| Endpoint | Mô tả |
|---|---|
| `POST /api/auth/request`, `/api/auth/verify`, `/api/auth/logout` | Đăng nhập email bằng mã 6 số / đăng xuất mọi thiết bị |
| `GET /api/ai` | Trạng thái AI (không chứa key) |
| `PUT /api/ai` | Lưu key riêng của tài khoản (cần đăng nhập) |
| `DELETE /api/ai` | Xóa key của tài khoản |

> Đổi `SECRET_KEY` sẽ làm các key đã lưu không giải mã được (giao diện báo rõ); người dùng chỉ cần dán lại.

## 🔒 AN TOÀN THÔNG TIN & BẢO MẬT API KEY

* **Không lưu khóa trong mã nguồn:** Toàn bộ khóa bảo mật trên máy chủ được tách biệt trong tệp `.env`.
* **Cấu hình .gitignore nghiêm ngặt:** Tệp `.gitignore` đã chặn hoàn toàn việc theo dõi `.env`, các file `.db` SQLite và các file nhật ký.
* **Bảo vệ người dùng trên GitHub Pages:** Khi chạy trên GitHub Pages, khóa API do người dùng nhập chỉ được lưu trong `localStorage` của trình duyệt cá nhân, gọi trực tiếp từ trình duyệt đến API Google Generative AI (qua giao thức HTTPS bảo mật), không đi qua bất kỳ bên thứ ba nào.
