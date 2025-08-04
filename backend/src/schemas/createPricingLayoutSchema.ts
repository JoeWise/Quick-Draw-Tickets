import { z } from 'zod';

const ticketPriceSchema = z.object({
  section_id: z.number().int(),
  seat_id: z.number().int().nullable(),
  price: z.number().nonnegative(),
}).refine((data) => {
  // Ensure either seat-level or section-level pricing is valid
  return (data.seat_id === null && data.section_id !== null) ||
         (data.seat_id !== null && data.section_id !== null);
}, {
  message: 'Either section-level (seat_id = null) or seat-level (seat_id and section_id) pricing must be provided.'
});

export type TicketPrice = z.infer<typeof ticketPriceSchema>;

export const pricingLayoutSchema = z.object({
  name: z.string().min(1),
  ticket_prices: z.array(ticketPriceSchema)
});

// {
//   "name": "Main Concert Pricing",
//   "ticket_prices": [
//     { "section_id": 1, "seat_id": 1, "price": 75.00 },
//     { "section_id": 1, "seat_id": 2, "price": 75.00 },
//     { "section_id": 1, "seat_id": 3, "price": 75.00 },
//     { "section_id": 1, "seat_id": 4, "price": 75.00 },
//     { "section_id": 1, "seat_id": 5, "price": 75.00 },
//     { "section_id": 1, "seat_id": 6, "price": 65.00 },
//     { "section_id": 1, "seat_id": 7, "price": 65.00 },
//     { "section_id": 1, "seat_id": 8, "price": 65.00 },
//     { "section_id": 1, "seat_id": 9, "price": 65.00 },
//     { "section_id": 1, "seat_id": 10, "price": 65.00 },

//     { "section_id": 2, "seat_id": null, "price": 40.00 }
//   ]
// }
