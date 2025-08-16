import { reserveTickets } from './ticketModel';
import { clearDatabase, createUser, createVenueWithSeatingAndPricingLayout, createEvent } from '../utils/createTestData';
import db from '../utils/db';
import { GetTicket } from '../schemas/getTicketSchema';

describe('Concurrent overlapping seat reservation', () => {
    let user1ID: number;
    let user2ID: number;
    let user3ID: number;
    let eventID: number;
    let sectionID: number;
    let seatIDs: number[];

    beforeAll(async () => {
        await clearDatabase();

        // Create three users.
        user1ID = await createUser('alice@test.com');
        user2ID = await createUser('bob@test.com');
        user3ID = await createUser('jeff@test.com');

        // Create venue with seating layout and pricing layout.
        const venueData = await createVenueWithSeatingAndPricingLayout(
            'Test Venue',
            'Main Section',
            ['A1', 'A2', 'A3', 'A4'],
            50.0
        );

        const { venueID, seatingLayoutID, pricingLayoutID} = venueData;

        sectionID = venueData.sectionID;
        seatIDs = venueData.seatIDs;

        // Create an event.
        eventID = await createEvent(
            user1ID,
            venueID,
            seatingLayoutID,
            pricingLayoutID
        );
    });

    it('Handle overlapping seat reservations correctly', async () => {
        // User1 tries to reserve seats A1, A2
        const user1Tickets = seatIDs.slice(0, 2).map(seat_id => ({
            event_id: eventID,
            section_id: sectionID,
            seat_id,
        }));

        // User2 tries to reserve seats A2, A3 (overlaps on A2)
        const user2Tickets = seatIDs.slice(1, 3).map(seat_id => ({
            event_id: eventID,
            section_id: sectionID,
            seat_id,
        }));

        // User3 tries to reserve seats A3, A4 (overlaps on A3)
        const user3Tickets = seatIDs.slice(2, 4).map(seat_id => ({
            event_id: eventID,
            section_id: sectionID,
            seat_id,
        }));

        // Fire all three reservations concurrently
        const results = await Promise.allSettled([
            reserveTickets(user1ID, eventID, user1Tickets),
            reserveTickets(user2ID, eventID, user2Tickets),
            reserveTickets(user3ID, eventID, user3Tickets)
        ]);

        // Two of the users should succeed and the other should fail on the overlapping seats.
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');
        
        console.log('fulfilled:', fulfilled);

        expect(fulfilled.length).toBe(2);
        expect(rejected.length).toBe(1);

        const successfulReservations = fulfilled.map(r => (r as PromiseFulfilledResult<GetTicket[]>).value);
        const failedReasons = rejected.map(r => (r as PromiseRejectedResult).reason.message);

        console.log('Successful reservations:', successfulReservations);
        console.log('Failed reasons:', failedReasons);

        // Verify that user 1 and user 3 successfully reserved their tickets
        const userIds = successfulReservations.flat().map(t => t.user_id); // assuming reserveTickets returns an array per user
        expect(userIds).toContain(user1ID);
        expect(userIds).toContain(user3ID);
        
        // Check that the error message indicates failure to reserve overlapping seats
        for (const reason of failedReasons)
            expect(reason).toMatch(/Failed to reserve ticket/);
    });

    afterAll(async () => {
        await db.end();
    });
});
