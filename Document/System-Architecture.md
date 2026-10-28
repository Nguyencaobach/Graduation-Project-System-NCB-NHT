# TÀI LIỆU KIẾN TRÚC HỆ THỐNG BACKEND & LUỒNG DỮ LIỆU

- **Đề tài:** Hệ thống Quản lý Dự án Tập trung tích hợp DevOps, Chat Real-time & AI Đánh giá *(Hybrid Project Management Platform)*
- **Backend:** .NET 8.0 *(Modular Clean Architecture + Hybrid ORM: EF Core & Dapper + SignalR + Đa ngôn ngữ `x-lang`)*
- **Frontend (`Website/`):** React 19 + Vite + Tailwind CSS v4 *(TanStack Query + Axios + SignalR Client)*
- **Mobile App (`Mobile-App/`):** Flutter *(Feature-First Architecture)*

Tài liệu này là quy chuẩn kỹ thuật chính thức của dự án, mô tả chi tiết:
1. Cấu trúc cây thư mục chuẩn của Solution `Project-Management-System.slnx`.
2. Chức năng của từng Project (Tầng) và từng thư mục bên trong.
3. Nguyên lý "nối dây" phụ thuộc (`ProjectReference`).
4. **Cơ chế hoạt động của Đa ngôn ngữ (`x-lang`) và các thành phần `Common` đối với Database**.
5. **Quy chuẩn các file cần tạo khi làm một chức năng mới** (`Entity`, `DTO/Model`, `Validation`, `Repository/Queries`, `Service`, `Controller`).
6. Luồng đi thực tế của API nghiệp vụ và GitHub Webhook tự động hóa.

---

## 1. Tổng quan Mô hình Kiến trúc

Hệ thống Backend được xây dựng theo mô hình **Modular Clean Architecture (Kiến trúc Sạch kết hợp Phân hệ Chức năng)** trên nền tảng **.NET 8.0**, đóng vai trò **Headless API** phục vụ đồng thời cho cả Web React, Mobile App Flutter và các Webhook bên thứ ba (GitHub/GitLab).

Toàn bộ Solution `Project-Management-System.slnx` gồm **4 Projects cốt lõi** tuân thủ nghiêm ngặt nguyên lý **Dependency Inversion (Đảo ngược phụ thuộc)**: **Các tầng bên ngoài phụ thuộc hướng vào tầng trung tâm (`App.Domain` & `App.Application`), tầng lõi tuyệt đối không phụ thuộc ngược ra Database hay thư viện bên ngoài**.

```text
📦 Project-Management-System.slnx (nằm trong Backend/Project-Management-System/)
 ┗ 📂 src
    ┣ 📗 App.Domain              (Tầng 1: Thực thể CSDL, Enums & Quy tắc cốt lõi)
    ┃  ┣ 📁 Common
    ┃  ┣ 📁 Entities
    ┃  ┃  ┣ 📁 Identity
    ┃  ┃  ┣ 📁 ProjectManagement
    ┃  ┃  ┣ 📁 HrmResource
    ┃  ┃  ┣ 📁 DevOpsIntegration
    ┃  ┃  ┣ 📁 AiEvaluation
    ┃  ┃  ┣ 📁 ChatSystem
    ┃  ┃  ┗ 📁 System            (Bảng cấu hình chung: LanguageResource, AuditLog...)
    ┃  ┗ 📁 Enums
    ┃
    ┣ 📗 App.Application         (Tầng 2: Điều phối nghiệp vụ theo 6 Phân hệ & Common)
    ┃  ┣ 📁 Common
    ┃  ┃  ┣ 📁 Interfaces
    ┃  ┃  ┣ 📁 Models
    ┃  ┃  ┣ 📁 Exceptions
    ┃  ┃  ┗ 📁 Constants         (Chứa mã thông báo đa ngôn ngữ MessageKeys, hằng số...)
    ┃  ┗ 📁 Modules
    ┃     ┣ 📁 01_Identity
    ┃     ┣ 📁 02_ProjectHybrid
    ┃     ┣ 📁 03_HrmResource
    ┃     ┣ 📁 04_DevOpsIntegration
    ┃     ┣ 📁 05_AiEvaluation
    ┃     ┗ 📁 06_ChatSystem
    ┃
    ┣ 📗 App.Infrastructure      (Tầng 3: Hạ tầng kỹ thuật EF Core, Dapper, Đa ngôn ngữ, AI, Git, JWT)
    ┃  ┣ 📁 Persistence
    ┃  ┃  ┣ 📁 Interceptors
    ┃  ┃  ┗ 📁 Configurations
    ┃  ┣ 📁 Localization         (Đọc bảng ngôn ngữ từ DB nạp vào MemoryCache)
    ┃  ┗ 📁 ExternalServices
    ┃
    ┗ 🌐 App.WebApi              (Tầng 4: Cổng giao tiếp duy nhất REST API, Webhook, SignalR Hub)
       ┣ 📁 Controllers
       ┣ 📁 Hubs
       ┗ 📁 Middlewares
```

