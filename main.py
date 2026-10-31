# -*- coding: utf-8 -*-
"""
AdaptiveTutor AI - Ứng dụng Gia sư Liên môn Toán - Vật lý - Hóa học (Python Native)
Chạy trực tiếp trên Terminal:  python main.py
"""

import os
import sys
import re
import pathlib

# Đảm bảo in tiếng Việt chuẩn trên Windows console
if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
if hasattr(sys.stderr, "reconfigure"):
    try: sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

# Nạp thư viện từ backend
ROOT = pathlib.Path(__file__).parent
sys.path.insert(0, str(ROOT / "backend"))

import envload
envload.load_env()   # đọc GEMINI_API_KEY... từ .env giống bản web

import solver
from ml import Engine
import ai_providers
import llm

# Khởi tạo mô hình phân loại Machine Learning
print("🔄 Đang khởi tạo mô hình Machine Learning & Bộ giải Python...")
eng = Engine()
print("✓ Sẵn sàng!\n")

def clean_html(text):
    """Chuyển đổi thẻ HTML / KaTeX sang văn bản console dễ đọc"""
    if not text:
        return ""
    t = str(text)
    t = re.sub(r'<div class="math">\$\$(.*?)\$\$</div>', r'   [\1]', t)
    t = re.sub(r'<div class="ok"[^>]*>(.*?)</div>', r'   ==> \1', t)
    t = re.sub(r'<div class="concept"><b>(.*?):</b> (.*?)</div>', r'   💡 \1: \2', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = t.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
    return t.strip()

def print_banner():
    print("=" * 66)
    print("      📐⚛️🧪 ADAPTIVETUTOR AI - GIA SƯ LIÊN MÔN (BẢN PYTHON)      ")
    print("      Toán học · Vật lý · Hóa học (Giải chi tiết từng bước)       ")
    print("=" * 66)

def solve_problem(text, api_key=""):
    """Giải một bài toán bằng bộ giải Python và AI"""
    text = text.strip()
    if not text:
        return
    
    print("\n🔍 Đang phân tích đề bài...")
    label, conf = eng.classify(text)
    topic, kind, diff = solver.META.get(label, ("Unknown", "Tổng hợp", 1))
    
    print(f"📌 Phân loại dạng bài: [{topic}] {kind} (Độ tin cậy: {round(conf * 100, 1)}%)")
    
    # 1. Thử giải bằng bộ giải công thức 36 dạng của Python
    res = solver.solve(text, label)
    
    # Thử các dạng phổ biến nếu chưa khớp
    if not res.get("valid"):
        alts = ("linear", "quad", "system", "ineq", "kinematics", "freefall", "ohm", "thermal", "newton2",
                "chem_mol", "chem_gas", "chem_conc_mol", "chem_conc_pct", "chem_ph", "chem_metal_acid", "chem_eq")
        for alt in alts:
            if alt == label:
                continue
            r_alt = solver.solve(text, alt)
            if r_alt.get("valid") and r_alt.get("steps"):
                res = r_alt
                label = alt
                topic, kind, diff = solver.META.get(label, (topic, kind, diff))
                break

    # 2. Nếu là bài tự luận hoặc chưa giải được -> Chuyển sang AI Gemini (nếu có key)
    if not res.get("valid"):
        key = api_key or os.environ.get("GEMINI_API_KEY", "").strip()
        if key:
            print("🤖 Bài toán tự luận / mở rộng: Đang kết nối Google Gemini AI...")
            cfg = {
                "provider": "gemini",
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "model": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
                "key": key
            }
            try:
                ai_res = llm.ask(text, cfg, profile="Học sinh học liên môn", subject="auto")
                if ai_res and ai_res.get("valid"):
                    res = ai_res
            except Exception as e:
                print(f"⚠️ Lỗi kết nối Gemini API: {e}")

    # 3. In kết quả ra màn hình Console
    print("\n" + "-" * 66)
    if res.get("valid") and res.get("steps"):
        print(f"📖 LỜI GIẢI TỪNG BƯỚC ({kind}):")
        for idx, step in enumerate(res["steps"], 1):
            title = step.get("t", f"Bước {idx}")
            desc = clean_html(step.get("h", ""))
            print(f"\n{idx}. {title}:")
            print(f"   {desc}")
        
        print("\n" + "-" * 66)
        print(f"🎯 ĐÁP SỐ CHÍNH THỨC: {res.get('ans', 'Đã hoàn thành')}")
        print("-" * 66)
    else:
        print("⚠️ Chưa tìm được lời giải tự động cho đề bài này.")
        print("💡 Mẹo: Bạn có thể nhập Gemini API Key để giải các bài tự luận phức tạp.")
        print("-" * 66)

    return res

def main():
    print_banner()
    
    # Đọc API key nếu người dùng đã lưu
    saved_key = os.environ.get("GEMINI_API_KEY", "").strip()
    
    while True:
        print("\n--- MENU CHỨC NĂNG ---")
        print("1. Giải bài tập mới (Nhập đề bài Toán, Lý hoặc Hóa)")
        print("2. Xem và giải 24 bài tập mẫu chuẩn")
        print("3. Cấu hình Google Gemini API Key")
        print("4. Thoát chương trình")
        
        choice = input("\n👉 Chọn chức năng (1-4): ").strip()
        
        if choice == "1":
            print("\nNhập đề bài của bạn (hoặc gõ 'q' để quay lại):")
            prob = input("Đề bài: ").strip()
            if prob and prob.lower() != 'q':
                solve_problem(prob, saved_key)
                
        elif choice == "2":
            samples = [
                # Toán học
                ("Toán", "Tìm x biết 2x + 5 = 15"),
                ("Toán", "Giải phương trình bậc hai x^2 - 5x + 6 = 0"),
                ("Toán", "Tính đạo hàm của hàm số y = x^3 + 2x"),
                ("Toán", "Tính diện tích hình tròn có bán kính r = 5"),
                ("Toán", "Giải hệ phương trình 2x + y = 7 và x - y = 2"),
                ("Toán", "Tìm nguyên hàm của hàm số y = 3x^2 + 2x"),
                ("Toán", "Tam giác vuông có hai cạnh góc vuông 3 và 4. Tính cạnh huyền"),
                ("Toán", "Tính 15% của 240"),
                # Vật lý
                ("Vật lý", "Một vật chuyển động với v0 = 5 m/s, gia tốc a = 2 m/s^2 trong t = 4 s. Tính vận tốc v và quãng đường s."),
                ("Vật lý", "Một vật rơi tự do từ độ cao h = 45 m, lấy g = 10 m/s^2. Tính thời gian rơi t và vận tốc chạm đất."),
                ("Vật lý", "Tác dụng một lực không đổi F = 20 N vào vật có khối lượng m = 4 kg. Tính gia tốc a của vật."),
                ("Vật lý", "Lực kéo F = 50 N tác dụng làm vật dịch chuyển s = 10 m trong t = 5 s. Tính công A và công suất P."),
                ("Vật lý", "Khối khí có thể tích V1 = 10 lít ở áp suất p1 = 1 atm. Nén đẳng nhiệt đến thể tích V2 = 4 lít. Tính áp suất p2."),
                ("Vật lý", "Tính nhiệt lượng cần cung cấp để đun sôi m = 2 kg nước từ t1 = 20 °C đến t2 = 100 °C, biết c = 4200 J/kg.K."),
                ("Vật lý", "Đặt hiệu điện thế U = 24 V vào hai đầu điện trở R = 12 Ω. Tính cường độ dòng điện I chạy qua điện trở."),
                ("Vật lý", "Vật sáng AB đặt vuông góc với trục chính của thấu kính hội tụ có tiêu cự f = 20 cm, cách thấu kính d = 30 cm. Xác định vị trí d' của ảnh."),
                # Hóa học
                ("Hóa học", "Tính số mol của 5.4 gam Al, biết M = 27 g/mol."),
                ("Hóa học", "Tính thể tích của 0.25 mol khí H2 ở điều kiện tiêu chuẩn (đktc)."),
                ("Hóa học", "Hòa tan 0.2 mol NaCl vào nước được 500 ml dung dịch. Tính nồng độ mol CM."),
                ("Hóa học", "Hòa tan 20 gam đường vào 180 gam nước. Tính nồng độ phần trăm C%."),
                ("Hóa học", "Tính pH của dung dịch có nồng độ ion [H+] = 0.001 M."),
                ("Hóa học", "Cho 5.4 gam Al tác dụng hoàn toàn với dung dịch HCl dư. Tính thể tích khí H2 thoát ra ở đktc."),
                ("Hóa học", "Đốt cháy hoàn toàn 2.4 gam Mg trong oxi thu được 4.0 gam MgO. Tính khối lượng O2 đã phản ứng."),
                ("Hóa học", "Cân bằng phương trình phản ứng: Al + O2 -> Al2O3")
            ]
            print("\n--- DANH SÁCH 24 BÀI TẬP MẪU CHUẨN ---")
            for i, (sub, text) in enumerate(samples, 1):
                print(f"{i:2d}. [{sub}] {text}")
            
            sel = input("\n👉 Nhập số thứ tự bài mẫu muốn giải (1-24) hoặc Enter để quay lại: ").strip()
            if sel.isdigit() and 1 <= int(sel) <= len(samples):
                solve_problem(samples[int(sel) - 1][1], saved_key)
                
        elif choice == "3":
            print(f"\nKhóa hiện tại: {'Đã cấu hình' if saved_key else 'Chưa có'}")
            new_k = input("Dán Google Gemini API Key của bạn (nhấn Enter để giữ nguyên): ").strip()
            if new_k:
                saved_key = new_k
                os.environ["GEMINI_API_KEY"] = new_k
                print("✓ Đã lưu API Key cho phiên làm việc hiện tại!")
                
        elif choice == "4":
            print("\nCảm ơn bạn đã sử dụng AdaptiveTutor AI! Tạm biệt.")
            break
        else:
            print("⚠️ Lựa chọn không hợp lệ, vui lòng chọn từ 1 đến 4.")

if __name__ == "__main__":
    main()
