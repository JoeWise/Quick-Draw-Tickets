import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validateQuery(schema: ZodType) 
{
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);

        if (!result.success) 
        {
            return res.status(400).json({
                error: 'Invalid query parameters',
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        (req as any).validatedQuery = result.data;
        next();
    };
}
