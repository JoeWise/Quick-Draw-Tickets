import { z } from 'zod';

export const createTicketReservationSchema = z.object({
    section_id: z.int(),
    seat_id: z.int()
});

export type CreateTicketReservation = z.infer<typeof createTicketReservationSchema>;


export const createTicketReservationArraySchema = z.object({
    ticket_reservations: z.array(createTicketReservationSchema)  // Array of ticket reservations
});

export type CreateTicketReservations = z.infer<typeof createTicketReservationArraySchema>;
