import { Router } from 'express'
import * as userController from './user.controller'
import { requireAuth } from '../../shared/middlewares/authGuard'
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
} from './user.schema'

const router = Router()

// All user routes require authentication
router.use(requireAuth)

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
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or phone number already in use
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile)

/**
 * @openapi
 * /api/user/change-password:
 *   post:
 *     summary: Change User Password
 *     description: Change the authenticated customer's login password.
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
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
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
 *         description: Google account linked successfully
 *       400:
 *         description: Validation error or Google account already linked to another user
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
 *         description: Google account unlinked successfully
 *       400:
 *         description: Cannot unlink if user has no password and no other social accounts
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Link not found
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
 *         description: List of sessions retrieved successfully
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
 *         description: Session revoked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.delete('/session/:sessionId', validate(deleteSessionSchema), userController.revokeSession)

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
 *         description: Addresses retrieved successfully
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
 *         description: Address created successfully
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
 *         description: Validation error or max address limit reached
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
 *         description: Default address set successfully
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
 *         description: Address not found
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
 *         description: Address updated successfully
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
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
 *         description: Address deleted successfully
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
 *         description: Address not found
 */
router.delete('/addresses/:id', validate(addressIdParamsSchema), userController.deleteAddress)

export default router
