import { z } from 'zod';

export const sectionSeatSchema = z.object({
    row: z.string().nullable().optional(),
    seat_number: z.string(),
});

export type SectionSeat = z.infer<typeof sectionSeatSchema>;

export const layoutSectionSchema = z.object({
    name: z.string(),
    type: z.enum(['assigned', 'ga']),
    seats: z.array(sectionSeatSchema),
});

export type LayoutSection = z.infer<typeof layoutSectionSchema>;

export const seatingLayoutSchema = z.object({
    name: z.string(),
    sections: z.array(layoutSectionSchema),
});

// Example JSON schema:
// {
//     "name": "Main Concert Layout",
//     "sections": [
//         {
//             "name": "Balcony",
//             "type": "assigned",
//             "seats": [
//                 { "row": "A", "seat_number": "1" },
//                 { "row": "A", "seat_number": "2" },
//                 { "row": "A", "seat_number": "3" },
//                 { "row": "A", "seat_number": "4" },
//                 { "row": "A", "seat_number": "5" },
//                 { "row": "B", "seat_number": "1" },
//                 { "row": "B", "seat_number": "2" },
//                 { "row": "B", "seat_number": "3" },
//                 { "row": "B", "seat_number": "4" },
//                 { "row": "B", "seat_number": "5" }
//             ]
//         },
//         {
//             "name": "Pit",
//             "type": "ga",
//             "seats": [
//                 { "seat_number": "1" },
//                 { "seat_number": "2" },
//                 { "seat_number": "3" },
//                 { "seat_number": "4" },
//                 { "seat_number": "5" },
//                 { "seat_number": "6" },
//                 { "seat_number": "7" },
//                 { "seat_number": "8" },
//                 { "seat_number": "9" },
//                 { "seat_number": "10" },
//                 { "seat_number": "11" },
//                 { "seat_number": "12" },
//                 { "seat_number": "13" },
//                 { "seat_number": "14" },
//                 { "seat_number": "15" },
//                 { "seat_number": "16" },
//                 { "seat_number": "17" },
//                 { "seat_number": "18" },
//                 { "seat_number": "19" },
//                 { "seat_number": "20" },
//                 { "seat_number": "21" },
//                 { "seat_number": "22" },
//                 { "seat_number": "23" },
//                 { "seat_number": "24" },
//                 { "seat_number": "25" },
//                 { "seat_number": "26" },
//                 { "seat_number": "27" },
//                 { "seat_number": "28" },
//                 { "seat_number": "29" },
//                 { "seat_number": "30" }
//             ]
//         }
//     ]
// }
