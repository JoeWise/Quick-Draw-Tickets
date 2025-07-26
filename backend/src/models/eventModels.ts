import { Event } from "../types/Event";
import db from '../utils/db';
import { QueryResult } from 'pg';

export async function findEventsByVenueID(venueID: number): Promise<Event [] | undefined>
{
    const result: QueryResult<Event> = await db.query(
        `SELECT * FROM events WHERE venue_id = $1`, 
        [venueID]
    );

    return result.rows;
}

export async function findEventsByDistance(lon: string, lat: string, radiusMeters: number, limit: number, offset: number): Promise<Event [] | undefined>
{
    const result: QueryResult<Event> = await db.query(
        `
        SELECT
            events.*,
            venues.name AS venue_name,
            venues.address,
            ST_Distance(venues.geog, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters
        FROM events
        JOIN venues ON events.venue_id = venues.id
        WHERE 
            events.end_datetime > NOW() AND
            ST_DWithin(
                geog,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
        ORDER BY distance_meters ASC
        LIMIT $4 OFFSET $5;
        `,
        [lon, lat, radiusMeters, limit, offset]
    );

    return result.rows
}
