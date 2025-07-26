import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validateBody<T>(schema: ZodType)
{
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        
        if (!result.success) 
        {
            return res.status(400).json({
                error: 'Body validation failed',
                issues: result.error.issues.map((issue) => ({ 
                    path: issue.path.join('.'), 
                    message: issue.message 
                }))
            });
        }

        req.body = result.data;
        next();
    };
}
