# HƯỚNG DẪN CẤU HÌNH CHẠY BACKEND (.NET 8.0) & CÀI ĐẶT FRONTEND (REACT + TAILWIND V4)

Tài liệu này lưu trữ các bước thiết lập để khởi chạy đồng thời các tiến trình máy chủ ở phía Backend và toàn bộ câu lệnh khởi tạo, cài đặt thư viện cho phía Frontend.

---

## PHẦN 1: CẤU HÌNH CHẠY ĐỒNG THỜI CÁC TIẾN TRÌNH BACKEND (`Multiple Startup Projects`)

Trong kiến trúc hệ thống ở tầng `04.App.Web`, chúng ta có 2 máy chủ chạy độc lập trên 2 Port khác nhau là **`App.Identity.Server`** (Xác thực cấp JWT) và **`App.Web.API`** (Xử lý nghiệp vụ). 

Để mỗi lần bấm nút **Start (F5)** trên Visual Studio, cả 2 máy chủ này đều tự động bật lên cùng lúc, bạn thực hiện theo các bước sau:

### Các bước thực hiện trên Visual Studio:
1. Mở bảng **Solution Explorer** (nằm ở bên phải màn hình).
2. **Click chuột phải** vào dòng trên cùng của Solution: **`Solution 'App.Backend' (6 of 6 projects)`**.
3. Chọn mục **`Configure Startup Projects...`** (hoặc chọn **`Properties`**).
4. Một cửa sổ mới hiện lên, tại mục **Common Properties** $\rightarrow$ **Startup Project**, bạn tích chọn vào dòng **`Multiple startup projects:`**.
5. Nhìn vào bảng danh sách các Project ở bên dưới, tại cột **Action**, bạn thiết lập như sau:
   * **`App.Web.Core`**: Giữ nguyên là `None`
   * **`App.Web.Core.Resources`**: Giữ nguyên là `None`
   * **`App.Web.Generator`**: Giữ nguyên là `None` *(Chỉ bấm chạy riêng khi cần sinh code `.g.cs`)*
   * **`App.Business.Core`**: Giữ nguyên là `None`
   * **`App.Web.Model`**: Giữ nguyên là `None`
   * **`App.Identity.Server`**: Đổi từ `None` sang **`Start`**
   * **`App.Web.API`**: Đổi từ `None` sang **`Start`**
6. Bấm nút **`Apply`** $\rightarrow$ Bấm **`OK`**.

> **Kết quả:** Từ bây giờ, trên thanh công cụ chính của Visual Studio sẽ hiển thị chữ `<Multiple Startup Projects>`. Khi bạn nhấn phím **F5** (hoặc nút Play màu xanh), cả 2 máy chủ `Identity.Server` và `Web.API` sẽ cùng khởi chạy song song.

---

## PHẦN 2: CÁC LỆNH CÀI ĐẶT MÔI TRƯỜNG FRONTEND (REACT + VITE + TAILWIND CSS V4)

Dưới đây là toàn bộ các bước và câu lệnh Terminal để tạo dự án giao diện Web theo đúng bộ công nghệ của `InnkeeperHub-Website` (React 19 + Vite + Tailwind CSS v4 + Axios + TanStack React Query).

### Bước 1: Tạo khung dự án React bằng Vite
Mở **Terminal** (`` Ctrl + ` ``) tại thư mục gốc của Đồ án (nằm ngang hàng với thư mục `Backend`) và chạy lần lượt các lệnh:

```bash
# 1. Khởi tạo project React (chọn template JavaScript chuẩn của Vite)
npm create vite@latest Frontend -- --template react

# 2. Di chuyển vào thư mục Frontend vừa tạo
cd Frontend

# 3. Cài đặt các gói mặc định của React & Vite
npm install
```

### Bước 2: Cài đặt Tailwind CSS v4 và các thư viện cốt lõi
Chạy 2 cụm lệnh sau trong Terminal (đảm bảo đang đứng ở thư mục `Frontend`):

```bash
# 1. Cài đặt Tailwind CSS v4 tích hợp trực tiếp với Vite
npm install tailwindcss @tailwindcss/vite

# 2. Cài đặt bộ thư viện điều hướng, gọi API, quản lý State, biểu đồ & quét mã QR/Barcode
npm install axios react-router-dom @tanstack/react-query @tanstack/react-query-devtools recharts html5-qrcode jsbarcode @zxing/browser
```
