import { Router } from 'express'
import * as userController from './user.controller'
import { AuthenticatedRequest, requireAuth } from '../../shared/middlewares/authGuard'
import { rateLimit } from '../../shared/utils/rateLimit'
import { validate } from '../../shared/middlewares/validate'
import {
  updateProfileSchema,
  changePasswordSchema,
  linkGoogleSchema,
  unlinkGoogleSchema,
  deleteSessionSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
  requestEmailVerificationSchema,
  confirmEmailVerificationSchema,
  requestPhoneVerificationSchema,
  confirmPhoneVerificationSchema,
} from './user.schema'

const router = Router()

// All user routes require authentication
router.use(requireAuth)

// Giới hạn tần suất theo từng tài khoản cho các thao tác gửi / xác nhận mã
const byUser = (req: Express.Request) => (req as AuthenticatedRequest).user?.userId
const sendCodeLimit = rateLimit({ name: 'contact-send-user', max: 5, windowSec: 60 * 60, key: byUser })
const confirmCodeLimit = rateLimit({ name: 'contact-confirm-user', max: 20, windowSec: 15 * 60, key: byUser })

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     summary: Update User Profile
 *     description: Update the authenticated customer's profile details.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bui viet"
 *               phone:
 *                 type: string
 *                 example: "0379603855"
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-12-31"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: OTHER
 *     responses:
 *       200:
 *         description: UPDATE_PROFILE_SUCCESS
 *       400:
 *         description: VALIDATION_ERROR, GENDER_INVALID, EMAIL_CHANGE_REQUIRES_VERIFICATION, PHONE_CHANGE_REQUIRES_VERIFICATION (đổi email/SĐT phải qua /user/email|phone/verification), CANNOT_REMOVE_LAST_IDENTIFIER
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile)

/**
 * @openapi
 * /api/user/change-password:
 *   post:
 *     summary: Change User Password
 *     description: Change the authenticated customer's login password. Mọi phiên đăng nhập khác (trừ phiên hiện tại) sẽ bị đăng xuất.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: CHANGE_PASSWORD_SUCCESS
 *       400:
 *         description: VALIDATION_ERROR, CURRENT_PASSWORD_REQUIRED, or CURRENT_PASSWORD_INCORRECT
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', validate(changePasswordSchema), userController.changePassword)

/**
 * @openapi
 * /api/user/link:
 *   post:
 *     summary: Link Account with Google
 *     description: Link the authenticated customer's account with a Google account using an ID Token.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google OAuth ID Token
 *                 example: "eyJhbGciOiJSUzI1NiIs..."
 *     responses:
 *       200:
 *         description: LINK_ACCOUNT_SUCCESS
 *       400:
 *         description: VALIDATION_ERROR, GOOGLE_AUTH_FAILED, GOOGLE_TOKEN_INVALID, or GOOGLE_ALREADY_LINKED
 *       401:
 *         description: Unauthorized
 */
router.post('/link', validate(linkGoogleSchema), userController.linkAccount)

/**
 * @openapi
 * /api/user/unlink/{providerId}:
 *   delete:
 *     summary: Unlink Google Account
 *     description: Remove a linked Google social account from the user's profile.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google providerId (Google account subject sub ID)
 *     responses:
 *       200:
 *         description: UNLINK_ACCOUNT_SUCCESS
 *       400:
 *         description: CANNOT_UNLINK_ONLY_SIGNIN_METHOD
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SOCIAL_ACCOUNT_NOT_FOUND
 */
router.delete('/unlink/:providerId', validate(unlinkGoogleSchema), userController.unlinkAccount)

/**
 * @openapi
 * /api/user/sessions:
 *   get:
 *     summary: Get Logged-in Sessions
 *     description: Get a list of all active login sessions/devices for the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GET_SESSIONS_SUCCESS
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions', userController.getSessions)

/**
 * @openapi
 * /api/user/session/{sessionId}:
 *   delete:
 *     summary: Revoke Session (Logout Device)
 *     description: Revoke/Logout a specific login session for the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: REVOKE_SESSION_SUCCESS
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SESSION_NOT_FOUND
 */
router.delete('/session/:sessionId', validate(deleteSessionSchema), userController.revokeSession)

// ─── Contact Verification Routes (/api/user/email|phone/verification) ─────────

/**
 * @openapi
 * /api/user/email/verification:
 *   post:
 *     summary: Send Email Verification Code
 *     description: Gửi mã 6 số (hiệu lực 10 phút) tới email cần xác minh — email mới muốn đổi sang, hoặc email hiện tại chưa xác minh. Cooldown 60 giây, tối đa 5 lần/giờ/tài khoản.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "new.email@gmail.com"
 *     responses:
 *       200:
 *         description: VERIFICATION_CODE_SENT
 *       400:
 *         description: VALIDATION_ERROR, EMAIL_ALREADY_EXISTS, EMAIL_ALREADY_VERIFIED
 *       429:
 *         description: COOLDOWN_ACTIVE, EMAIL_DAILY_LIMIT_REACHED, TOO_MANY_REQUESTS
 */
