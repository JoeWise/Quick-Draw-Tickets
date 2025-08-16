import db from './db';

// Clears all tables
export async function clearDatabase()
{
    await db.query(
        'TRUNCATE tickets, events, seat_prices, section_seats, layout_sections, seating_layouts, venues, users, pricing_layouts RESTART IDENTITY CASCADE'
    );
}

// Creates and returns a user ID
export async function createUser(email: string)
{
    const res = await db.query<{id: number}>(
        `INSERT INTO users (email, password_hash) VALUES ($1, 'strongpasswordhash') RETURNING id`,
        [email]
    );
    return res.rows[0].id;
}

// Creates a venue, layout, section, and seats
export async function createVenueWithSeatingAndPricingLayout(venueName: string, sectionName: string, seatNumbers: string[], seatPrice: number)
{
    // Create a venue.
    const venue = await db.query<{id: number}>(
        `INSERT INTO venues (name, address) VALUES ($1, $2) RETURNING id`,
        [venueName, '123 Test St']
    );
    const venueID = venue.rows[0].id;

    // Create seating layout with one section and multiple seats.
    const seatingLayout = await db.query<{id: number}>(
        `INSERT INTO seating_layouts (venue_id, name) VALUES ($1, $2) RETURNING id`,
        [venueID, 'Test Layout']
    );
    const seatingLayoutID = seatingLayout.rows[0].id;

    const section = await db.query<{id: number}>(
        `INSERT INTO layout_sections (seating_layout_id, name, type) VALUES ($1, $2, $3) RETURNING id`,
        [seatingLayoutID, sectionName, "assigned"]
    );
    const sectionID = section.rows[0].id;

    const seatIDs: number[] = [];
    for (const seatNumber of seatNumbers)
    {
        const seat = await db.query<{id: number}>(
            `INSERT INTO section_seats (section_id, seat_number) VALUES ($1, $2) RETURNING id`,
            [sectionID, seatNumber]
        );
        seatIDs.push(seat.rows[0].id);
    }

    // Create pricing layout.
    const pricingLayout = await db.query<{id: number}>(
        `
        INSERT INTO pricing_layouts (venue_id, seating_layout_id, name)
        VALUES ($1, $2, 'Test Pricing Layout')
        RETURNING id;
        `,
        [venueID, seatingLayoutID]
    );
    const pricingLayoutID = pricingLayout.rows[0].id;

    // Insert prices for every seat.
    for (const seatID of seatIDs) {
        await db.query(
            `
            INSERT INTO seat_prices (pricing_layout_id, section_id, seat_id, price)
            VALUES ($1, $2, $3, $4);
            `,
            [pricingLayoutID, sectionID, seatID, seatPrice]
        );
    }

    return { venueID, seatingLayoutID, pricingLayoutID, sectionID, seatIDs };
}

export async function createEvent(creatorID: number, venueID: number, seatingLayoutID: number, pricingLayoutID: number) 
{
    const event = await db.query<{ id: number }>(
        `
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
        )
        VALUES (
            $1,
            'Test Event',
            'This is a test event.',
            NOW(),
            NOW() + INTERVAL '2 hours',
            'UTC',
            $2,
            $3,
            $4
        )
        RETURNING id;
        `,
        [creatorID, venueID, seatingLayoutID, pricingLayoutID]
    );

    return event.rows[0].id
}
