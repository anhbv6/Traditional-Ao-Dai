# 🗄️ @repo/db - Lớp Cơ Sở Dữ Liệu (Database Layer)

Thư mục này chứa cấu hình cơ sở dữ liệu của dự án sử dụng **Prisma ORM** và **PostgreSQL**. Đây là một package dùng chung (shared package) trong PNPM Workspace, được sử dụng bởi các ứng dụng khác trong monorepo (như `@repo/api`).

---

## 📌 Nội dung tài liệu
1. [Cấu hình môi trường](#-cấu-hình-môi-trường)
2. [Cách triển khai Database (Deployment)](#-cách-triển-khai-database-deployment)
3. [Cách cập nhật Schema & Tạo Migration](#-cách-cập-nhật-schema--tạo-migration)
4. [Cách cập nhật & Khởi tạo dữ liệu (Seeding & Studio)](#-cách-cập-nhật--khởi-tạo-dữ-liệu-seeding--studio)

---

## ⚙️ Cấu hình môi trường

Tất cả các câu lệnh Prisma trong package này đều được liên kết cấu hình thông qua biến môi trường đặt tại ứng dụng API (`apps/api/.env`).

Bạn cần đảm bảo file `apps/api/.env` đã có cấu hình kết nối database chính xác:
```env
# URL kết nối cơ sở dữ liệu PostgreSQL
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database_name>?schema=public"
```

*Ví dụ:*
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
```

---

## 🚀 Cách triển khai Database (Deployment)

### 1. Triển khai ở môi trường Phát triển (Local Development)
Khi bạn clone dự án về máy lần đầu hoặc khi cấu hình lại database cục bộ, hãy chạy các lệnh sau từ **thư mục gốc** của monorepo:

*   **Cài đặt dependencies và sinh Prisma Client:**
    ```bash
    pnpm install
    pnpm db:generate
    ```
*   **Chạy Migration để đồng bộ toàn bộ bảng vào DB local:**
    ```bash
    pnpm db:migrate
    ```

*(Hoặc nếu bạn đang đứng ở thư mục `packages/db`):*
```bash
pnpm install
pnpm generate
pnpm migrate:dev
```

### 2. Triển khai ở môi trường Production (Production Deployment)
Trên server production, bạn **không** nên chạy lệnh tạo migration mới (`migrate dev`) vì nó có thể làm mất dữ liệu hiện tại nếu có xung đột. Hãy sử dụng lệnh triển khai chuyên dụng:

*   **Chạy từ thư mục gốc:**
    ```bash
    pnpm db:deploy
    ```
    *Lệnh này sẽ chỉ đọc các file SQL migration có sẵn trong thư mục `prisma/migrations` và áp dụng chúng vào database production một cách an toàn.*

---

## 📐 Cách cập nhật Schema & Tạo Migration

Khi bạn cần thêm bảng mới, sửa đổi cột, thay đổi kiểu dữ liệu hoặc thêm enum:

### Bước 1: Sửa đổi file `schema.prisma`
Mở file [`packages/db/prisma/schema.prisma`](file:///e:/draftcode/learn-ecommerce-shop/packages/db/prisma/schema.prisma) và thực hiện các chỉnh sửa thiết kế DB mong muốn.

### Bước 2: Tạo Migration để áp dụng thay đổi
Sau khi sửa đổi schema, bạn cần tạo một file migration SQL mới và cập nhật DB local bằng cách chạy lệnh sau tại thư mục gốc:

```bash
pnpm --filter @repo/db migrate:dev --name <ten_thay_doi>
```
*Ví dụ: thêm cột `discount` vào bảng `Product`:*
```bash
pnpm --filter @repo/db migrate:dev --name add_discount_to_product
```

**Hệ thống sẽ:**
1. So sánh `schema.prisma` với cơ sở dữ liệu hiện tại của bạn.
2. Tạo ra một thư mục migration chứa file `migration.sql` trong `prisma/migrations/`.
3. Chạy file SQL này để cập nhật database local của bạn.
4. Tự động chạy `prisma generate` để cập nhật TypeScript types mới nhất cho Prisma Client.

> ⚠️ **Windows:** nếu `pnpm dev` đang chạy, bước generate sẽ lỗi `EPERM` (file engine bị khóa). Dừng dev server rồi chạy `pnpm db:generate`.
>
> 🤖 **Môi trường không interactive (CI, AI agent):** `migrate dev` sẽ từ chối chạy. Sinh SQL bằng
> `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`
> vào thư mục `prisma/migrations/<timestamp>_<ten>/migration.sql`, xem lại SQL rồi áp dụng bằng `pnpm db:deploy`.

### Quy ước schema
*   `id String @id @default(uuid())`, luôn có `createdAt` / `updatedAt @updatedAt`, khóa ngoại tường minh + `@@index`.
*   **Tiền:** `Decimal @db.Decimal(12, 2)`; khi trả ra khỏi tầng dữ liệu chuyển sang số nguyên VND bằng `toVnd()` của `@repo/shared`.
*   **Nội dung đa ngôn ngữ:** cột gốc là tiếng Việt (bắt buộc), cột hậu tố `En` là tiếng Anh (nullable) — ví dụ `name` / `nameEn`, `description` / `descriptionEn`. Đọc bằng `pickLocalized(entity, 'name', locale)`.
*   **Không sửa/xóa migration đã áp dụng** — luôn tạo migration mới.
*   Quy chuẩn đầy đủ: [`docs/PROJECT_RULES.md` §9](../../docs/PROJECT_RULES.md#9-database-packagesdb).

---

## 🔄 Cách cập nhật & Khởi tạo dữ liệu (Seeding & Studio)

### 1. Khởi tạo dữ liệu mẫu (Seeding)
Dự án có sẵn một file script seeder tại [`packages/db/prisma/seed.ts`](file:///e:/draftcode/learn-ecommerce-shop/packages/db/prisma/seed.ts) giúp tạo tài khoản Admin mặc định (`admin@gmail.com` / `admin123`, có thể đổi qua `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) để đăng nhập hệ thống quản trị.

*   Để chạy seeder khởi tạo dữ liệu mẫu, dùng lệnh:
    ```bash
    pnpm --filter @repo/db seed
    ```

*   **Cách viết thêm dữ liệu mẫu:**
    Mở file [`packages/db/prisma/seed.ts`](file:///e:/draftcode/learn-ecommerce-shop/packages/db/prisma/seed.ts), thêm các dòng code khởi tạo (ví dụ tạo danh mục `Category`, sản phẩm `Product` mẫu) sử dụng cú pháp Prisma Client:
    ```typescript
    const category = await prisma.category.create({
      data: {
        name: 'Áo dài truyền thống',
        slug: 'ao-dai-truyen-thong',
      }
    });
    ```
    Sau đó chạy lại lệnh `pnpm --filter @repo/db seed`.

### 2. Quản lý và Cập nhật dữ liệu bằng giao diện trực quan (Prisma Studio)
Nếu bạn muốn thêm/sửa/xóa trực tiếp dữ liệu trong bảng một cách trực quan thông qua giao diện Web UI (không cần viết code hay dùng phần mềm quản lý như DBeaver, pgAdmin):

*   Chạy lệnh sau tại thư mục gốc:
    ```bash
    pnpm --filter @repo/db studio
    ```
*   Sau đó mở trình duyệt truy cập: [http://localhost:5555](http://localhost:5555) để bắt đầu thao tác với dữ liệu.

---

## 🛠️ Tóm tắt các lệnh quản lý nhanh (Chạy tại thư mục gốc)

| Lệnh | Chức năng |
| :--- | :--- |
| `pnpm db:generate` | Tạo lại Prisma Client TypeScript types |
| `pnpm db:migrate --name <ten>` | Tạo + áp dụng migration cho môi trường local dev |
| `pnpm db:deploy` | Áp dụng các migrations đã có (production / CI) |
| `pnpm --filter @repo/db db:push` | Đẩy nhanh schema lên DB không tạo migration (chỉ prototyping) |
| `pnpm db:seed` | Chạy seed khởi tạo tài khoản Admin và dữ liệu mặc định |
| `pnpm db:studio` | Mở giao diện Web quản trị dữ liệu trực quan |
| `pnpm --filter @repo/db typecheck` | Kiểm tra type của package |
