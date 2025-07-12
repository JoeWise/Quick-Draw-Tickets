export interface Event 
{
    id: number,
    creator_id: number,
    title: string,
    description?: string,
    datetime: Date,
    venue_id: number,
    layout_id: number
}
