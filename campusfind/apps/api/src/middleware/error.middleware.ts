import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      Message: 'Validation failed',
      Errors: err.errors
    });
  }

  if (err.message === 'Invalid file type. Only JPEG, PNG, and WebP are allowed.') {
    return res.status(400).json({ Message: err.message });
  }

  res.status(500).json({ Message: 'Internal server error' });
};
