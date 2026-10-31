/* Khởi động ứng dụng */
function initTheme() {
  const saved = localStorage.getItem("apt_theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  const updateIcon = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const icon = $("#themeIcon");
    if (icon) icon.textContent = isDark ? "light_mode" : "dark_mode";
  };
  updateIcon();
  const btn = $("#themeToggle");
  if (btn) btn.onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark = cur === "dark" || (!cur && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("apt_theme", next);
    updateIcon();
  };
}
initTheme();
try {
  const hashQ = location.hash.startsWith("#q=") ? decodeURIComponent(location.hash.slice(3)) : null;
  const searchQ = new URLSearchParams(location.search).get("q");
  if (hashQ || searchQ) $("#q").value = hashQ || searchQ;
} catch (e) {}
render($("#q").value);
go((location.hash.startsWith("#q=") ? "giang-giai" : location.hash.slice(1)) || "giang-giai");
boot();
