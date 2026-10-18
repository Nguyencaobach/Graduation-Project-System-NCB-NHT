# TÀI LIỆU KIẾN TRÚC HỆ THỐNG BACKEND & LUỒNG DỮ LIỆU
- **Backend:** NET 8.0 (Multi-Tier Layered Architecture + Dapper)
- **Frontend:** React 19 + Vite + Tailwind CSS v4 (TanStack Query + Axios)

Tài liệu này mô tả chi tiết cấu trúc thư mục, chức năng của từng Project (Tầng), giải thích lý do thiết lập các liên kết phụ thuộc (Project References - "nối dây"), và minh họa **luồng đi thực tế của một API từ lúc người dùng bấm nút trên giao diện cho đến khi trả kết quả về**.

---

## 1. Tổng quan Mô hình Kiến trúc

Hệ thống Backend được thiết kế theo mô hình **Multi-Tier Layered Architecture (Kiến trúc Phân tầng Đa lớp)** kết hợp với **Headless API** (tách biệt hoàn toàn giao diện Web React và Mobile App ra khỏi Server).

Toàn bộ Solution `App.Backend.sln` được chia thành **4 Khối (Solution Folders)** với **6 Projects** theo nguyên tắc: **Tầng trên phụ thuộc vào tầng dưới, tầng dưới tuyệt đối không biết sự tồn tại của tầng trên**.

```text
📦 App.Backend.sln
 ┣ 📂 01.App.Core (Tầng Lõi Kỹ Thuật)
 ┃  ┣ 📗 App.Web.Core
 ┃  ┗ 📗 App.Web.Core.Resources
 ┣ 📂 02.App.Development (Công Cụ Sinh Mã Nguồn)
 ┃  ┗ 🖥️ App.Web.Generator
 ┣ 📂 03.App.Shared (Tầng Nghiệp Vụ & Mô Hình Dữ Liệu)
 ┃  ┣ 📗 App.Web.Model
 ┃  ┗ 📗 App.Business.Core
 ┗ 📂 04.App.Web (Tầng Cổng Giao Tiếp & Bảo Mật)
    ┣ 🌐 App.Identity.Server
    ┗ 🌐 App.Web.API
```

---

## 2. Chi tiết Hoạt động của Từng Thư mục & Project

### KHỐI 1: `01.App.Core` (Tầng Lõi Kỹ Thuật / Framework Layer)
Đây là phần móng của toàn bộ hệ thống. Khối này chỉ chứa các công cụ kỹ thuật thuần túy, không chứa bất kỳ logic nghiệp vụ cụ thể nào của đề tài.

#### 1.1. `App.Web.Core.Resources` (Class Library)
* **Vai trò:** Quản lý đa ngôn ngữ (Localization/Globalization) cho toàn bộ hệ thống.
* **Cách hoạt động:** 
  * Chứa `ResourceManager` và `ResourceContext` để lấy các câu thông báo (lỗi, thành công, nhãn dữ liệu) theo ngôn ngữ người dùng yêu cầu (thông qua header `x-lang` như `vi-VN` hoặc `en-US`).
  * Chứa thư mục `Resources/` lưu trữ file `AppResource.g.cs` (file tự sinh từ Database), giúp lập trình viên gọi các câu thông báo bằng biến C# thay vì gõ chuỗi văn bản thủ công.

