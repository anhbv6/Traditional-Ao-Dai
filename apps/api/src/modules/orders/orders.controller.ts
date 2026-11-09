import { type Response, type NextFunction } from 'express'
import * as service from './orders.service'
import { sendSuccess } from '../../core/http/response'
import { AppError } from '../../core/http/AppError'
import { type AuthenticatedRequest } from '../../core/middlewares/authGuard'
import { type ListMyOrdersQuery } from './orders.schema'

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user) throw new AppError(401, 'AUTHENTICATION_REQUIRED')
  return req.user.userId
}

export async function placeOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.placeOrder(req.body, req.user?.userId)
    return sendSuccess(res, { data, message: 'ORDER_PLACED', statusCode: 201 })
  } catch (error) {
    return next(error)
  }
}

export async function lookupOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.lookupOrder(req.body)
    return sendSuccess(res, { data, message: 'ORDER_FOUND' })
  } catch (error) {
    return next(error)
  }
}

export async function trackOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getTimelineByToken(req.body.token)
    return sendSuccess(res, { data, message: 'ORDER_FOUND' })
  } catch (error) {
    return next(error)
  }
}

export async function sendOrderOtp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.sendOrderOtp(req.body.token, req.body.purpose)
    return sendSuccess(res, { data, message: 'OTP_SENT_SUCCESS' })
  } catch (error) {
    return next(error)
  }
}

export async function verifyOrderEdit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.verifyOrderEdit(req.body.token, req.body.code)
    return sendSuccess(res, { data, message: 'ORDER_EDIT_VERIFIED' })
  } catch (error) {
    return next(error)
  }
}

export async function updateOrderAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.updateOrderAddress(req.body)
    return sendSuccess(res, { data, message: 'ORDER_ADDRESS_UPDATED' })
  } catch (error) {
    return next(error)
  }
}

export async function updateOrderMeasurements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.updateOrderMeasurements(req.body)
    return sendSuccess(res, { data, message: 'ORDER_MEASUREMENTS_UPDATED' })
  } catch (error) {
    return next(error)
  }
}

export async function listMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, meta } = await service.listMyOrders(requireUserId(req), req.query as unknown as ListMyOrdersQuery)
    return sendSuccess(res, { data, meta })
  } catch (error) {
    return next(error)
  }
}

export async function getMyOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getMyOrder(requireUserId(req), String(req.params.orderCode))
    return sendSuccess(res, { data })
  } catch (error) {
    return next(error)
  }
}

export async function createMyOrderLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.createMyOrderLink(requireUserId(req), String(req.params.orderCode))
    return sendSuccess(res, { data })
  } catch (error) {
    return next(error)
  }
}
