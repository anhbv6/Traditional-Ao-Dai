import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'

/**
 * Validates request payload against a Zod schema.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      // Assign back the parsed/typed values
      req.body = parsed.body
      req.query = parsed.query
      req.params = parsed.params
      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Validation error',
          errors: error.errors.map((err) => ({
            field: err.path.slice(1).join('.'), // e.g., 'body.email' -> 'email'
            message: err.message,
          })),
        })
      }
      return next(error)
    }
  }
}
