import { Venue } from '../types/Venue';
import db from '../utils/db';
import { QueryResult } from 'pg';

export async function findVenueByID(id: number): Promise<Venue | undefined>
{
    const q = `
            SELECT id, name, address, ST_Y(geog::geometry) AS lat, ST_X(geog::geometry) AS lon
            FROM venues
            WHERE id = $1
            `
    const params = [id];

    const result: QueryResult<Venue> = await db.query(q, params);

    return result.rows[0];
}

export async function findVenuesByDistance(lon: string, lat: string, limit: number, offset: number): Promise<Venue [] | undefined> 
{
    const q = `
            SELECT id, name, address, ST_Y(geog::geometry) AS lat, ST_X(geog::geometry) AS lon,
                ST_Distance(
                    geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) AS distance_meters
            FROM venues
            ORDER BY distance_meters ASC
            LIMIT $3 OFFSET $4
            `;
    const params = [lon, lat, limit, offset];
    
    const result: QueryResult<Venue> = await db.query(q, params);

    return result.rows;
}
