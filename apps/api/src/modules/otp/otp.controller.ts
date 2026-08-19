import { Request, Response, NextFunction } from 'express'
import * as otpService from './otp.service'
import { sendSuccess } from '../../shared/utils/response'

/**
 * Controller handler for sending OTP
 */
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<any> {
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

/**
 * Controller handler for verifying OTP
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { phone, purpose, code } = req.body
    const isValid = await otpService.verifyOtp(phone, purpose, code)
    return sendSuccess(res, {
      data: { isValid },
      message: 'OTP_VERIFIED_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}
