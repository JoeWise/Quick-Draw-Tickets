import { LayoutSection } from '../schemas/createSeatingLayoutSchema';
import { Venue } from '../types/Venue';
import db from '../utils/db';
import { QueryResult } from 'pg';

export async function findVenueByID(id: number): Promise<Venue | undefined>
{
    const q = `
            SELECT id, name, address, ST_Y(geog::geometry) AS latitude, ST_X(geog::geometry) AS longitude
            FROM venues
            WHERE id = $1
            `;
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

export async function insertSeatingLayoutWithSections(venueID: number, layoutName: string, sections: CreateLayoutSection[])
{
    await db.queryAsTransaction(async (client) => {
        // Insert seating layout
        const layoutRes = await client.query(
            `INSERT INTO seating_layouts (venue_id, name)
             VALUES ($1, $2)
             RETURNING id`,
            [venueID, layoutName]
        );
        const layoutID = layoutRes.rows[0].id;

        // Insert each section
        for (const section of sections) 
        {
            const sectionRes = await client.query(
                `INSERT INTO layout_sections (seating_layout_id, name, type)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [layoutID, section.name, section.type]
            );
            const sectionID = sectionRes.rows[0].id;

            // Insert seat for the section
            for (const seat of section.seats) 
            {
                await client.query(
                    `INSERT INTO section_seats (section_id, row, seat_number)
                     VALUES ($1, $2, $3)`,
                    [sectionID, seat.row ?? null, seat.seat_number]
                );
            }
        }
    });
}

export async function hasVenuePermission(userID: number, venueID: number, allowedRoles: ('owner' | 'editor' | 'viewer')[]): Promise<boolean> {
    
    const result = await db.query(
        `SELECT 1
         FROM venue_users
         WHERE user_id = $1 AND venue_id = $2 AND role = ANY($3::venue_user_role[])`,
        [userID, venueID, allowedRoles]
    );

    return result.rows.length > 0;
}
