import { Venue } from '../types/Venue';
import db from '../utils/db';
import { QueryResult } from 'pg';

export async function findVenueByID(id: number): Promise<Venue | undefined>
{
    const q = `
            SELECT id, name, address, ST_Y(geog::geometry) AS latitude, ST_X(geog::geometry) AS longitude
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
            SELECT 
                id, 
                name, 
                address, 
                ST_Y(geog::geometry) AS latitude, 
                ST_X(geog::geometry) AS longitude,
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

export async function findVenuesByName(nameSearchTerm: string, lon: string, lat: string, radiusMeters: number, limit: number, offset: number): Promise<Venue [] | undefined> 
{
    const q = `
            SELECT
                id,
                name,
                address,
                ST_Y(geog::geometry) AS latitude,
                ST_X(geog::geometry) AS longitude,
                ST_Distance(
                    geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) AS distance_meters
            FROM venues
            WHERE
                name ILIKE '%' || $3 || '%' AND
                ST_DWithin(
                    geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $4
                )
            ORDER BY distance_meters ASC
            LIMIT $5 OFFSET $6;
            `;
    const params = [lon, lat, nameSearchTerm, radiusMeters, limit, offset];
    
    const result: QueryResult<Venue> = await db.query(q, params);

    return result.rows;
}

export async function insertVenueWithOwner(name: string, address: string, lon: number, lat: number, userID: number) 
{   
    return db.queryAsTransaction(async (client) => {
        
        const insertVenueResult: QueryResult<Venue> = await client.query(
            `INSERT INTO venues (name, address, geog)
             VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
             RETURNING *`,
            [name, address, lon, lat]
        );

        const venue = insertVenueResult.rows[0];
        
        await client.query(
            `INSERT INTO venue_users (venue_id, user_id, role)
             VALUES ($1, $2, 'owner')`,
            [venue.id, userID]
        );

        return venue;
    });
}
