import db from '../utils/db';
import { QueryResult } from 'pg';
import { CreateTicketReservation } from '../schemas/createTicketReservation';
import { RESERVATION_DURATION } from '../types/TicketStatuses';
import { GetTicket } from '../schemas/getTicketSchema';
import { DatabaseLocks } from '../types/DatabaseLocks';

export async function reserveTickets(userID: number, eventID: number, ticketReservations: CreateTicketReservation[]): Promise<GetTicket[]> 
{    
    let reservationOutput: GetTicket[] = [];

    await db.queryAsTransaction(async (client) => {

        const lockQuery = `
                        SELECT pg_advisory_xact_lock($1, $2);
                        `;

        const deleteStaleReservationQuery = `
                                            DELETE FROM tickets
                                            WHERE event_id = $1
                                                AND section_id = $2
                                                AND seat_id = $3
                                                AND status = 'pending'::ticket_status
                                                AND reserved_until < NOW();
                                            `;

        const reserveIfAvailableQuery = `
                                        INSERT INTO tickets (user_id, event_id, section_id, seat_id, reserved_until, price)
                                        SELECT
                                            $1,  -- user_id
                                            e.id,  -- event_id
                                            $3,  -- section_id
                                            $4,  -- seat_id
                                            NOW() + ($5 || ' minutes')::interval,  -- reserved_until
                                            sp.price  -- fetched from seat_prices
                                        FROM events e
                                        JOIN seat_prices sp
                                        ON sp.pricing_layout_id = e.pricing_layout_id
                                        AND sp.section_id = $3
                                        AND sp.seat_id = $4
                                        WHERE e.id = $2
                                        AND NOT EXISTS (
                                            SELECT 1
                                            FROM tickets t
                                            WHERE t.event_id = $2
                                                AND t.section_id = $3
                                                AND t.seat_id = $4
                                                AND NOT (
                                                    (t.status = 'pending'::ticket_status AND t.reserved_until < NOW())
                                                    OR t.status = 'purchased'::ticket_status
                                                )
                                        )
                                        RETURNING *;
                                        `;

        // Sort ticket reservations by seat_id to ensure consistent locking.
        ticketReservations.sort((a, b) => a.seat_id - b.seat_id);

        // Acquire advisory lock for all of the seats first.
        for (const ticketReservation of ticketReservations) 
        {
            const lockParams = [DatabaseLocks.TICKETS, ticketReservation.seat_id];
            await client.query(lockQuery, lockParams);
        }

        for (const ticketReservation of ticketReservations) 
        {   
            // Delete any stale pending reservations for the same seat.
            const deleteStaleReservationParams = [eventID, ticketReservation.section_id, ticketReservation.seat_id];
            await client.query(deleteStaleReservationQuery, deleteStaleReservationParams);
    
            // Attempt to reserve ticket if it's available.
            const reserveIfAvailableParams = [userID, eventID, ticketReservation.section_id, ticketReservation.seat_id, RESERVATION_DURATION];
            const insertResult: QueryResult<GetTicket> = await client.query(reserveIfAvailableQuery, reserveIfAvailableParams);
            
            if (insertResult.rows.length === 0)
                throw new Error(`Failed to reserve ticket for section ${ticketReservation.section_id}, seat ${ticketReservation.seat_id}.`);
            
            console.log(`Reserved ticket for section ${ticketReservation.section_id}, seat ${ticketReservation.seat_id}.`);

            reservationOutput.push(insertResult.rows[0]);
        }
    });

    return reservationOutput;
}
