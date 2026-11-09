# Danh sách KEY - Module Materials

Thư mục vải công khai của storefront (chất liệu đang dùng). Mã dùng lại: `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`.

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `MATERIALS_FOUND` | 200 | Đã tải thư mục vải | Fabric library loaded | GET /materials |

---

## 2. Ghi chú
- Không trả số mét tồn kho: chỉ `availability` (AVAILABLE / LIMITED / ON_REQUEST, tính theo `resolveMaterialAvailability` ở `@repo/shared/materials`) và danh sách màu cây vải đang có.
- Endpoint chỉ đọc, rate-limit 120 lần/phút/IP (trang SEO gọi từ server Next.js qua `API_INTERNAL_URL`).
