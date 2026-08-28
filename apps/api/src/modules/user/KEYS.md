# Danh sách KEY - Module User (User Module Keys)

Tài liệu tổng hợp các mã phản hồi (`message` key) của Module User (Hồ sơ người dùng, Đổi mật khẩu, Liên kết tài khoản Google, Phiên đăng nhập, Sổ địa chỉ nhận hàng).
*Documentation of response and error keys for User Module (User Profile, Password Change, Google Link/Unlink, Sessions, and Shipping Addresses).*

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `UPDATE_PROFILE_SUCCESS` | 200 | Cập nhật hồ sơ cá nhân thành công | Profile updated successfully | Đổi tên, avatar, ngày sinh, giới tính, email/sđt / Updated user profile fields |
| `CHANGE_PASSWORD_SUCCESS` | 200 | Đổi mật khẩu thành công | Password changed successfully | Người dùng đổi mật khẩu khi đang đăng nhập / Successfully changed password while logged in |
| `LINK_ACCOUNT_SUCCESS` | 200 | Liên kết tài khoản Google thành công | Google account linked successfully | Liên kết thêm tài khoản Google vào tài khoản / Linked Google account to profile |
| `UNLINK_ACCOUNT_SUCCESS` | 200 | Hủy liên kết Google thành công | Google account unlinked successfully | Hủy liên kết tài khoản Google khỏi hồ sơ / Removed Google account link |
| `GET_SESSIONS_SUCCESS` | 200 | Lấy danh sách phiên đăng nhập thành công | Sessions retrieved successfully | Lấy danh sách thiết bị/phiên đang hoạt động / Fetched active login sessions |
| `REVOKE_SESSION_SUCCESS` | 200 | Đăng xuất thiết bị thành công | Session revoked successfully | Thu hồi một phiên làm việc trên thiết bị khác / Terminated a specific device session |
| `GET_ADDRESSES_SUCCESS` | 200 | Lấy danh sách địa chỉ thành công | Addresses retrieved successfully | Lấy danh sách sổ địa chỉ nhận hàng / Fetched shipping address book |
| `CREATE_ADDRESS_SUCCESS` | 201 | Thêm địa chỉ mới thành công | Address created successfully | Tạo mới một địa chỉ nhận hàng vào sổ địa chỉ / Created new shipping address |
| `UPDATE_ADDRESS_SUCCESS` | 200 | Cập nhật địa chỉ thành công | Address updated successfully | Chỉnh sửa thông tin địa chỉ nhận hàng / Updated shipping address |
| `SET_DEFAULT_ADDRESS_SUCCESS` | 200 | Đặt làm địa chỉ mặc định thành công | Set default address successfully | Thiết lập một địa chỉ làm địa chỉ mặc định / Set address as primary default |
| `DELETE_ADDRESS_SUCCESS` | 200 | Xóa địa chỉ thành công | Address deleted successfully | Xóa một địa chỉ khỏi sổ địa chỉ / Deleted shipping address |

---

## 2. Error Keys (Mã lỗi)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `USER_NOT_FOUND` | 404 | Không tìm thấy người dùng | User not found | User ID không tồn tại trong hệ thống / User ID does not exist |
| `ACCOUNT_DEACTIVATED` | 403 | Tài khoản đã bị khóa hoặc vô hiệu hóa | Account deactivated | Tài khoản có `isActive = false` / Account has been locked or deactivated |
| `EMAIL_ALREADY_EXISTS` | 400 | Email đã thuộc về tài khoản khác | Email already in use | Cập nhật email mới trùng với tài khoản khác / Email already registered by another user |
| `PHONE_ALREADY_EXISTS` | 400 | Số điện thoại đã thuộc về tài khoản khác | Phone number already in use | Cập nhật SĐT mới trùng với tài khoản khác / Phone already registered by another user |
| `GENDER_INVALID` | 400 | Giới tính không hợp lệ | Invalid gender value | Giá trị không thuộc danh mục (0: Nam, 1: Nữ, 2: Khác) / Gender value invalid |
| `CURRENT_PASSWORD_REQUIRED` | 400 | Vui lòng nhập mật khẩu hiện tại | Current password is required | Yêu cầu mật khẩu hiện tại khi đổi mật khẩu / Current password required to set new password |
| `CURRENT_PASSWORD_INCORRECT` | 400 | Mật khẩu hiện tại không chính xác | Incorrect current password | Nhập sai mật khẩu cũ khi đổi mật khẩu / Current password does not match |
| `GOOGLE_AUTH_FAILED` | 400 | Xác thực tài khoản Google thất bại | Google authentication failed | Mã xác thực Google ID Token gửi lên không hợp lệ / Invalid Google ID token |
| `GOOGLE_TOKEN_INVALID` | 400 | Mã Google Token không hợp lệ | Google token invalid | Token Google không trích xuất được thông tin / Failed to extract Google payload |
| `GOOGLE_ALREADY_LINKED` | 400 | Tài khoản Google đã được liên kết | Google account already linked | Google ID đã gắn vào một tài khoản khác / Google account linked to another profile |
| `SOCIAL_ACCOUNT_NOT_FOUND` | 404 | Không tìm thấy liên kết mạng xã hội | Social account link not found | Yêu cầu hủy liên kết nhưng liên kết không tồn tại / Target social account link not found |
| `CANNOT_UNLINK_ONLY_SIGNIN_METHOD` | 400 | Không thể hủy phương thức đăng nhập duy nhất | Cannot unlink only sign-in method | Tài khoản chưa đặt mật khẩu và chỉ có 1 liên kết này / Cannot remove only login method |
| `SESSION_NOT_FOUND` | 404 | Không tìm thấy phiên đăng nhập | Session not found | Mã phiên làm việc cần thu hồi không tồn tại / Session ID to revoke not found |
| `MAX_ADDRESS_LIMIT_REACHED` | 400 | Đã đạt số lượng địa chỉ tối đa (Tối đa 10) | Maximum address limit reached (10) | Mỗi người dùng chỉ được lưu tối đa 10 địa chỉ / Maximum 10 shipping addresses allowed |
| `ADDRESS_NOT_FOUND` | 404 | Không tìm thấy địa chỉ | Address not found | Mã địa chỉ không tồn tại hoặc không thuộc quyền sở hữu / Address ID not found or unauthorized |
