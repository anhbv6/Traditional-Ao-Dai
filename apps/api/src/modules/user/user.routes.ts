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

export default router
