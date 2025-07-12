import { Venue } from '../types/Venue';
import db from '../utils/db';
import { QueryResult } from 'pg';

export async function findVenuesByDistance(lon: string, lat: string, limit: number, offset: number): Promise<Venue [] | undefined> {
    
    const q = `
            SELECT id, name, address, geog,
                ST_Distance(
                    geog,
                    ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
                ) AS distance_meters
            FROM venues
            ORDER BY distance_meters ASC
            LIMIT ${limit} OFFSET ${offset}
            `
    
    const result: QueryResult<Venue> = await db.query(q);

    return result.rows;
}
