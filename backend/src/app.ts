import express, { Application } from 'express';
import authRoutes from './routes/authRoutes';
import venueRoutes from './routes/venueRoutes';
import eventRoutes from './routes/eventRoutes';

const app: Application = express();

// Middleware to parse JSON
app.use(express.json());

// Register routes
app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);
app.use('/events/', eventRoutes);

export default app;
