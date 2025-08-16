export const ticketStatuses = ["pending", "purchased"];
export type TicketStatus = (typeof ticketStatuses)[number];

export const RESERVATION_DURATION = 15; // Duration in minutes a ticket can be reserved before it expires.