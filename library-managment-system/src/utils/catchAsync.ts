import { Request, Response, NextFunction } from "express";

/**
 * Higher-order utility function that wraps asynchronous controller handlers.
 * It automatically catches any thrown errors or unhandled promise rejections,
 * forwarding them safely to Express's centralized global error handling middleware via next().
 * 
 * @param fn Asynchronous controller function to wrap
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
