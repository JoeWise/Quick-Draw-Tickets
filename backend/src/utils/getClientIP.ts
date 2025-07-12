import { Request } from 'express';

export function getClientIp(req: Request): string
{
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string')
    {
        // X-Forwarded-For may contain a list of IPs. Use the first one.
        return forwarded.split(',')[0].trim();
    }

    // Fallback for direct connections.
    return req.socket.remoteAddress || '';
}