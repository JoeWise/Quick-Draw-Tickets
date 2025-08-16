import { z } from 'zod';
import { ticketStatuses } from '../types/TicketStatuses';

export const getTicketSchema = z.object({
    id: z.int(),
    user_id: z.int(),
    event_id: z.int(),
    section_id: z.int(),
    seat_id: z.int(),
    status: z.enum(ticketStatuses),
    reserved_until: z.iso.datetime(),
    price: z.number().nonnegative(),
    created_at: z.iso.datetime(),
});

export type GetTicket = z.infer<typeof getTicketSchema>;