#### 1.2. `App.Web.Core` (Class Library)
* **Vai trò:** Hạt nhân tương tác Cơ sở dữ liệu (thông qua micro-ORM **Dapper**) và cung cấp các lớp cơ sở (Base Classes).
* **Cách hoạt động:**
  * **Thư mục `Base/`:**
    * `CoreBaseRepository.cs`: Nơi trực tiếp mở kết nối Database (`IDbConnection`) và cung cấp sẵn các hàm CRUD (`Search`, `GetBy`, `Create`, `Update`, `Delete`) cùng các hàm kiểm soát dữ liệu cấp hệ thống:
      * `CheckDataExists`: Kiểm tra trùng lặp dữ liệu (mã phòng, mã nhân viên, email...) trước khi thêm/sửa và chống SQL Injection.
      * `CheckDataIsUsed`: Quét kiểm tra ràng buộc khóa ngoại (Foreign Key) ở các bảng khác trước khi cho phép xóa dữ liệu.
      * `SaveLogHistory`: Tự động ghi nhật ký hệ thống (Audit Log) lưu lại trạng thái dữ liệu trước và sau khi thay đổi (`json_before`, `json_after`, người thực hiện, thời gian).
      * `GetParameter`: Đọc cấu hình hệ thống từ DB và tự động giải mã (Decrypt) nếu tham số được mã hóa.
    * `CoreBaseService.cs`: Lớp cơ sở cho các tầng dịch vụ kế thừa.
  * **Thư mục `Generated/`:** Chứa các file hằng số `.g.cs` tự sinh như `CoreActionCode.g.cs`, `CoreFunctionCode.g.cs`, `CoreModuleCode.g.cs`, `CoreTableName.g.cs`.

---

### KHỐI 2: `02.App.Development` (Công Cụ Hỗ Trợ Phát Triển)
Khối này chỉ chạy ở giai đoạn lập trình (Design-time) trên máy của lập trình viên, không cần chạy trên Server khi triển khai thực tế.

#### 2.1. `App.Web.Generator` (Console Application)
* **Vai trò:** Công cụ tự động sinh mã nguồn (Code Generation) để loại bỏ hoàn toàn *Magic Strings* (chuỗi gõ tay dễ sai chính tả).
* **Cách hoạt động:**
  * Khi lập trình viên thêm mới một bảng, một mã chức năng, hoặc một câu thông báo đa ngôn ngữ vào các bảng `core_*` trong Database, lập trình viên sẽ bấm chạy project này.
  * `DatabaseCodeGenerator.cs`: Đọc các bảng cấu hình hệ thống và ghi đè ra các file `.g.cs` trong `App.Web.Core/Generated/`.
  * `ResourceCodeGenerator.cs`: Đọc bảng ngôn ngữ `core_resource_controls` và ghi đè ra file `AppResource.g.cs` trong `App.Web.Core.Resources/Resources/`.

---

### KHỐI 3: `03.App.Shared` (Tầng Nghiệp Vụ & Dữ Liệu Dùng Chung)
Đây là nơi chứa toàn bộ logic nghiệp vụ đặc thù của Đồ án tốt nghiệp.

#### 3.1. `App.Web.Model` (Class Library)
* **Vai trò:** Chứa các class `Model` đại diện cho dữ liệu của bảng (ví dụ: `BookingModel.cs`, `RoomModel.cs`) và các tham số tìm kiếm chung (`Common/`).
* **Cách hoạt động:** Định nghĩa khuôn mẫu dữ liệu JSON mà Frontend (React/Mobile) gửi lên và Backend trả về. Không cần chia nhỏ thành quá nhiều DTO rườm rà; mỗi bảng chỉ cần 1 file Model gọn nhẹ. Project này hoàn toàn độc lập để mọi tầng khác tham chiếu tới mà không gây lỗi vòng lặp.

#### 3.2. `App.Business.Core` (Class Library)
* **Vai trò:** Trái tim xử lý nghiệp vụ của dự án.
* **Cách hoạt động:**
  * **Thư mục `Base/`:**
    * `BaseRepository.cs` (kế thừa từ `CoreBaseRepository`) & `BaseService.cs` (kế thừa từ `CoreBaseService`).
    * `BaseRepository.ListData.cs`: Chứa hàm `GetListData(search)` sử dụng kỹ thuật **Reflection**. Khi giao diện React hoặc Mobile cần lấy dữ liệu cho bất kỳ ô chọn (Combobox/Dropdown) nào, chỉ cần truyền tên `DataType` (ví dụ: `"RoomType"`, `"Staff"`), hệ thống sẽ tự động tìm và gọi hàm truy vấn tương ứng mà không cần viết API mới.
  * **Thư mục `Modules/`:** Chia thành các thư mục theo từng chức năng của đồ án (ví dụ: `Booking`, `Room`, `Staff`, `Warehouse`...). Mỗi thư mục chức năng chứa trọn bộ **3 file đi liền nhau**: `Repository`, `Service` và `Validation`.

---

