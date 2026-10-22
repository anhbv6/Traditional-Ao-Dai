import { type Request, type Response, type NextFunction } from 'express'
import * as otpService from './otp.service'
import { sendSuccess } from '../../core/http/response'

/**
 * Controller handler for sending OTP
 */
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, purpose } = req.body
    const result = await otpService.sendOtp(phone, purpose)
    return sendSuccess(res, {
      data: result,
      message: 'OTP_SENT_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}