router.post('/email/verification', validate(requestEmailVerificationSchema), sendCodeLimit, userController.requestEmailVerification)

/**
 * @openapi
 * /api/user/email/verification/confirm:
 *   post:
 *     summary: Confirm Email Verification Code
 *     description: Xác nhận mã email. Thành công thì email của tài khoản được cập nhật và đánh dấu đã xác minh. Nhập sai 5 lần mã bị hủy.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: EMAIL_VERIFIED_SUCCESS (data là thông tin người dùng đã cập nhật)
 *       400:
 *         description: VERIFICATION_CODE_EXPIRED_OR_INVALID, INCORRECT_VERIFICATION_CODE, EMAIL_ALREADY_EXISTS
 *       429:
 *         description: VERIFICATION_TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS
 */
router.post('/email/verification/confirm', validate(confirmEmailVerificationSchema), confirmCodeLimit, userController.confirmEmailVerification)

/**
 * @openapi
 * /api/user/phone/verification:
 *   post:
 *     summary: Send Phone Verification OTP
 *     description: Gửi OTP tới SĐT cần xác minh — SĐT mới muốn đổi sang, hoặc SĐT hiện tại chưa xác minh. Cooldown 60 giây, tối đa 10 SMS/SĐT/ngày.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *     responses:
 *       200:
 *         description: OTP_SENT_SUCCESS
 *       400:
 *         description: INVALID_PHONE_NUMBER, PHONE_ALREADY_EXISTS, PHONE_ALREADY_VERIFIED
 *       429:
 *         description: OTP_COOLDOWN_ACTIVE, OTP_DAILY_LIMIT_REACHED, TOO_MANY_REQUESTS
 */
router.post('/phone/verification', validate(requestPhoneVerificationSchema), sendCodeLimit, userController.requestPhoneVerification)

/**
 * @openapi
 * /api/user/phone/verification/confirm:
 *   post:
 *     summary: Confirm Phone Verification OTP
 *     description: Xác nhận OTP. Thành công thì SĐT được cập nhật và đánh dấu đã xác minh; nếu tài khoản khác đang giữ SĐT này ở trạng thái chưa xác minh, SĐT được chuyển sang tài khoản hiện tại.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: PHONE_VERIFIED_SUCCESS (data là thông tin người dùng đã cập nhật)
 *       400:
 *         description: OTP_EXPIRED_OR_NOT_FOUND, OTP_INCORRECT, PHONE_ALREADY_EXISTS
 *       429:
 *         description: OTP_TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS
 */
router.post('/phone/verification/confirm', validate(confirmPhoneVerificationSchema), confirmCodeLimit, userController.confirmPhoneVerification)

// ─── Address Routes (/api/user/addresses) ───────────────────────────────────────

/**
 * @openapi
 * /api/user/addresses:
 *   get:
 *     summary: Get User Addresses
 *     description: Get all addresses of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GET_ADDRESSES_SUCCESS
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: GET_ADDRESSES_SUCCESS
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserAddress'
 *       401:
 *         description: Unauthorized
 */
router.get('/addresses', userController.getAddresses)

/**
 * @openapi
 * /api/user/addresses:
 *   post:
 *     summary: Create Address
 *     description: Create a new address for the authenticated user (limit 10).
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserAddressRequest'
 *     responses:
 *       201:
 *         description: CREATE_ADDRESS_SUCCESS
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: CREATE_ADDRESS_SUCCESS
 *                     data:
 *                       $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: VALIDATION_ERROR or MAX_ADDRESS_LIMIT_REACHED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 */
router.post('/addresses', validate(createAddressSchema), userController.createAddress)

/**
 * @openapi
 * /api/user/addresses/{id}/default:
 *   patch:
 *     summary: Set Default Address
 *     description: Set an address as the default address.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     responses:
 *       200:
 *         description: SET_DEFAULT_ADDRESS_SUCCESS
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: SET_DEFAULT_ADDRESS_SUCCESS
 *                     data:
 *                       $ref: '#/components/schemas/UserAddress'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ADDRESS_NOT_FOUND
 */
router.patch('/addresses/:id/default', validate(addressIdParamsSchema), userController.setDefaultAddress)

/**
 * @openapi
 * /api/user/addresses/{id}:
 *   patch:
 *     summary: Update Address
 *     description: Update an existing address of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserAddressRequest'
 *     responses:
 *       200:
 *         description: UPDATE_ADDRESS_SUCCESS
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: UPDATE_ADDRESS_SUCCESS
 *                     data:
 *                       $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ADDRESS_NOT_FOUND
 */
router.patch('/addresses/:id', validate(updateAddressSchema), userController.updateAddress)

/**
 * @openapi
 * /api/user/addresses/{id}:
 *   delete:
 *     summary: Delete Address
 *     description: Delete an address of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     responses:
 *       200:
 *         description: DELETE_ADDRESS_SUCCESS
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: DELETE_ADDRESS_SUCCESS
 *                     data:
 *                       nullable: true
 *                       example: null
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ADDRESS_NOT_FOUND
 */
router.delete('/addresses/:id', validate(addressIdParamsSchema), userController.deleteAddress)

export default router