### KHỐI 4: `04.App.Web` (Tầng Cổng Giao Tiếp & Bảo Mật)
Đây là tầng ngoài cùng tiếp xúc với Internet/Mạng nội bộ, chứa các file cấu hình `appsettings.json` (lưu chuỗi kết nối Database) và gồm 2 máy chủ Web API chạy song song trên 2 Port khác nhau để phục vụ cho cả **Web React** và **Mobile App**.

#### 4.1. `App.Identity.Server` (ASP.NET Core Web API)
* **Vai trò:** Máy chủ Xác thực tập trung (Centralized Authentication Server).
* **Cách hoạt động:**
  * Tách biệt hoàn toàn việc đăng nhập ra khỏi API nghiệp vụ.
  * Kiểm tra tài khoản/mật khẩu, xử lý Refresh Token, và phát hành thẻ định danh **JWT (JSON Web Token)** chứa thông tin người dùng và quyền hạn.

#### 4.2. `App.Web.API` (ASP.NET Core Web API)
* **Vai trò:** Cổng RESTful API cung cấp toàn bộ dữ liệu nghiệp vụ cho Web React và Mobile App.
* **Cách hoạt động:**
  * Chứa toàn bộ các **`Controllers/`** nghiệp vụ của hệ thống.
  * Kiểm tra tính hợp lệ của thẻ JWT Token và đọc header `x-lang` để thiết lập ngôn ngữ phản hồi.
  * Sử dụng cơ chế `CustomRegisterDi` trong `Program.cs` để tự động quét và đăng ký Dependency Injection cho toàn bộ Service, Validation và Repository nằm trong `App.Business.Core`.

---

## 3. Giải thích Lý do "Nối Dây" (Project References) Giữa Các Thư Mục

Trong .NET, một Project mặc định là một hộp kín. Muốn Project A gọi được các Class/Hàm viết bên trong Project B, ta bắt buộc phải **Add Project Reference ("nối dây") từ A sang B**. 

```text
[App.Identity.Server] ──┬──> [App.Business.Core] ──┬──> [App.Web.Core] ──> [App.Web.Core.Resources]
[App.Web.API]         ──┘            │             │
       │                             ▼             │
       └───────────────────> [App.Web.Model]       │
                                                   │
[App.Web.Generator] ───────────────────────────────┘
```

| Project Đi Nối (Tầng gọi) | Nối Vào Project Nào (Tầng được gọi) | Tại sao BẮT BUỘC phải nối dây như vậy? |
| :--- | :--- | :--- |
| **`App.Web.Core`** | $
ightarrow$ `App.Web.Core.Resources` | **Lý do:** Khi `CoreBaseRepository` trong `App.Web.Core` kiểm tra trùng mã (`CheckDataExists`) hoặc kiểm tra khóa ngoại (`CheckDataIsUsed`) mà phát hiện lỗi, nó cần lấy câu thông báo lỗi đa ngôn ngữ từ `App.Web.Core.Resources` để trả về cho người dùng. |
| **`App.Web.Generator`** | $
ightarrow$ `App.Web.Core`<br>$
ightarrow$ `App.Web.Core.Resources` | **Lý do:** Công cụ sinh code cần đọc cấu hình chuỗi kết nối Database từ `App.Web.Core` để truy vấn các bảng `core_*`, sau đó kết nối tới cấu trúc của `Resources` để xuất ra các file `.g.cs` đúng định dạng. |
| **`App.Business.Core`** | $
ightarrow$ `App.Web.Core`<br>$
ightarrow$ `App.Web.Core.Resources`<br>$
ightarrow$ `App.Web.Model` | **Lý do:**<br>1. Nối vào `App.Web.Core` để `BaseRepository` và `BaseService` kế thừa lại toàn bộ hàm CRUD Dapper, Audit Log, Check FK của lớp `CoreBaseRepository`.<br>2. Nối vào `Resources` để các hàm Validation/Service trả về câu thông báo lỗi đa ngôn ngữ (thông qua `AppResource.g.cs`).<br>3. Nối vào `App.Web.Model` để dùng các class `Model` làm dữ liệu đầu vào/đầu ra. |
| **`App.Identity.Server`** | $
ightarrow$ `App.Business.Core`<br>$
ightarrow$ `App.Web.Model`<br>$
ightarrow$ `App.Web.Core`<br>$
ightarrow$ `App.Web.Core.Resources` | **Lý do:** Máy chủ đăng nhập cần nhận `LoginModel` (từ `Web.Model`), gọi hàm kiểm tra tài khoản/mật khẩu trong DB (nằm ở `Business.Core` và `Web.Core`), và trả về câu báo lỗi "Sai mật khẩu" theo đúng ngôn ngữ (từ `Resources`). |
| **`App.Web.API`** | $
ightarrow$ `App.Business.Core`<br>$
ightarrow$ `App.Web.Model`<br>$
ightarrow$ `App.Web.Core`<br>$
ightarrow$ `App.Web.Core.Resources` | **Lý do:**<br>1. Nối vào `Business.Core` để tự động đăng ký Dependency Injection (`CustomRegisterDi`) và để các Controller gọi được các Service nghiệp vụ.<br>2. Nối vào `Web.Model` để Controller nhận/trả dữ liệu JSON theo đúng Model.<br>3. Nối vào `Web.Core` và `Resources` để truyền chuỗi kết nối DB từ `appsettings.json` xuống Dapper và xử lý Middleware đa ngôn ngữ (`x-lang`). |

