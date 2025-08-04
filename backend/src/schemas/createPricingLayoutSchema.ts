import { z } from 'zod';

const seatPriceSchema = z.object({
  section_id: z.number().int(),
  seat_id: z.number().int(),
  price: z.number().nonnegative(),
});

export type SeatPrice = z.infer<typeof seatPriceSchema>;

export const pricingLayoutSchema = z.object({
  name: z.string().min(1),
  seat_prices: z.array(seatPriceSchema)
});

// {
//   "name": "Main Concert Pricing",
//   "seat_prices": [
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
