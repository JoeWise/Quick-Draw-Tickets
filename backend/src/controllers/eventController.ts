import { Request, Response } from 'express';
import { AuthenticatedRequest } from "../types/express";
import { EventSchema } from '../schemas/createEventSchema';
import * as venueModel from '../models/venueModel';
import * as eventModel from '../models/eventModel';
import { attemptGeocode } from '../utils/geocode';
import { getClientIp } from '../utils/getClientIP';

export async function getNearbyEvents(req: Request, res: Response)
{
        let { page, perPage, lat, lon, location } = (req as any).validatedQuery;
        
        if (!lat || !lon)
        {
            const geo = await attemptGeocode(location, getClientIp(req));
    
            // If geocoding failed, set to default (Los Angeles).
            if (!geo)
            {
                lat = 34.0536909;
                lon = -118.2427660;
            }
            else
            {
                lat = geo.lat;
                lon = geo.lon;
            }
        }
    
        try 
        {
            const venues = await eventModel.findEventsByDistance(lon.toString(), lat.toString(), perPage, (page - 1) * perPage);
            res.json(venues);
        }
        catch (err) 
        {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch events' });
        }
}

export async function getEventDetails(req: Request, res: Response)
{
    try
    {
        const event = await eventModel.findEventByID(+req.params.id);

        if (!event)
            return res.status(404).json({ message: "Event not found" });

        const venue = await venueModel.findVenueByID(event!.venue_id);

        if (!venue)
            return res.status(404).json({ message: "Venue not found" });

        const seatingLayout = await venueModel.findSeatingLayoutWithPrices(event.seating_layout_id, event.pricing_layout_id);

        if (!seatingLayout)
            return res.status(404).json({ message: "Seating Layout not found" });

        res.json({"event": event, "venue": venue, "seatingLayout": seatingLayout});
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch event details' });
    }
}

export async function createEvent(req: AuthenticatedRequest, res: Response)
{
    const eventInput: EventSchema = req.body;

    // Make sure this user has permission to create events for this venue.
    const authorized = await venueModel.hasVenuePermission(req.user!.id, eventInput.venue_id, ['owner', 'editor']);

    if (!authorized) 
    {
        res.status(403).json({ error: 'Unauthorized' });
        console.error('Error creating event: Unauthorized');
        return;
    }

    try
    {
        const event: EventSchema = await eventModel.insertEvent(req.user!.id, eventInput);
        return res.status(201).json(event);
    }
    catch (err)
    {
        console.error('Error creating event:', err);
        res.status(500).json({ error: "Failed to create event" });
    }
}
