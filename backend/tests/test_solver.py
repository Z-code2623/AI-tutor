"""Kiểm thử tự động cho toàn bộ bộ giải liên môn Toán học, Vật lý & Hóa học.
Chạy:  cd backend && python -m unittest discover -s tests -v
"""
import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
import solver


def ans(label, text):
    r = solver.solve(text, label)
    return r["ans"] if r["valid"] else None


class DualSolverCorrectness(unittest.TestCase):
    # ---------- PHẦN 1: TOÁN HỌC ----------
    def test_math_quadratic(self):
        self.assertEqual(ans("quad", "x^2 + 1 = 0"), "Vô nghiệm thực")
        self.assertEqual(ans("quad", "x^2 - 5x + 6 = 0"), "x₁ = 2, x₂ = 3")
        self.assertEqual(ans("quad", "2x^2 - 8 = 0"), "x₁ = -2, x₂ = 2")
        self.assertEqual(ans("quad", "x^2 + x + 1 = 3x"), "x = 1")

    def test_math_linear(self):
        self.assertEqual(ans("linear", "2x + 5 = 15"), "x = 5")
        self.assertEqual(ans("linear", "x + 3 = x + 5"), "Vô nghiệm")

    def test_math_calculus(self):
        self.assertEqual(ans("deriv", "y = x^2 + 3x + 5"), "y' = 2x + 3")
        self.assertEqual(ans("integ", "Tìm nguyên hàm của y = 2x + 3"), "F(x) = x^2 + 3x + C")

    def test_math_system(self):
        self.assertEqual(ans("system", "x + y = 3; x - y = 1"), "x = 2, y = 1")

    def test_math_arith_and_geom(self):
        self.assertEqual(ans("gcd", "ƯCLN của 12, 18 và 24"), "ƯCLN(12, 18, 24) = 6")
        self.assertEqual(ans("arith", "(12 + 8) × 3 - 4"), "56")
        self.assertEqual(ans("geom", "Tính diện tích hình chữ nhật dài 5 rộng 3"), "Diện tích = 15")

    # ---------- PHẦN 2: VẬT LÝ ----------
    def test_physics_kinematics(self):
        self.assertEqual(ans("kinematics", "Xe chuyển động với v0 = 5, a = 2, t = 4"), "v = 13 m/s, s = 36 m")
        self.assertEqual(ans("kinematics", "v0 = 0, v = 20, a = 4"), "t = 5 s, s = 50 m")

    def test_physics_freefall_and_newton(self):
        self.assertEqual(ans("freefall", "Vật rơi tự do từ h = 45 với g = 10"), "t = 3 s, v = 30 m/s")
        self.assertEqual(ans("newton2", "Tác dụng lực F = 20 lên vật m = 4"), "a = 5 m/s²")

    def test_physics_work_energy(self):
        self.assertEqual(ans("work_power", "Lực F = 50 kéo vật s = 10 trong t = 5"), "A = 500 J, P = 100 W")
        self.assertEqual(ans("energy", "Vật m = 2 vận tốc v = 6 ở độ cao h = 5 với g = 10"), "Wđ = 36 J, Wt = 100 J, W = 136 J")

    def test_physics_thermal_gas(self):
        self.assertEqual(ans("gas_law", "Khí có p1 = 1, V1 = 10 nén đẳng nhiệt đến V2 = 4"), "p₂ = 2.5 atm")
        self.assertEqual(ans("thermal", "Đun m = 2 nước c = 4200 từ t1 = 20 đến t2 = 100"), "Q = 672000 J (672 kJ)")

    def test_physics_electricity_optics(self):
        self.assertEqual(ans("ohm", "U = 24 vào R = 12"), "I = 2 A")
        self.assertEqual(ans("elec_power", "Đèn có P = 100 thắp sáng trong t = 5 giờ"), "P = 100 W, A = 1800000 J (0.5 kWh)")
        self.assertIn("F = 28.8 N", ans("coulomb", "q1 = 2e-6 và q2 = -4e-6 đặt cách nhau r = 0.05"))
        self.assertEqual(ans("lens", "Thấu kính hội tụ f = 20, vật đặt cách thấu kính d = 30"), "d' = 60 cm (ảnh thật)")
        self.assertEqual(ans("refraction", "Tia sáng từ n1 = 1 vào nước n2 = 1.33 với i = 30"), "r ≈ 22.082°")

    # ---------- PHẦN 3: HÓA HỌC ----------
    def test_chemistry_mol_and_gas(self):
        self.assertEqual(ans("chem_mol", "Tính số mol của 5.4 gam Al, biết M = 27"), "n = 0.2 mol")
        self.assertEqual(ans("chem_mol", "Tính khối lượng của 0.2 mol Fe, biết M = 56"), "m = 11.2 g")
        self.assertEqual(ans("chem_gas", "Tính thể tích của 0.25 mol khí H2 ở đktc"), "V = 5.6 lít")
        self.assertEqual(ans("chem_gas", "Tính số mol của 4.48 lít khí CO2 ở đktc"), "n = 0.2 mol")

    def test_chemistry_solutions(self):
        self.assertEqual(ans("chem_conc_mol", "Hòa tan 0.2 mol NaCl vào nước để được 500 ml dung dịch. Tính nồng độ mol CM"), "CM = 0.4 M")
        self.assertEqual(ans("chem_conc_pct", "Hòa tan 20 gam đường vào 180 gam nước. Tính nồng độ phần trăm C%"), "C% = 10%")
        self.assertEqual(ans("chem_ph", "Tính pH của dung dịch có nồng độ [H+] = 0.001 M"), "pH = 3 (Môi trường Axit)")
        self.assertEqual(ans("chem_ph", "Tính pH của dung dịch có [OH-] = 10^-4 M"), "pH = 10 (Môi trường Bazơ)")

    def test_chemistry_reactions(self):
        self.assertEqual(ans("chem_metal_acid", "Cho 5.4 gam Al tác dụng hoàn toàn với dung dịch HCl dư. Tính V khí H2 đktc"), "V = 6.72 lít")
        self.assertEqual(ans("chem_metal_acid", "Cho 5.6 gam Fe tác dụng với dung dịch HCl dư. Tính V khí H2 đktc"), "V = 2.24 lít")
        self.assertEqual(ans("chem_mass_cons", "Đốt cháy 2.4 gam Mg trong oxi thu được 4.0 gam MgO. Tính khối lượng O2 phản ứng"), "m(O2) = 1.6 g")
        self.assertEqual(ans("chem_yield", "Lý thuyết thu được 10 gam sản phẩm, thực tế thu được 8 gam. Tính hiệu suất H%"), "H% = 80%")
        self.assertEqual(ans("chem_precip", "Cho 0.1 mol BaCl2 tác dụng vừa đủ với H2SO4. Tính khối lượng kết tủa BaSO4, biết M = 233"), "m(kết tủa) = 23.3 g")
        self.assertEqual(ans("chem_elem_pct", "Tính phần trăm khối lượng của Cu trong CuO, biết Cu = 64, O = 16"), "%m(Cu) = 80%")
        self.assertEqual(ans("chem_molar_mass", "Biết 0.15 mol kim loại có khối lượng 8.4 gam. Xác định khối lượng mol M"), "M = 56 g/mol (Sắt - Fe)")
        self.assertEqual(ans("chem_eq", "Cân bằng phương trình: Al + O2 -> Al2O3"), r"4Al + 3O_2 \to 2Al_2O_3")

    def test_hands_off_to_ai(self):
        for label, text in [
            ("deriv", "Tính đạo hàm y = sin(x)"),
            ("quad", "(x+1)^2 = 4"),
            ("kinematics", "Giải thích vì sao khi xe phanh gấp thì người bị ngả về phía trước?"),
            ("chem_eq", "Nêu hiện tượng khi nhỏ axit HCl vào dung dịch AgNO3?")
        ]:
            self.assertIsNone(ans(label, text))


if __name__ == "__main__":
    unittest.main()