---

## 4. Mô hình Tổ chức File cho 1 Chức năng (Controller - Service - Validation - Repository - Model)

Khi phát triển bất kỳ một chức năng mới nào (ví dụ: **Đặt phòng - `Booking`**), bạn không cần sửa cấu trúc thư mục mà chỉ cần tạo thêm các file `.cs` vào đúng 3 vị trí cố định sau:

```text
Solution 'App.Backend'
│
├── 📁 03.App.Shared (Tương ứng Ivs.Shared)
│   │
│   ├── 📗 App.Business.Core (Tương ứng Ivs.Ifms.Core)
│   │   └── 📁 Modules
│   │       └── 📁 Booking                   👈 VỊ TRÍ 1: BỘ 3 FILE NGHIỆP VỤ NẰM CHUNG Ở ĐÂY!
│   │           ├── 📄 BookingRepository.cs  (1. Chứa câu lệnh SQL Dapper truy vấn DB)
│   │           ├── 📄 BookingService.cs     (2. Điều phối quy trình: Gọi Validation -> Gọi Repo -> Ghi Log)
│   │           └── 📄 BookingValidation.cs  (3. Kiểm tra dữ liệu hợp lệ, gọi CheckDataExists / CheckDataIsUsed)
│   │
│   └── 📗 App.Web.Model (Tương ứng Ivs.Ifms.Web.Model)
│       └── 📁 Modules
│           └── 📄 BookingModel.cs           👈 VỊ TRÍ 2: 1 FILE MODEL DUY NHẤT KHAI BÁO CÁC CỘT CỦA BẢNG!
│
└── 📁 04.App.Web (Tương ứng Ivs.Web)
    └── 🌐 App.Web.API (Tương ứng Ivs.Ifms.Web.API)
        └── 📁 Controllers                   👈 VỊ TRÍ 3: CONTROLLER MỞ ĐƯỜNG DẪN API NẰM Ở ĐÂY!
            └── 📄 BookingController.cs      (Nhận HTTP Request từ React -> Gọi xuống BookingService)
```

---

## 5. LUỒNG HOẠT ĐỘNG CHI TIẾT CỦA 1 API (Từ Giao diện React xuống Database và Ngược lại)

Để hiểu rõ cách các thư mục phối hợp với nhau, dưới đây là hành trình chi tiết của một Request thực tế: **Người dùng bấm nút "Tạo Đặt Phòng Mới" (POST `/api/booking/create`) trên giao diện React**.

### Sơ đồ Tổng quan Luồng Đi (7 Bước)

