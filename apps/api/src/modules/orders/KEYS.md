# Danh sách KEY - Module Orders

Mã phản hồi của module đơn hàng (đặt hàng, tra cứu bằng mã đơn, magic link, sửa đơn qua OTP, đơn của tôi).
Mã dùng lại từ nơi khác: `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`, `AUTHENTICATION_REQUIRED`, `INVALID_PHONE_NUMBER`,
`MEASUREMENT_REQUIRED`, `MEASUREMENT_OUT_OF_RANGE`, `*_NAME_REQUIRED`, `ADDRESS_LINE_REQUIRED`, mã OTP (`OTP_*`).

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `ORDER_PLACED` | 201 | Đặt hàng thành công | Order placed | POST /orders |
| `ORDER_FOUND` | 200 | Đã tìm thấy đơn | Order found | Tra cứu / timeline |
| `OTP_SENT_SUCCESS` | 200 | Đã gửi mã xác minh | Verification code sent | POST /orders/track/otp (dùng chung mã của module OTP) |
| `ORDER_EDIT_VERIFIED` | 200 | Đã xác minh, bạn có thể chỉnh sửa trong 15 phút | Verified — you can edit for 15 minutes | POST /orders/track/verify |
| `ORDER_ADDRESS_UPDATED` | 200 | Đã cập nhật địa chỉ giao hàng | Shipping address updated | PATCH /orders/track/address |
| `ORDER_MEASUREMENTS_UPDATED` | 200 | Đã cập nhật số đo | Measurements updated | PATCH /orders/track/measurements |

---

## 2. Error Keys (Mã lỗi)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `ORDER_CODE_INVALID` | 400 | Mã đơn không đúng định dạng (TC-YYMM-XXXX). | Order code format is invalid (TC-YYMM-XXXX). | Mã đơn gửi lên không khớp định dạng |
| `ORDER_CONTACT_REQUIRED` | 400 | Vui lòng nhập số điện thoại hoặc email đã dùng khi đặt. | Please enter the phone number or email used on the order. | Tra cứu thiếu liên hệ |
| `ORDER_LOOKUP_FAILED` | 404 | Không tìm thấy đơn khớp với mã đơn và thông tin liên hệ này. | No order matches this order code and contact. | Sai mã HOẶC sai liên hệ — cùng một lỗi để chống dò đơn |
| `ORDER_LINK_INVALID` | 404 | Link theo dõi đơn không hợp lệ hoặc đã hết hạn. | This order link is invalid or has expired. | Token magic link sai / hết hạn / bị thu hồi |
| `ORDER_EMPTY` | 400 | Đơn hàng chưa có sản phẩm. | The order has no items. | items rỗng |
| `ORDER_TOO_MANY_ITEMS` | 400 | Đơn hàng có quá nhiều dòng sản phẩm. | The order has too many lines. | Quá 20 dòng |
| `ORDER_QUANTITY_INVALID` | 400 | Số lượng mỗi sản phẩm từ 1 đến 10. | Quantity per item must be between 1 and 10. | Số lượng ngoài 1–10 |
| `ORDER_PAYMENT_METHOD_INVALID` | 400 | Phương thức thanh toán không hợp lệ cho đơn này. | This payment method is not valid for the order. | Sai giá trị / cọc cho đơn không may đo |
| `ORDER_DEPOSIT_PERCENT_INVALID` | 400 | Tiền cọc phải từ 30% đến 50% giá trị đơn. | The deposit must be 30–50% of the order total. | depositPercent ngoài 30–50 |
| `ORDER_ITEM_UNAVAILABLE` | 400 | Có sản phẩm trong giỏ hiện chưa thể đặt online. Vui lòng xóa khỏi giỏ hoặc liên hệ tiệm. | Some items in your bag cannot be ordered online yet. Please remove them or contact the atelier. | Sản phẩm không có trong DB (dữ liệu mock) / ngừng bán / sai biến thể |
| `ORDER_ITEM_NOT_CUSTOMIZABLE` | 400 | Sản phẩm này không nhận may theo số đo. | This item cannot be made to measure. | Gửi số đo cho sản phẩm không may đo |
| `ORDER_ITEM_OUT_OF_STOCK` | 409 | Có sản phẩm vừa hết hàng. Vui lòng kiểm tra lại giỏ. | An item just sold out. Please review your bag. | Tồn kho không đủ khi trừ kho |
| `ORDER_TAILORED_REQUIRES_DEPOSIT` | 400 | Đơn may đo cần đặt cọc 30–50% hoặc chuyển khoản toàn bộ — không nhận COD 100%. | Tailored orders need a 30–50% deposit or full bank transfer — 100% cash on delivery is not available. | Đơn có món may đo chọn COD |
| `ORDER_CREATE_FAILED` | 500 | Chưa tạo được đơn, vui lòng thử lại. | Could not create the order, please try again. | Sinh mã đơn trùng liên tiếp |
| `ORDER_ALREADY_LINKED` | 409 | Đơn này đã thuộc một tài khoản. | This order already belongs to an account. | Tạo tài khoản từ đơn đã gắn tài khoản |
| `ORDER_EDIT_SESSION_EXPIRED` | 401 | Phiên chỉnh sửa đã hết hạn, vui lòng xác minh lại mã OTP. | Your editing session has expired. Please verify the code again. | editToken sai / hết 15 phút |
| `ORDER_ADDRESS_LOCKED` | 409 | Đơn đã giao cho đơn vị vận chuyển, không đổi được địa chỉ. | The order has been handed to the carrier; the address can no longer change. | Sửa địa chỉ khi đơn đã giao / hủy |
| `ORDER_MEASUREMENTS_LOCKED` | 409 | Xưởng đã bắt đầu cắt vải, không sửa được số đo. Vui lòng liên hệ tiệm. | The workshop has started cutting; measurements can no longer change. Please contact the atelier. | Sửa số đo khi đã cắt vải |
| `ORDER_ITEM_NOT_FOUND` | 404 | Không tìm thấy món may đo trong đơn. | Tailored item not found on this order. | itemId không thuộc đơn / không phải món may đo |
| `ORDER_NOT_FOUND` | 404 | Không tìm thấy đơn hàng. | Order not found. | Đơn không tồn tại hoặc không thuộc tài khoản |

---

## 3. Ghi chú bảo mật
- Tra cứu (cơ chế A) trả `ORDER_LOOKUP_FAILED` cho cả sai mã lẫn sai liên hệ; rate-limit 10/15 phút/IP + 5/15 phút/mã đơn.
- Token magic link chỉ READ, DB lưu SHA-256; sửa đơn cần OTP SĐT của đơn → `editToken` 15 phút (Redis lưu hash).
- Tạo tài khoản từ đơn: xem `modules/auth/KEYS.md` (`REGISTER_FROM_ORDER_SUCCESS`, `ORDER_ACCOUNT_EXISTS`).
