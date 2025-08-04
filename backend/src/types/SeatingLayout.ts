export interface SeatingLayout
{
    seating_layout_id: number,
    venue_id: number,
    layout_name: string,
    section_id: number,
    section_name: string,
    section_type: string,
    seat_id: number,
    row: string,
    seat_number: string,
    seat_label: string
}

export interface SeatingLayoutWithPrice extends SeatingLayout
{
    price: number
}
