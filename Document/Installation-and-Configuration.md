# HƯỚNG DẪN CẤU HÌNH & KHỞI CHẠY HỆ THỐNG (BACKEND .NET 8.0, WEBSITE REACT & MOBILE FLUTTER)

Tài liệu này lưu trữ toàn bộ các bước thiết lập môi trường, cấu hình khởi chạy máy chủ Backend trên Visual Studio / Terminal, cũng như câu lệnh cài đặt thư viện cho giao diện Web (`Website/`) và ứng dụng di động (`Mobile-App/`).

---

## PHẦN 1: CẤU HÌNH & KHỞI CHẠY BACKEND (`.NET 8.0` - `App.WebApi`)

Trong kiến trúc **Modular Clean Architecture** mới (`Backend/Project-Management-System/Project-Management-System.slnx`), toàn bộ chức năng xác thực JWT (`01_Identity`), REST API nghiệp vụ, GitHub Webhook và WebSocket (`SignalR`) đều được hợp nhất vào **1 cổng máy chủ duy nhất là `App.WebApi`**.

> **Lưu ý quan trọng:** Bạn **KHÔNG CẦN** cấu hình `Multiple Startup Projects` chạy 2 Port song song như hệ thống cũ nữa. Khi `App.WebApi` khởi chạy, nó sẽ tự động nạp cả 3 thư viện tầng dưới (`App.Domain`, `App.Application`, `App.Infrastructure`) thông qua liên kết `ProjectReference`.

### 1.1. Cách Build & Chạy trên Visual Studio ("Visual tím")
1. Mở file Solution tại đường dẫn:
   `Backend/Project-Management-System/Project-Management-System.slnx`
2. **Đặt Project khởi chạy (chỉ cần làm 1 lần đầu):**
   * Ở bảng **Solution Explorer** (bên phải), mở thư mục `src`.
   * Click chuột phải vào **`App.WebApi`** → chọn **`Set as Startup Project`** (tên `App.WebApi` sẽ **in đậm** lên).
3. **Chọn chế độ chạy trực tiếp (`https` thay vì Docker):**
   * Nhìn lên thanh công cụ trên cùng cạnh nút Play màu xanh lá (`▶`).
   * Nếu đang hiển thị chữ **`Container (Dockerfile)`** mà máy bạn chưa bật Docker Desktop, hãy bấm vào **mũi tên nhỏ `▼`** kế bên → đổi sang chọn **`https`** (hoặc **`http`**).
4. **Build & Khởi chạy:**
   * Nhấn **`Ctrl + Shift + B`** để Build kiểm tra lỗi biên dịch toàn bộ 4 tầng (`Build: 4 succeeded, 0 failed`).
   * Nhấn phím **`F5`** (chạy kèm Debug) hoặc **`Ctrl + F5`** (chạy nhanh không Debug).
   * Trình duyệt sẽ tự động mở trang tài liệu API **Swagger UI** tại địa chỉ: `https://localhost:7299/swagger` (hoặc `http://localhost:5091/swagger`).

### 1.2. Cách Build & Chạy nhanh bằng Terminal (VS Code / PowerShell)
Khi đang code giao diện bên `Website/` hoặc `Mobile-App/` và muốn bật nhanh Backend mà không cần mở Visual Studio:

```powershell
# 1. Di chuyển vào thư mục chứa Solution Backend
cd Backend/Project-Management-System

# 2. Build kiểm tra toàn bộ dự án
dotnet build

# 3. Khởi chạy Server App.WebApi với cấu hình https
dotnet run --project App.WebApi --launch-profile https
```

### 1.3. Các câu lệnh quản lý Database Migration (EF Core)
Khi thêm hoặc chỉnh sửa các bảng `Entities` trong `App.Domain` và cấu hình trong `App.Infrastructure/Persistence/AppDbContext.cs`, mở Terminal tại thư mục `Backend/Project-Management-System` để chạy Migration:

```powershell
# 1. Cài đặt công cụ dotnet-ef (chỉ cần chạy 1 lần trên máy mới)
dotnet tool install --global dotnet-ef

# 2. Tạo bản ghi thay đổi cấu trúc bảng mới (thay <TenMigration> bằng tên mô tả, VD: InitDatabase)
dotnet ef migrations add <TenMigration> --project App.Infrastructure --startup-project App.WebApi

# 3. Áp dụng thay đổi để tự động tạo/cập nhật bảng xuống Database thật
dotnet ef database update --project App.Infrastructure --startup-project App.WebApi
```

---

## PHẦN 2: CÀI ĐẶT & KHỞI CHẠY FRONTEND WEB (`Website/` - REACT 19 + VITE + TAILWIND V4)

Mã nguồn giao diện Web được đặt tại thư mục **`Website/`** ở gốc dự án, sử dụng bộ công nghệ: **React 19 + Vite + Tailwind CSS v4 + TanStack React Query v5 + Axios + SignalR Client**.

### 2.1. Chạy dự án đối với thành viên kéo code từ Git về
Mở Terminal tại thư mục gốc của Repository:

```bash
# 1. Di chuyển vào thư mục Website
cd Website

# 2. Cài đặt toàn bộ thư viện khai báo trong package.json
npm install

# 3. Cài đặt thư viện SignalR Client (phục vụ Chat Real-time & đồng bộ bảng Kanban)
npm install @microsoft/signalr

# 4. Chạy máy chủ phát triển giao diện (Vite Dev Server)
npm run dev
```

### 2.2. Quy chuẩn cấu hình `axiosClient` gửi JWT & Đa ngôn ngữ (`x-lang`)
Khi gọi xuống `App.WebApi`, toàn bộ HTTP Request từ React đều đi qua Request Interceptor của Axios để tự động gắn thẻ định danh **Bearer Token** và mã ngôn ngữ hiện tại (**`x-lang`**) khớp với `LocalizationMiddleware` của Backend:

```javascript
// Ví dụ chuẩn trong Website/src/api/axiosClient.js
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const currentLang = localStorage.getItem("appLanguage") || "vi-VN"; // "vi-VN" hoặc "en-US"

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["x-lang"] = currentLang;

  return config;
});
```

*(Lưu ý phụ: Nếu cần khởi tạo mới hoàn toàn từ đầu trên một thư mục trắng, dùng lệnh `npm create vite@latest Website -- --template react` và cài đặt gói `npm install tailwindcss @tailwindcss/vite axios react-router-dom @tanstack/react-query @tanstack/react-query-devtools recharts @microsoft/signalr`).*

---

## PHẦN 3: CÀI ĐẶT & KHỞI CHẠY MOBILE APP (`Mobile-App/` - FLUTTER)

Mã nguồn ứng dụng di động đặt tại thư mục **`Mobile-App/flutter_application_1/`**:

```bash
# 1. Di chuyển vào thư mục ứng dụng Flutter
cd Mobile-App/flutter_application_1

# 2. Tải toàn bộ thư viện khai báo trong pubspec.yaml
flutter pub get

# 3. Khởi chạy ứng dụng lên máy ảo Android / iOS hoặc thiết bị thật
flutter run
```

> **Mẹo kết nối API từ Máy ảo Android vào Backend chạy Localhost:**
> Trên trình giả lập Android Emulator, địa chỉ `localhost` của máy tính tương ứng với IP **`10.0.2.2`** (ví dụ gọi qua HTTP Port `http://10.0.2.2:5091/api/...`), đồng thời nhớ đính kèm Header `Authorization` và `x-lang` tương tự như trên Web React.
