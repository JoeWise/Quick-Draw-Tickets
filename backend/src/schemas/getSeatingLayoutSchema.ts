import { z } from 'zod';
import { sectionTypes } from '../types/SectionType';

export const getSectionSeatSchema = z.object({
    section_seat_id: z.number().int(),
    row: z.string().nullable().optional(),
    seat_number: z.string(),
    seat_label: z.string(),
});
export type GetSectionSeat = z.infer<typeof getSectionSeatSchema>;

export const getLayoutSectionSchema = z.object({
    layout_section_id: z.number().int(),
    name: z.string(),
    type: z.enum(sectionTypes),
    seats: z.array(getSectionSeatSchema),
});
export type GetLayoutSection = z.infer<typeof getLayoutSectionSchema>;

export const getSeatingLayoutSchema = z.object({
    seating_layout_id: z.number().int(),
    venue_id: z.number().int(),
    name: z.string(),
    sections: z.array(getLayoutSectionSchema),
});
export type GetSeatingLayout = z.infer<typeof getSeatingLayoutSchema>;


// With Price
export const getSectionSeatWithPriceSchema = getSectionSeatSchema.extend({
    price: z.number()
});
export type GetSectionSeatWithPrice = z.infer<typeof getSectionSeatWithPriceSchema>;

export const getLayoutSectionWithPriceSchema = getLayoutSectionSchema.extend({
    seats: z.array(getSectionSeatWithPriceSchema),
});
export type GetLayoutSectionWithPrice = z.infer<typeof getLayoutSectionWithPriceSchema>;

export const getSeatingLayoutWithPriceSchema = getSeatingLayoutSchema.extend({
    sections: z.array(getLayoutSectionWithPriceSchema),
});
export type GetSeatingLayoutWithPrice = z.infer<typeof getSeatingLayoutWithPriceSchema>;
