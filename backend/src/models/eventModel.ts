import db from '../utils/db';
import { QueryResult } from 'pg';
import { EventSchema } from '../schemas/createEventSchema';

export async function findEventByID(id: number): Promise<EventSchema | undefined>
{
    const q = `SELECT * FROM events WHERE id = $1`
    const params = [id];

    const result: QueryResult<EventSchema> = await db.query(q, params);

    return result.rows[0];
}

export async function findEventsByVenueID(venueID: number): Promise<EventSchema [] | undefined>
{
    const result: QueryResult<EventSchema> = await db.query(
        `SELECT * FROM events WHERE venue_id = $1`, 
        [venueID]
    );

    return result.rows;
}

export async function findEventsByDistance(lon: string, lat: string, limit: number, offset: number): Promise<EventSchema [] | undefined> 
{
    const q = `
            SELECT 
                events.*,
                venues.name AS venue_name,
                ST_Distance(
                    venues.geog,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) AS distance_meters
            FROM events
            JOIN venues ON events.venue_id = venues.id
            WHERE events.end_datetime > NOW()
            ORDER BY distance_meters ASC
            LIMIT $3 OFFSET $4;
            `;
    const params = [lon, lat, limit, offset];
    
    const result = await db.query(q, params);

    return result.rows;
}

export async function insertEvent(userID: number, eventInput: EventSchema)
{
    const query = `
        INSERT INTO events (
            creator_id,
            title,
            description,
            start_datetime,
            end_datetime,
            timezone,
            venue_id,
            seating_layout_id,
            pricing_layout_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
    `;

    const params = [
        userID,
        eventInput.title,
        eventInput.description || null,
        eventInput.start_datetime,
        eventInput.end_datetime,
        eventInput.timezone,
        eventInput.venue_id,
        eventInput.seating_layout_id,
        eventInput.pricing_layout_id
    ];

    const result: QueryResult<EventSchema> = await db.query(query, params);
    
    return result.rows[0];
}
