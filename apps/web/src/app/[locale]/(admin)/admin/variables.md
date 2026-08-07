# Monochromatic Minimalist Admin Variables (High-Fashion)

Tài liệu quy chuẩn màu sắc, font chữ và các biến thiết kế sử dụng riêng cho phân hệ Admin (khác biệt với Client/Store).

---

## 1. Bảng Màu Tối Giản (Color System)

| Biến / Vị trí | Màu sắc | Mã Hex | Chi tiết sử dụng |
| :--- | :--- | :--- | :--- |
| **Màu nền chính (Background)** | Trắng xám tối giản | `#FAFAFA` | Nền chung toàn trang của Admin (`bg-[#FAFAFA]`) |
| **Nền Card / Bảng** | Trắng tinh | `#FFFFFF` | Nền cho các box, bảng dữ liệu, drawer (`bg-white`) |
| **Nền Header & Sidebar** | Đen tuyền / Trắng viền mỏng | `#FFFFFF` / `#09090B` | Hiện tại Header sử dụng màu trắng với đường viền mỏng |
| **Thao tác chính (Primary Action)**| Đen chì | `#18181B` | Nền các nút bấm chính, filter active (`bg-[#18181B]`), hover sẽ chuyển sang đen tuyền (`#09090B`) |
| **Màu chữ chính (Text Main)** | Đen | `#09090B` | Toàn bộ text nội dung chính (`text-[#09090B]`) |
| **Màu nhãn phụ (Muted Text)** | Xám | `#71717A` | Ngày tháng, mã đơn, mô tả phụ, text label (`text-[#71717A]`) |
| **Màu viền (Border)** | Xám nhạt | `#E4E4E7` | Toàn bộ các đường viền phân tách khối, bảng (`border-[#E4E4E7]`) |

---

## 2. Quy Chuẩn Typography (Geist Sans)

Toàn bộ hệ thống quản trị Admin sử dụng font chữ **Geist Sans** kế thừa từ CSS variable `--font-geist-sans`.

- **Tiêu đề trang (Dashboard Header)**:
  - Font Size: `24px` (sử dụng Tailwind class `text-2xl`)
  - Font Weight: `600` (Semi-bold, class `font-semibold`)
  - Màu: `#09090B` (`text-[#09090B]`)
- **Số liệu quan trọng (KPI/Doanh thu)**:
  - Font Size: `28px - 32px` (sử dụng Tailwind class `text-3xl`)
  - Font Weight: `700` (Bold, class `font-bold`)
  - Font Family: `Monospace` (`font-mono`) chuyên dùng hiển thị con số chính xác và thẩm mỹ high-fashion.
- **Tiêu đề bảng / Card Header**:
  - Font Size: `14px` (sử dụng Tailwind class `text-sm`)
  - Font Weight: `600` (Semi-bold, class `font-semibold`)
  - Text viết hoa toàn bộ (`text-transform: uppercase` / `uppercase`)
  - Letter spacing: `0.5px` (sử dụng Tailwind class `tracking-[0.5px]`)
- **Dữ liệu trong Bảng (Table Content)**:
  - Font Size: `13px - 14px` (sử dụng Tailwind class `text-sm`)
  - Font Weight: `400` (Regular, class `font-normal`)
  - Màu: `#09090B` (`text-[#09090B]`)
- **Nhãn phụ / Muted text**:
  - Font Size: `12px` (sử dụng Tailwind class `text-xs`)
  - Font Weight: `400` (Regular, class `font-normal`)
  - Màu: `#71717A` (`text-[#71717A]`)

---

## 3. Quy Tắc Áp Dụng (Implementation Rules)

1. **Isolation**: Không sử dụng màu sắc đỏ Burgundy thương hiệu của khách hàng bên trang client (`#800020`) ở bên trong màn hình Admin này. Thay thế toàn bộ bằng sắc độ Monochrome (`#09090B`, `#18181B`, `#71717A`).
2. **Typography Hierarchy**: Tuân thủ nghiêm ngặt cấp bậc Font Weight và Size để đảm bảo thiết kế luôn thoáng đạt, sạch sẽ chuẩn phong cách tạp chí thời trang.
3. **Contrast**: Sử dụng viền `#E4E4E7` mỏng để phân tách card, thay vì dùng bóng đổ lớn hay viền màu đậm.