```text
[ GIAO DIỆN REACT (Frontend) ]
  (1) User bấm "Lưu" -> Hook (useBookings.js) -> bookingApi.js -> axiosClient.js (Đính kèm JWT + Header 'x-lang')
          │
          ▼ (HTTP POST /api/booking/create + Dữ liệu JSON)
========================================================================================================
[ TẦNG 04: 04.App.Web / App.Web.API ]
  (2) Middleware kiểm tra thẻ JWT hợp lệ + Đọc 'x-lang' nạp vào App.Web.Core.Resources
  (3) Controllers/BookingController.cs hứng dữ liệu JSON (tự động ép kiểu vào BookingModel của App.Web.Model)
          │
          ▼ Gọi hàm _bookingService.CreateAsync(model)
========================================================================================================
[ TẦNG 03: 03.App.Shared / App.Business.Core -> Modules/Booking/ ]
  (4) BookingService.cs nhận dữ liệu -> Chuyển sang cho BookingValidation.cs kiểm tra trước
          │
          ├──> (4.1) BookingValidation.cs kiểm tra rỗng, ngày nhận/trả phòng, và gọi xuống
          │          CoreBaseRepository.CheckDataExists() (Tầng 01) xem phòng đã bị đặt trùng giờ chưa.
          │          ❌ Nếu LỖI -> Lấy câu thông báo từ AppResource.g.cs (Tầng 01) trả ngược về ngay!
          │          ✅ Nếu HỢP LỆ -> Báo lại cho BookingService.cs đi tiếp bước (5).
          │
  (5) BookingService.cs gọi sang BookingRepository.cs (nằm ngay cạnh nó trong thư mục Modules/Booking)
          │
          ▼ Gọi hàm mở kết nối Dapper kế thừa từ Tầng 01
========================================================================================================
[ TẦNG 01: 01.App.Core / App.Web.Core ]
  (6) CoreBaseRepository.cs đọc chuỗi kết nối (từ appsettings.json của App.Web.API truyền xuống)
      -> Thực thi lệnh SQL INSERT qua Dapper xuống Database thật.
      -> Tự động gọi hàm SaveLogHistory() để ghi vết lịch sử ai vừa tạo đơn đặt phòng này vào bảng Audit Log.
          │
          ▼ Trả kết quả (Số dòng thêm thành công / ID mới) ngược lên lại
========================================================================================================
[ TRẢ KẾT QUẢ VỀ GIAO DIỆN ]
  (7) CoreBaseRepository -> BookingRepository -> BookingService -> BookingController
      -> Đóng gói thành JSON chuẩn (Status 200 OK + Message từ AppResource.g.cs) trả về cho React!
```

---

### Giải thích Chi tiết Từng Bước Đi Qua Các Thư Mục

#### Bước 1: Xuất phát từ `Frontend` (React + Vite)
1. Người dùng điền thông tin đặt phòng trên màn hình `src/pages/RoomManagement/BookingManagement/CreateBooking.jsx` và bấm nút **Lưu**.
2. Giao diện gọi Custom Hook trong `src/hooks/useBookings.js` $
ightarrow$ gọi tiếp `src/api/bookingApi.js`.
3. `src/api/axiosClient.js` tự động chạy **Request Interceptor**:
   * Lấy `accessToken` trong `localStorage` gắn vào Header `Authorization: Bearer <token>`.
   * Lấy ngôn ngữ hiện tại gắn vào Header `x-lang: vi-VN`.
   * Bắn gói tin JSON sang địa chỉ `https://localhost:5002/api/booking/create` (chính là `App.Web.API`).

#### Bước 2: Đi qua Trạm Gác tại `04.App.Web` / `App.Web.API`
1. Gói tin chạm vào `Program.cs` của **`App.Web.API`**.
2. **Trạm kiểm soát 1 (Authentication Middleware):** Kiểm tra xem thẻ JWT có hợp lệ và còn hạn không. Nếu giả mạo hoặc hết hạn $
ightarrow$ chặn ngay lập tức và trả về lỗi `401 Unauthorized` (React tự đá về trang `/login`).
3. **Trạm kiểm soát 2 (Localization Middleware):** Đọc Header `x-lang: vi-VN` và báo xuống cho project **`01.App.Core / App.Web.Core.Resources`** biết rằng: *"Request này đang dùng tiếng Việt nhé!"*.

