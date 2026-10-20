# 🎓 [SMART FACTORY]
### Đề tài: [HỆ THỐNG NHÀ MÁY THÔNG MINH]
---

## 📖 1. Giới thiệu Dự án (Overview)

Repository **`Graduation-Project-System-NCB-NHT`** là mã nguồn chính thức của Đồ án tốt nghiệp: **"SMART FACTORY"**.

Hệ thống **`[SMART FACTORY]`** được xây dựng nhằm giải quyết bài toán **`[Quản lý vận hành, tối ưu quy trình nghiệp vụ, quản lý dữ liệu tập trung]`**, hướng tới tính ổn định, bảo mật, hỗ trợ đa ngôn ngữ và khả năng mở rộng theo tiêu chuẩn kiến trúc phần mềm doanh nghiệp (Enterprise Architecture).

## 🏗️ 2. Kiến trúc Hệ thống & Công nghệ Sử dụng (Tech Stack)

Dự án được thiết kế theo mô hình **Multi-Tier Layered Architecture (Kiến trúc Phân tầng Đa lớp)** kết hợp với **Headless RESTful API**, tách biệt hoàn toàn giữa Backend Server và Frontend Client (phục vụ đồng thời cho cả Web Application và Mobile Application).

### 🖥️ Backend (`Backend/`)
* **Framework:** .NET 8.0 (ASP.NET Core Web API - LTS)
* **Data Access:** Micro-ORM **Dapper** (Tối ưu hiệu năng truy vấn SQL thuần)
* **Cơ sở dữ liệu:** `[Điền tên Hệ quản trị CSDL: SQL Server / PostgreSQL / MySQL]`
* **Bảo mật & Xác thực:** Máy chủ xác thực tập trung (`App.Identity.Server`), JWT (JSON Web Token)
* **Đặc trưng kiến trúc:**
  * **Automated Code Generation (`App.Web.Generator`):** Tự động sinh mã nguồn hằng số (`.g.cs`) và từ điển đa ngôn ngữ từ Database, loại bỏ hoàn toàn *Magic Strings*.
  * **Core Base Infrastruktur (`App.Web.Core`):** Tự động hóa kiểm tra trùng lặp dữ liệu (`CheckDataExists`), kiểm tra ràng buộc khóa ngoại trước khi xóa (`CheckDataIsUsed`), và ghi nhật ký truy vết hệ thống (`SaveLogHistory` - Audit Log).
  * **Đa ngôn ngữ (Localization):** Hỗ trợ chuyển đổi ngôn ngữ động theo từng Request thông qua Header `x-lang`.

### 🎨 Frontend (`Frontend/`)
* **Core:** React 19 + Vite
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
* **Data Fetching & State Management:** TanStack React Query v5 + Axios (Interceptors tự động đính kèm JWT & `x-lang`)
* **Routing & Visualization:** React Router DOM v7, Recharts

---
