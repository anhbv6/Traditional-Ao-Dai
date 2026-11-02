# Danh sách KEY - Module Upload (Upload Module Keys)

Tài liệu tổng hợp các mã phản hồi (`message` key) của Module Upload (Tải lên hình ảnh lên Cloudinary).
*Documentation of response and error keys for Upload Module (Image upload to Cloudinary).*

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `UPLOAD_SUCCESS` | 200 | Tải lên hình ảnh thành công | Image uploaded successfully | Đã tải hình ảnh lên Cloudinary và trả về URL / Image uploaded to Cloudinary, returned URL & publicId |

---

## 2. Error Keys (Mã lỗi)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `IMAGE_FILE_REQUIRED` | 400 | Vui lòng chọn tệp hình ảnh để tải lên | Image file is required | Request không đính kèm file trong field `image` / Request missing file in 'image' form-data field |
| `IMAGE_RATIO_INVALID` | 400 | Ảnh sản phẩm phải là ảnh dọc tỉ lệ 3:4 hoặc 9:16 | Product images must be portrait 3:4 or 9:16 | Ảnh ở folder `products` sai tỉ lệ, đã bị xóa khỏi Cloudinary / Wrong ratio in `products` folder, removed from Cloudinary |
| `ONLY_IMAGE_FILES_ALLOWED` | 400 | Chỉ chấp nhận tệp định dạng hình ảnh | Only image files are allowed | Tệp tải lên không phải định dạng ảnh / Uploaded file is not an image MIME type |