---

## 2. Chi tiết Hoạt động của Từng Project & Thư mục

### TẦNG 1: `App.Domain` (Class Library - Tầng Lõi Thực Thể)
Đây là trái tim của hệ thống, **hoàn toàn độc lập** (không nối dây tới bất kỳ Project nào khác).

* **Vai trò:** Định nghĩa cấu trúc các bảng cơ sở dữ liệu (`Entities`), kiểu liệt kê (`Enums`) và các giao diện đánh dấu cấp độ toàn cục.
* **Chi tiết từng thư mục:**
  * **`Common/`:**
    * `BaseEntity.cs`: Chứa các cột mặc định cho mọi bảng (`Id`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsDeleted` phục vụ xóa mềm Soft-Delete).
    * `IAuditableEntity.cs`: Giao diện đánh dấu các bảng quan trọng cần hệ thống tự động chụp nhật ký lịch sử thay đổi (`json_before`, `json_after`).
  * **`Entities/` (Chia theo 6 phân hệ nghiệp vụ + 1 phân hệ hệ thống):**
    * `Identity/`: `User.cs`, `Role.cs`, `RefreshToken.cs`.
    * `ProjectManagement/`: `Project.cs`, `WaterfallPhase.cs` (Giai đoạn vĩ mô), `AgileSprint.cs` (Chu kỳ ngắn hạn), `WorkItem.cs` (Task/Bug/UserStory), `TimeLog.cs`.
    * `HrmResource/`: `EmployeeProfile.cs`, `SkillMatrix.cs`, `ProjectAllocation.cs` (Phân bổ tải công việc).
    * `DevOpsIntegration/`: `GitRepository.cs`, `GitCommitLog.cs`, `CiCdPipelineRun.cs`, `TestReport.cs` (Kết quả Automation Test & Performance Test).
    * `AiEvaluation/`: `SprintRiskPrediction.cs`, `MemberPerformanceReview.cs`.
    * `ChatSystem/`: `ChatChannel.cs`, `ChatMessage.cs`, `MessageTaskMention.cs`.
    * `System/`: `LanguageResource.cs` (Bảng từ điển đa ngôn ngữ `vi-VN`/`en-US`), `AuditLog.cs` (Bảng lưu lịch sử thao tác hệ thống), `SystemParameter.cs`.
  * **`Enums/`:** `ProjectMethodology.cs` (`Waterfall`, `Agile`, `Hybrid`), `WorkItemStatus.cs`, `PipelineStatus.cs`...

---

### TẦNG 2: `App.Application` (Class Library - Tầng Nghiệp Vụ & Modules)
Đây là nơi chứa toàn bộ logic xử lý nghiệp vụ của Đồ án. Để không bị phân mảnh file qua nhiều Project như mô hình cũ, toàn bộ các file xử lý của một tính năng được **gom chung vào một thư mục Module**.

* **Vai trò:** Kiểm tra dữ liệu đầu vào (`Validation`), điều phối quy trình nghiệp vụ (`Service`), khai báo khuôn mẫu dữ liệu API (`DTOs/Models`) và định nghĩa các cổng giao tiếp (`Interfaces`) để tầng Hạ tầng thực thi.
* **Chi tiết từng thư mục:**
  * **`Common/` (Phần khung dùng chung cho toàn bộ các phân hệ):**
    * `Interfaces/`: Chứa `IAppDbContext.cs` (cho EF Core), `IDapperConnection.cs` (cho Dapper), `ILocalizationService.cs` (đa ngôn ngữ), `ICurrentUserService.cs` (thông tin User & ngôn ngữ `x-lang` hiện tại), `IGitProviderService.cs`, `IAiEvaluationService.cs`.
    * `Models/`: Khuôn mẫu phản hồi chuẩn `ApiResult<T>.cs`, phân trang `PagedResult<T>.cs`, tham số tìm kiếm `PaginationFilter.cs`, và `DropdownItemDto.cs` (dùng chung cho mọi Combobox/Select trên giao diện).
    * `Exceptions/`: `BadRequestException.cs`, `NotFoundException.cs`, `ConflictException.cs` (kiểm tra trùng dữ liệu / ràng buộc khóa ngoại), `ForbiddenException.cs`.
    * `Constants/`: Chứa `MessageKeys.cs` (định nghĩa mã hằng số đa ngôn ngữ thay thế hoàn toàn cho cơ chế sinh file `AppResource.g.cs` thủ công cũ).
  * **`Modules/` (Tổ chức theo kiểu Feature-Sliced - 6 Phân hệ khép kín):**
    * `01_Identity/`: Đăng nhập, cấp/làm mới JWT Token, quản lý tài khoản và phân quyền Role/Permission.
    * `02_ProjectHybrid/`: Quản lý dự án lai Hybrid (Tạo Phase Waterfall → Mở Sprint Agile trong Phase → Quản lý `WorkItem` kéo thả trên Kanban Board & biểu đồ Gantt).
    * `03_HrmResource/`: Quản lý hồ sơ nhân sự, ma trận kỹ năng (`SkillMatrix`), tính toán phần trăm tải công việc (`Workload Capacity`) trong Sprint.
    * `04_DevOpsIntegration/`: Xử lý gói tin Webhook từ GitHub/GitLab, dùng Regex bóc tách mã công việc từ lịch sử Commit (VD: `PROJ-101`), lưu báo cáo CI/CD & Test, tự động cập nhật trạng thái công việc.
    * `05_AiEvaluation/`: Tổng hợp dữ liệu từ `02_ProjectHybrid` + `03_HrmResource` + `04_DevOpsIntegration` để tạo Prompt gọi AI dự báo rủi ro trễ Sprint, gợi ý giao việc thông minh và đánh giá hiệu suất thành viên.
    * `06_ChatSystem/`: Quản lý kênh chat theo dự án, nhận diện cú pháp tag công việc (`@PROJ-101`) và điều khiển System Bot tự động gửi cảnh báo khi gãy pipeline CI/CD.
  * **`DependencyInjection.cs`:** Tự động quét và đăng ký toàn bộ `Services`, `Repositories` và `FluentValidation` vào hệ thống chỉ bằng 1 dòng lệnh gọi từ `Program.cs`.

---

### TẦNG 3: `App.Infrastructure` (Class Library - Tầng Hạ Tầng Kỹ Thuật)
Tầng này chịu trách nhiệm làm việc trực tiếp với cơ sở dữ liệu (SQL Server / PostgreSQL), bộ nhớ đệm Cache và các dịch vụ bên ngoài (GitHub API, Gemini/OpenAI API, JWT).

* **Vai trò:** Thực thi (`Implement`) toàn bộ các `Interfaces` đã khai báo ở `App.Application`.
* **Chi tiết từng thư mục:**
  * **`Persistence/` (Kết hợp sức mạnh Hybrid ORM: EF Core + Dapper):**
    * `AppDbContext.cs`: Quản lý toàn bộ bảng bằng **Entity Framework Core**, tự động tạo/cập nhật cấu trúc bảng qua **Migrations** và đảm bảo toàn vẹn khóa ngoại cho các thao tác Thêm/Sửa/Xóa (`INSERT / UPDATE / DELETE`).
    * `DapperConnection.cs`: Cung cấp kết nối micro-ORM **Dapper** cho các truy vấn Đọc (`SELECT`) phức tạp cần tốc độ cực cao (Dashboard, thống kê tiến độ, biểu đồ Gantt/Burndown, gom dữ liệu cho AI).
    * `Interceptors/AuditLogInterceptor.cs`: Tự động bắt mọi sự kiện `SaveChangesAsync()` của EF Core để chụp lại `json_before`, `json_after`, người thực hiện và thời gian lưu vào bảng `AuditLogs` (thay thế tự động cho hàm `SaveLogHistory` thủ công cũ).
    * `Configurations/`: Chứa các file cấu hình Index, độ dài cột, Unique Constraint và khóa ngoại (`OnDelete Restrict`) bằng Fluent API.
  * **`Localization/`:**
    * `LocalizationService.cs`: Đọc bảng từ điển đa ngôn ngữ `LanguageResources` từ Database qua Dapper và lưu vào **`IMemoryCache` (RAM)** để tra cứu câu thông báo theo `x-lang` với tốc độ tức thì.
  * **`ExternalServices/`:**
    * `GitHubClientService.cs`: Tương tác GitHub/GitLab REST API và kiểm tra chữ ký mật mã `X-Hub-Signature-256` của Webhook.
    * `AiLLMService.cs`: Kết nối Gemini API / OpenAI API để phân tích dữ liệu dự án.
    * `JwtTokenService.cs`: Phát hành và kiểm tra AccessToken / RefreshToken.
  * **`DependencyInjection.cs`:** Đăng ký kết nối Database, Dapper, Cache, Localization, JWT và External Services vào DI Container.

---

### TẦNG 4: `App.WebApi` (ASP.NET Core Web API - Tầng Cổng Giao Tiếp Duy Nhất)
Toàn bộ hệ thống xác thực, API nghiệp vụ, Webhook và WebSocket được hợp nhất vào **1 Server duy nhất (`App.WebApi`)**, giúp cấu hình CORS, Docker hay mở tunnel nhận GitHub Webhook cực kỳ đơn giản.

* **Vai trò:** Tiếp nhận HTTP Request từ React (`Website/`) và Flutter (`Mobile-App/`), nhận Webhook từ GitHub Actions, và duy trì kênh giao tiếp thời gian thực qua SignalR.
* **Chi tiết từng thư mục:**
  * **`Controllers/`:** Mở các đường dẫn RESTful API tương ứng với các phân hệ (`AuthController`, `ProjectsController`, `WorkItemsController`, `HrmController`, `GitWebhooksController`, `AiAssistantController`, `LookupController`...).
  * **`Hubs/`:**
    * `WorkspaceHub.cs` (**SignalR**): Kênh truyền thông thời gian thực dùng chung cho cả phòng Chat dự án và đồng bộ kéo thả thẻ công việc trên Kanban Board giữa nhiều thành viên.
  * **`Middlewares/`:**
    * `LocalizationMiddleware.cs`: Đọc Header `x-lang` (`vi-VN`, `en-US`) từ Request gửi lên để thiết lập ngôn ngữ phản hồi cho phiên làm việc.
    * `GlobalExceptionHandler.cs`: Sử dụng chuẩn `IExceptionHandler` của .NET 8 để bắt mọi ngoại lệ từ tầng dưới (`ValidationException`, `BadRequestException`, `NotFoundException`, `ConflictException`), tự động dịch mã lỗi qua `ILocalizationService` và đóng gói thành JSON chuẩn (`400`, `401`, `404`, `409`, `500`) mà không cần viết `try/catch` lặp lại ở từng Controller.
  * **`Program.cs` & `appsettings.json`:** Cấu hình chuỗi kết nối Database, khóa bí mật JWT, API Key của AI/GitHub, Swagger UI và CORS.

---

## 3. Giải thích Lý do "Nối Dây" (`ProjectReference`) Giữa Các Project

Chiều mũi tên phụ thuộc luôn hướng về `App.Domain`. Tuyệt đối không nối dây ngược chiều gây lỗi vòng lặp (`Circular Dependency`).

```text
[ App.WebApi ] ─────────────┬────> [ App.Infrastructure ]
                            │                 │
                            ▼                 ▼
                   [ App.Application ] <──────┘
                            │
                            ▼
                     [ App.Domain ] (Độc lập hoàn toàn)
```

| Project Đi Nối (Tầng gọi) | Nối Vào Project Nào (Tầng được gọi) | Tại sao BẮT BUỘC phải nối dây như vậy? |
| :--- | :--- | :--- |
| **`App.Domain`** | *(Không nối vào đâu cả)* | **Lý do:** Tầng chứa thực thể cốt lõi (`Project`, `AgileSprint`, `WorkItem`, `User`, `LanguageResource`) phải sạch 100% để mọi tầng khác dùng chung mà không bị lệ thuộc vào công nghệ Database hay thư viện bên ngoài. |
| **`App.Application`** | → `App.Domain` | **Lý do:** Các `Service`, `Repository/Queries` và `DTO` trong từng phân hệ cần sử dụng các class `Entity` và `Enum` trong `App.Domain` để xử lý quy tắc nghiệp vụ. |
| **`App.Infrastructure`** | → `App.Application`<br>→ `App.Domain` | **Lý do:**<br>1. Nối vào `App.Domain` để `AppDbContext` (EF Core) ánh xạ các `Entity` thành bảng dưới Database.<br>2. Nối vào `App.Application` để thực thi các giao diện `IAppDbContext`, `IDapperConnection`, `ILocalizationService`, `IGitProviderService`, `IAiEvaluationService`. |
| **`App.WebApi`** | → `App.Application`<br>→ `App.Infrastructure` | **Lý do:**<br>1. Nối vào `App.Application` để `Controllers`, `Middlewares` và `WorkspaceHub` gọi được các `Service` nghiệp vụ, `ILocalizationService` và trả về khuôn mẫu `DTOs` / `ApiResult<T>`.<br>2. Nối vào `App.Infrastructure` để `Program.cs` truyền chuỗi kết nối từ `appsettings.json` và kích hoạt Dependency Injection lúc khởi động Server. |

---

## 4. Cách Hoạt động của Đa Ngôn Ngữ (`x-lang`) & Các Thành Phần `Common` với Database

### 4.1. Luồng hoạt động Đa ngôn ngữ (`Localization`) kết nối Database + RAM Cache
Hệ thống giữ nguyên trải nghiệm linh hoạt của việc lưu từ điển ngôn ngữ dưới Database và truyền Header `x-lang` từ Frontend, nhưng **loại bỏ hoàn toàn sự bất tiện của công cụ sinh code `Generator (.g.cs)` cũ** nhờ cơ chế **`MessageKeys` + `IMemoryCache`**:

```text
[ React / Flutter gửi Header "x-lang: vi-VN" (hoặc "en-US") ]
        │
        ▼
(1) App.WebApi / Middlewares / LocalizationMiddleware.cs
    → Đọc Header "x-lang" (mặc định "vi-VN" nếu không gửi) → Lưu vào ngữ cảnh của Request hiện tại.
        │
        ▼
(2) App.Application / Modules / ... (Validator hoặc Service)
    → Gọi _localizer.GetMessage(MessageKeys.Common.DuplicateCode) hoặc ném ConflictException(MessageKeys...)
        │
        ▼
(3) App.Infrastructure / Localization / LocalizationService.cs
    → Kiểm tra trong bộ nhớ đệm RAM (IMemoryCache):
      • Nếu CHƯA CÓ trong RAM (lần chạy đầu tiên): Dùng Dapper chạy câu lệnh
        "SELECT ResourceKey, LanguageCode, MessageValue FROM LanguageResources"
        nạp toàn bộ từ điển lên RAM trong 1 lần duy nhất.
      • Nếu ĐÃ CÓ trong RAM: Tra cứu trực tiếp trên RAM (tốc độ ~0.001ms, KHÔNG tốn query xuống DB!).
        │
        ▼
(4) Trả về câu thông báo đúng ngôn ngữ ("Mã dự án đã tồn tại!" hoặc "Project code already exists!")
```

* **Bảng Database `LanguageResources` (`App.Domain/Entities/System/LanguageResource.cs`):**
  * Gồm các cột: `Id`, `ResourceKey` (VD: `COMMON_NOT_FOUND`, `WORKITEM_TITLE_REQUIRED`), `LanguageCode` (`vi-VN`, `en-US`), `MessageValue` (Nội dung hiển thị), `Module` (`Common`, `ProjectHybrid`...).
* **File hằng số `MessageKeys.cs` (`App.Application/Common/Constants/MessageKeys.cs`):**
  * Phân nhóm rõ ràng (`MessageKeys.Common.*`, `MessageKeys.Auth.*`, `MessageKeys.Project.*`) để lập trình viên gõ gợi ý code (`IntelliSense`) tránh sai chính tả mà không cần chạy tool sinh file `.g.cs`.
* **Làm mới ngôn ngữ nóng (Hot Reload Dictionary):** Khi thêm hoặc sửa câu chữ trong bảng `LanguageResources` trên giao diện Quản trị, hệ thống chỉ cần gọi `_localizer.RefreshCacheAsync()` để xóa Cache cũ và nạp lại từ DB ngay lập tức mà không cần khởi động lại Server.

### 4.2. Các cơ chế `Common` làm việc với Database (Nâng cấp từ hệ thống cũ)

| Nhu cầu Hệ thống (`Common`) | Cách làm Cũ (`CoreBaseRepository`) | Cách làm Mới trong Kiến trúc Clean Architecture |
| :--- | :--- | :--- |
| **1. Kiểm tra trùng mã / trùng dữ liệu** | Gọi hàm nối chuỗi SQL `CheckDataExists` | Kiểm tra an toàn kiểu dữ liệu ngay trong `Validator` hoặc `Service` bằng `await _dbContext.Projects.AnyAsync(x => x.Code == dto.Code)` → Nếu trùng, ném `ConflictException(MessageKeys.Common.DuplicateCode)` để trả mã lỗi đa ngôn ngữ chuẩn HTTP `409`. |
| **2. Kiểm tra dữ liệu đang dùng (Khóa ngoại) trước khi xóa** | Quét thủ công bằng `CheckDataIsUsed` | Kết hợp cấu hình khóa ngoại `OnDelete(DeleteBehavior.Restrict)` trong `Persistence/Configurations/` và kiểm tra điều kiện nghiệp vụ rõ ràng trước khi xóa mềm (`IsDeleted = true`). |
| **3. Tự động ghi lịch sử thay đổi (`Audit Log`)** | Gọi hàm `SaveLogHistory` ở từng lệnh | **Tự động 100%** nhờ `AuditLogInterceptor.cs` (`App.Infrastructure/Persistence/Interceptors/`). Mọi bảng kế thừa `IAuditableEntity` khi gọi `SaveChangesAsync()` đều tự động được chụp `json_before`, `json_after`, `UserId` và `Timestamp` lưu vào bảng `AuditLogs`. |
| **4. API lấy dữ liệu Combobox / Dropdown chung** | Dùng Reflection `GetListData` | Dùng DTO chuẩn hóa `DropdownItemDto` (`Value`, `Label`, `ExtraCode`) trong `Common/Models/` kết hợp truy vấn Dapper siêu nhẹ cho các danh mục chọn nhanh. |
| **5. Chuẩn hóa khuôn mẫu JSON trả về** | Tự đóng gói ở từng nơi | Mọi API thống nhất trả về `ApiResult<T>` (`Success`, `Message` đã dịch theo `x-lang`, `Data`, `Errors`) và danh sách phân trang dùng `PagedResult<T>`. |

---

## 5. Quy chuẩn Tổ chức File khi Làm 1 Chức Năng Mới

> **Câu hỏi thường gặp:** *"Khi làm một chức năng mới thì cần tạo file ở những đâu? Vẫn có đầy đủ Model (DTO), Validation, Repository, Service, Controller chứ?"*
>
> **Trả lời:** **CÓ ĐẦY ĐỦ!** Điểm khác biệt lớn nhất giúp làm việc nhóm cực nhanh là thay vì phải rải file qua 4–5 Project khác nhau, toàn bộ bộ tứ **`Dtos` (Model) + `Validator` + `Repository` + `Service`** của chức năng đó được **đặt chung trong cùng 1 thư mục Module** tại `App.Application/Modules/`.

Ví dụ thực tế khi phát triển chức năng **Quản lý Công việc (`WorkItem`)** thuộc phân hệ `02_ProjectHybrid`, bạn chỉ thao tác tại **3 vị trí cố định** sau:

```text
📦 Project-Management-System.slnx
│
├── 📗 1. App.Domain
│   └── 📁 Entities/ProjectManagement
│       └── 📄 WorkItem.cs                   👈 VỊ TRÍ 1 (ENTITY): Khai báo các cột của bảng dưới CSDL
│                                               (Và cấu hình khóa ngoại/Index ở App.Infrastructure/Persistence/Configurations/WorkItemConfiguration.cs nếu cần)
│
├── 📗 2. App.Application
│   └── 📁 Modules
│       └── 📁 02_ProjectHybrid              👈 VỊ TRÍ 2 (TRỌN BỘ NGHIỆP VỤ NẰM CHUNG 1 CHỖ!):
│           ├── 📄 WorkItemDtos.cs           (1. MODEL / DTO: Khuôn JSON gửi lên & trả về cho React/Flutter)
│           ├── 📄 WorkItemValidator.cs      (2. VALIDATION: Kiểm tra rỗng, logic nghiệp vụ & trả mã lỗi đa ngôn ngữ)
│           ├── 📄 WorkItemRepository.cs     (3. REPOSITORY: Chứa câu lệnh SQL Dapper đọc danh sách, lọc phân trang, thống kê nhanh)
│           └── 📄 WorkItemService.cs        (4. SERVICE: Điều phối chung — Ghi/Sửa/Xóa qua EF Core IAppDbContext, Đọc nhanh qua WorkItemRepository)
│
└── 🌐 3. App.WebApi
    └── 📁 Controllers
        └── 📄 WorkItemsController.cs        👈 VỊ TRÍ 3 (CONTROLLER): Mở đường dẫn REST API (/api/work-items)
                                                Nhận Request -> Gọi WorkItemService -> Bắn SignalR (nếu cần) -> Trả ApiResult
```

### Quy tắc phân vai cực rõ giữa `EF Core` và `Repository (Dapper)` trong 1 Module:
1. **Khi Thêm mới / Cập nhật / Xóa mềm (`Create / Update / Delete`):**
   * Trong `WorkItemService.cs`, ưu tiên dùng **`IAppDbContext` (EF Core)** (`_dbContext.WorkItems.Add(...)`, `await _dbContext.SaveChangesAsync()`).
   * **Lợi ích:** Không phải gõ tay câu SQL `INSERT/UPDATE` dài dòng dễ nhầm tên cột, đảm bảo khóa ngoại an toàn và **tự động kích hoạt `AuditLogInterceptor`** ghi lịch sử `json_before` / `json_after`.
2. **Khi Tìm kiếm phân trang, Vẽ bảng Kanban, Biểu đồ Gantt, Thống kê (`Search / GetDetail / Dashboard`):**
   * Viết câu lệnh SQL tối ưu dùng **`IDapperConnection` (Dapper)** bên trong **`WorkItemRepository.cs`**, sau đó `WorkItemService.cs` gọi sang.
   * *(Mẹo gọn nhẹ: Với các bảng danh mục rất nhỏ chỉ có vài dòng CRUD đơn giản không có SQL phức tạp, bạn có thể truy vấn luôn bằng EF Core `AsNoTracking()` ngay trong `Service` mà không bắt buộc phải tạo file `Repository` riêng).*

---

## 6. Luồng Hoạt Động Chi Tiết của Hệ Thống (2 Kịch Bản Thực Tế)

### KỊCH BẢN A: Luồng API Nghiệp vụ chuẩn (PM tạo Công việc mới trên bảng Kanban)
**Hành động:** Project Manager bấm nút **"Tạo Công Việc (`POST /api/work-items`)"** trên giao diện React (`Website/`).

```text
[ GIAO DIỆN REACT (Website/) HOẶC FLUTTER (Mobile-App/) ]
  (1) User bấm "Lưu" -> Hook (useWorkItems) -> axiosClient (Đính kèm Bearer JWT + Header "x-lang: vi-VN")
          │
          ▼ (HTTP POST /api/work-items + JSON Payload)
========================================================================================================
[ TẦNG 04: App.WebApi ]
  (2) Middlewares:
      • Authentication Middleware xác thực JWT -> Nạp UserId vào CurrentUserService.
      • LocalizationMiddleware đọc Header "x-lang: vi-VN" -> Thiết lập ngôn ngữ hiện tại.
  (3) Controllers/WorkItemsController.cs hứng CreateWorkItemDto -> Gọi _workItemService.CreateAsync(dto).
          │
          ▼
========================================================================================================
[ TẦNG 02: App.Application -> Modules/02_ProjectHybrid/ ]
  (4) WorkItemValidator.cs (FluentValidation) chạy kiểm tra:
      • Tiêu đề không rỗng, StoryPoint hợp lệ, SprintId có thuộc Phase hiện tại không.
      • ❌ Nếu LỖI -> Kèm mã lỗi từ MessageKeys -> GlobalExceptionHandler (Tầng 04) dịch qua
        LocalizationService (RAM Cache từ bảng LanguageResources) và trả ngay HTTP 400 tiếng Việt!
      • ✅ Nếu HỢP LỆ -> Đi tiếp vào WorkItemService.cs.
  (5) WorkItemService.cs khởi tạo thực thể WorkItem (App.Domain), tự sinh mã công việc (VD: "PROJ-105")
      và gọi _dbContext.WorkItems.Add(entity) -> await _dbContext.SaveChangesAsync().
          │
          ▼
========================================================================================================
[ TẦNG 03: App.Infrastructure -> Persistence/ ]
  (6) AuditLogInterceptor.cs tự động kích hoạt trước khi lưu:
      • Chụp dữ liệu mới thành JSON (json_after), gắn UserId và lưu vào bảng AuditLogs.
  (7) AppDbContext (EF Core) thực thi lệnh INSERT an toàn xuống Database.
          │
          ▼
========================================================================================================
[ PHẢN HỒI ĐA NGÔN NGỮ & ĐỒNG BỘ REAL-TIME ]
  (8) WorkItemsController nhận kết quả -> Bắn tín hiệu qua WorkspaceHub (SignalR) để màn hình Kanban
      của các thành viên khác tự hiện thẻ "PROJ-105" ngay lập tức!
  (9) Đóng gói ApiResult<WorkItemDto> kèm câu thông báo thành công theo "x-lang" -> Trả HTTP 200 OK!
```

---

### KỊCH BẢN B: Luồng Tích hợp Tự động hóa (Git Commit → CI/CD Test → Cập nhật Task → Chat Bot cảnh báo)
Đây là luồng thể hiện tính **Quản lý tập trung** đặc trưng của đề tài:

1. **Dev đẩy code lên GitHub:** Lập trình viên commit code với cú pháp chuẩn: `git commit -m "PROJ-105 Hoàn thành API đăng nhập"` và đẩy lên GitHub.
2. **GitHub Actions chạy CI/CD & Test:** Pipeline trên GitHub tự động chạy Build, Unit Test, Automation Test và Performance Test. Khi hoàn tất, GitHub bắn gói tin **Webhook** về `POST /api/webhooks/github` của **`App.WebApi`**.
3. **Xác thực bảo mật tại `GitWebhooksController.cs` (`App.WebApi`):**
   * Gọi `GitHubClientService` (`App.Infrastructure/ExternalServices/`) đối chiếu chữ ký mật mã `X-Hub-Signature-256` để xác minh gói tin thật sự từ GitHub gửi sang.
   * Chuyển dữ liệu xuống `DevOpsWebhookService.cs` (`App.Application/Modules/04_DevOpsIntegration/`).
4. **Bóc tách & Cập nhật tự động tại `DevOpsWebhookService.cs` (`App.Application`):**
   * Dùng biểu thức chính quy (`Regex`) quét lịch sử commit, nhận diện mã công việc **`PROJ-105`**.
   * Lưu thông tin Commit và điểm báo cáo Test vào bảng `GitCommitLogs` và `TestReports`.
   * Kiểm tra: Nếu Pipeline **PASS**, tự động chuyển trạng thái của công việc `PROJ-105` từ `In Progress` sang **`Ready for QA`** (lúc lưu DB, `AuditLogInterceptor` tự động ghi vết lịch sử thay đổi trạng thái này).
5. **Tự động thông báo vào Phòng Chat nội bộ (`06_ChatSystem` + `WorkspaceHub`):**
   * Hệ thống gọi sang `ChatBotService` tạo tin nhắn tự động từ **System Bot** vào kênh chat của dự án:
     > *"🤖 **CI/CD Bot:** Commit mới cho công việc **@PROJ-105** đã vượt qua bài kiểm tra tự động. Trạng thái công việc đã tự động chuyển sang **Ready for QA**."*
   * **`WorkspaceHub` (SignalR)** đẩy đồng thời tin nhắn Chat mới và trạng thái cột mới trên Kanban Board xuống màn hình Web & Mobile của cả nhóm theo thời gian thực!
