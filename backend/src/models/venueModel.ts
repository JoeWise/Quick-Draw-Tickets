import db from '../utils/db';
import { QueryResult } from 'pg';
import { Venue } from '../types/Venue';
import { SeatingLayout, SeatingLayoutWithPrice } from '../types/SeatingLayout';
import { SectionType } from '../types/SectionType';
import { CreateLayoutSection } from '../schemas/createSeatingLayoutSchema';
import { TicketPrice } from '../schemas/createPricingLayoutSchema';
import { GetLayoutSection, GetLayoutSectionWithPrice, GetSeatingLayout, GetSeatingLayoutWithPrice } from '../schemas/getSeatingLayoutSchema';

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

export async function findSeatingLayoutByID(seatingLayoutID: number): Promise<GetSeatingLayout | undefined>
{
    const q = `
            SELECT
                sl.id AS seating_layout_id,
                sl.venue_id,
                sl.name AS layout_name,

                ls.id AS section_id,
                ls.name AS section_name,
                ls.type AS section_type,

                ss.id AS seat_id,
                ss.row,
                ss.seat_number,
                ss.seat_label

            FROM seating_layouts sl
            JOIN layout_sections ls ON sl.id = ls.seating_layout_id
            LEFT JOIN section_seats ss ON ls.id = ss.section_id
            WHERE sl.id = $1
            ORDER BY ls.id, ss.id;
            `;
    const params = [seatingLayoutID];

    const result: QueryResult<SeatingLayout> = await db.query(q, params);

    if (result.rows.length == 0)
        return;

    const layout: GetSeatingLayout = {
        seating_layout_id: result.rows[0].seating_layout_id,
        venue_id: result.rows[0].venue_id,
        name: result.rows[0].layout_name,
        sections: []
    };

    const sectionMap = new Map();

    for (const row of result.rows) 
    {
        let section: GetLayoutSection = sectionMap.get(row.section_id);
        if (!section) 
        {
            section = {
                layout_section_id: row.section_id,
                name: row.section_name,
                type: row.section_type as SectionType,
                seats: []
            };
            sectionMap.set(row.section_id, section);
            layout.sections.push(section);
        }

        if (row.seat_id) 
        {
            section.seats.push({
                section_seat_id: row.seat_id,
                row: row.row,
                seat_number: row.seat_number,
                seat_label: row.seat_label
            });
        }
    }

    return layout;
}

export async function insertPricingLayout(venueID: number, seatingLayoutID: number, name: string, ticket_prices: TicketPrice[])
{
    await db.queryAsTransaction(async (client) => {
        // Insert pricing layout.
        const layoutRes = await client.query(        
            `
            INSERT INTO pricing_layouts (venue_id, seating_layout_id, name)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [venueID, seatingLayoutID, name]
        );

        const pricingLayoutID = layoutRes.rows[0].id;

        // Insert each ticket price.
        for (const ticket_price of ticket_prices) 
        {
            const ticketRes = await client.query(
                `
                INSERT INTO ticket_prices (pricing_layout_id, section_id, seat_id, price)
                VALUES ($1, $2, $3, $4)
                `,
                [pricingLayoutID, ticket_price.section_id, ticket_price.seat_id || null, ticket_price.price]
            );
        }
    });
}

export async function findSeatingLayoutWithPrices(seatingLayoutID: number, pricingLayoutID: number): Promise<GetSeatingLayoutWithPrice | undefined>
{
    const q = `
            SELECT
                sl.id             AS layout_id,
                sl.venue_id,
                sl.name           AS layout_name,
                ls.id             AS section_id,
                ls.name           AS section_name,
                ls.type           AS section_type,
                ss.id             AS seat_id,
                ss.row,
                ss.seat_number,
                ss.seat_label,
                tp.price          AS price
            FROM seating_layouts sl
            JOIN layout_sections ls ON ls.seating_layout_id = sl.id
            JOIN section_seats ss ON ss.section_id = ls.id
            LEFT JOIN ticket_prices tp
                ON tp.pricing_layout_id = $2
                AND tp.section_id = ls.id
                AND tp.seat_id = ss.id
            WHERE sl.id = $1
            ORDER BY ls.id, ss.id;
            `;
    const params = [seatingLayoutID, pricingLayoutID];

    const result: QueryResult<SeatingLayoutWithPrice> = await db.query(q, params);

    if (result.rows.length == 0)
        return;

    const layout: GetSeatingLayoutWithPrice = {
        seating_layout_id: result.rows[0].seating_layout_id,
        venue_id: result.rows[0].venue_id,
        name: result.rows[0].layout_name,
        sections: []
    };

    const sectionMap = new Map();

    for (const row of result.rows) 
    {
        let section: GetLayoutSectionWithPrice = sectionMap.get(row.section_id);
        if (!section) 
        {
            section = {
                layout_section_id: row.section_id,
                name: row.section_name,
                type: row.section_type as SectionType,
                seats: []
            };
            sectionMap.set(row.section_id, section);
            layout.sections.push(section);
        }

        section.seats.push({
            section_seat_id: row.seat_id,
            row: row.row,
            seat_number: row.seat_number,
            seat_label: row.seat_label,
            price: row.price
        });
    }

    return layout;
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