#### Bước 3: Tiếp nhận tại `Controller` (`04.App.Web` / `App.Web.API` / `Controllers`)
1. Gói tin đi vào file **`Controllers/BookingController.cs`**.
2. Tại hàm `[HttpPost("create")]`, .NET tự động lấy cục JSON của React gửi lên và đổ khớp vào khuôn **`BookingModel`** (file `BookingModel.cs` nằm ở **`03.App.Shared / App.Web.Model`**).
3. `BookingController` không tự xử lý logic mà gọi thẳng xuống tầng Shared: `_bookingService.CreateAsync(model)`.

#### Bước 4: Kiểm tra Hợp lệ tại `Service` & `Validation` (`03.App.Shared` / `App.Business.Core` / `Modules/Booking`)
1. Luồng chạy đi vào file **`Modules/Booking/BookingService.cs`**.
2. Trước khi lưu, `BookingService.cs` gọi file đứng cạnh nó là **`Modules/Booking/BookingValidation.cs`**.
3. Trong `BookingValidation.cs`:
   * Kiểm tra các quy tắc cơ bản (Khách hàng đã chọn chưa? Ngày Check-out có lớn hơn ngày Check-in không?).
   * Gọi hàm `CheckDataExists` (kế thừa từ **`01.App.Core / App.Web.Core / Base / CoreBaseRepository.cs`**) để kiểm tra trong Database xem mã đặt phòng có bị trùng hay phòng đó đã có người khác đặt trong khung giờ đó chưa.
   * **Nếu phát hiện lỗi:** Nó lấy mã lỗi từ **`01.App.Core / App.Web.Core.Resources / Resources / AppResource.g.cs`** (ví dụ: *"Phòng đã có người đặt trong thời gian này"*), đóng gói thành kết quả lỗi và **trả ngược thẳng về `BookingController` $
ightarrow$ về React** để hiện thông báo đỏ lên màn hình mà không chạy tiếp Bước 5.

#### Bước 5: Truy vấn SQL tại `Repository` (`03.App.Shared` / `App.Business.Core` / `Modules/Booking`)
1. Khi `BookingValidation.cs` báo mọi thứ đều hợp lệ, `BookingService.cs` gọi sang file thứ 3 trong cùng thư mục là **`Modules/Booking/BookingRepository.cs`**.
2. `BookingRepository.cs` chuẩn bị câu lệnh SQL `INSERT INTO bookings ...` (hoặc gọi hàm `Create` có sẵn).

#### Bước 6: Thực thi Dapper & Ghi Log tại Tầng Lõi (`01.App.Core` / `App.Web.Core` / `Base`)
1. Vì `BookingRepository` kế thừa từ `BaseRepository` $
ightarrow$ kế thừa tiếp từ **`CoreBaseRepository.cs`** (ở Tầng 1 `App.Web.Core`), câu lệnh SQL được chuyển xuống `CoreBaseRepository.cs`.
2. `CoreBaseRepository.cs` lấy chuỗi kết nối `DefaultConnection` (được đọc từ file **`appsettings.json`** của `App.Web.API`), mở kết nối **Dapper** xuống Database và thực thi lệnh `INSERT`.
3. Ngay sau khi `INSERT` thành công, hàm `SaveLogHistory` trong `CoreBaseRepository.cs` tự động chạy ngầm để ghi lại vào bảng `core_log_history`: *"User A vừa thêm mới Booking ID 105, dữ liệu JSON là {...} vào lúc 23:45"*.

#### Bước 7: Trả Kết Quả Ngược Về Cho Giao Diện React
1. Database báo lưu thành công $
ightarrow$ `CoreBaseRepository` trả kết quả lên `BookingRepository` $
ightarrow$ lên `BookingService`.
2. `BookingService` đính kèm câu thông báo thành công từ `AppResource.g.cs` (ví dụ: *"Thêm mới đặt phòng thành công"*) rồi trả lên cho **`BookingController`** (Tầng 4).
3. `BookingController` trả về HTTP Status `200 OK` kèm cục dữ liệu JSON (đã tự động format tên biến thành `camelCase`) về cho `axiosClient.js` bên React.
4. Bên React, `TanStack Query` (`useBookings.js`) nhận được tín hiệu thành công, tự động làm mới lại danh sách đặt phòng trên màn hình mà không cần tải lại trang (F5)!
