import { Request, Response } from 'express';
import { attemptGeocode, geocodeIP, geocodeLocation } from '../utils/geocode';
import { getClientIp } from '../utils/getClientIP';
import { findEventsByVenueID } from '../models/eventModel';
import * as venueModel from '../models/venueModel';
import { AuthenticatedRequest } from '../types/express';
import { Venue } from '../types/Venue';

export async function getNearbyVenues( req: Request, res: Response)
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
        const venues = await venueModel.findVenuesByDistance(lon.toString(), lat.toString(), perPage, (page - 1) * perPage);
        res.json(venues);
    }
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
}

export async function getVenueDetails(req: Request, res: Response) 
{
    try
    {
        const venue = await venueModel.findVenueByID(+req.params.id);
        const eventsAtVenue = await findEventsByVenueID(+req.params.id);

        res.json({ "venue": venue, "events": eventsAtVenue});
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch venue details' });
    }
}

export async function createVenue(req: AuthenticatedRequest, res: Response)
{
    let lat = 0;
    let lon = 0;

    if (req.body.address)
    {
        const geoData = await geocodeLocation(req.body.address);

        if (!geoData) 
        {
            return res.status(400).json({ error: 'Unable to geocode address' });
        }

        lat = geoData.lat;
        lon = geoData.lon;
    }

    const venue: Venue = await venueModel.insertVenueWithOwner(req.body.name, req.body.address, lon, lat, req.user!.id)

    return res.status(201).json(venue);
}

export async function createSeatingLayout(req: AuthenticatedRequest, res: Response)
{
    const { venueID } = req.params;
    const { name, sections } = req.body;
    const userID = req.user!.id;

    const authorized = await venueModel.hasVenuePermission(userID, Number(venueID), ['owner', 'editor']);

    if (!authorized) 
    {
        res.status(403).json({ error: 'Unauthorized' });
        console.error('Error creating seating layout: Unauthorized');
        return;
    }

    try
    {
        await venueModel.insertSeatingLayoutWithSections(Number(venueID), name, sections);
        res.status(201).json({ message: 'Seating layout created successfully' });
    }
    catch (err)
    {
        console.error('Error creating seating layout:', err);
        res.status(500).json({ error: "Failed to create seating layout" });
    }
}

export async function createPricingLayout(req: AuthenticatedRequest, res: Response)
{
    const { venueID, seatingLayoutID } = req.params;
    const { name, ticket_prices } = req.body;
    const userID = req.user!.id;

    const authorized = await venueModel.hasVenuePermission(userID, Number(venueID), ['owner', 'editor']);

    if (!authorized) 
    {
        res.status(403).json({ error: 'Unauthorized' });
        console.error('Error creating pricing layout: Unauthorized');
        return;
    }

    try
    {
        await venueModel.insertPricingLayout(Number(venueID), Number(seatingLayoutID), name, ticket_prices);
        res.status(201).json({ message: 'Pricing layout created successfully' });
    }
    catch (err)
    {
        console.error('Error creating pricing layout:', err);
        res.status(500).json({ error: "Failed to create pricing layout" });
    }
}
