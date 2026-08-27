import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wrapper bọc các Route Handlers bất đồng bộ.
 * Tự động bắt mọi Promise Rejection và chuyển tiếp đến Centralized ErrorHandler qua next(err).
 */
export const asyncBoundary = (fn: AsyncHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
