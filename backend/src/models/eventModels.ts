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
