# 🎓 HYBRID PROJECT MANAGEMENT PLATFORM
### Đề tài: Hệ thống Quản lý Dự án Tập trung tích hợp DevOps, Chat Real-time & AI Đánh giá

---

## 📖 1. Giới thiệu Dự án (Overview)

Repository **`Graduation-Project-System-NCB-NHT`** là mã nguồn chính thức của Đồ án tốt nghiệp: **"Hệ thống Quản lý Dự án Tập trung tích hợp DevOps, Chat Real-time & AI Đánh giá (Hybrid Project Management Platform)"**.

Hệ thống được xây dựng nhằm giải quyết bài toán quản lý dự án phần mềm theo mô hình lai (**Hybrid: Waterfall Phase + Agile Sprint/Kanban**), kết hợp phân bổ nguồn lực nhân sự (**HRM Skill Matrix**), tự động hóa đồng bộ trạng thái công việc từ **GitHub/GitLab CI/CD Webhook**, trao đổi nội bộ **Chat Real-time**, và ứng dụng **AI (LLM)** dự báo rủi ro trễ tiến độ cũng như đánh giá hiệu suất thành viên.

---

## 🏗️ 2. Kiến trúc Hệ thống & Công nghệ Sử dụng (Tech Stack)

Dự án được thiết kế theo mô hình **Modular Clean Architecture (Kiến trúc Sạch kết hợp Phân hệ Chức năng)** cùng **Headless API + Real-time SignalR**, phục vụ đồng thời cho cả Web Application và Mobile Application.

### 🖥️ Backend ([`Backend/Project-Management-System/`](./Backend/Project-Management-System))
* **Framework:** .NET 8.0 (ASP.NET Core Web API - LTS)
* **Kiến trúc 4 Tầng:** `App.Domain` → `App.Application` → `App.Infrastructure` → `App.WebApi`
* **Hybrid Data Access:**
  * **Entity Framework Core:** Quản lý Migrations, đảm bảo toàn vẹn khóa ngoại cho thao tác Thêm/Sửa/Xóa (`INSERT/UPDATE/DELETE`) và tự động ghi nhật ký truy vết qua `AuditLogInterceptor`.
  * **Micro-ORM Dapper:** Tối ưu tốc độ truy vấn SQL đọc dữ liệu lớn (`SELECT` phân trang, Kanban Board, biểu đồ Gantt/Burndown, tổng hợp số liệu cho AI).
* **Real-time & Tích hợp:** SignalR (`WorkspaceHub`), GitHub/GitLab Webhook (`X-Hub-Signature-256`), Gemini / OpenAI API, JWT Authentication.
* **Đa ngôn ngữ (`Localization`):** Chuyển đổi ngôn ngữ động theo từng Request qua Header `x-lang` (`vi-VN`, `en-US`), nạp từ điển từ bảng `LanguageResources` dưới Database vào `IMemoryCache` tốc độ cao.

### 🎨 Frontend Web ([`Website/`](./Website))
* **Core:** React 19 + Vite
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
* **Data Fetching & Real-time:** TanStack React Query v5 + Axios (Interceptors tự động đính kèm JWT & `x-lang`) + `@microsoft/signalr`
* **Routing & Visualization:** React Router DOM v7, Recharts

### 📱 Mobile App ([`Mobile-App/`](./Mobile-App))
* **Framework:** Flutter (Feature-First Architecture)

---

## 📚 3. Tài liệu Kỹ thuật Chi tiết (`Document/`)

* 📘 [Tài liệu Kiến trúc Hệ thống Backend & Luồng Dữ liệu](./Document/System-Architecture.md)
* ⚙️ [Hướng dẫn Cấu hình & Khởi chạy Hệ thống (Backend, Website & Mobile)](./Document/Installation-and-Configuration.md)
