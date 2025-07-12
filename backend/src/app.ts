import express, { Application } from 'express';
import authRoutes from './routes/authRoutes';
import venueRoutes from './routes/venueRoutes';

const app: Application = express();

// Middleware to parse JSON
app.use(express.json());

// Register routes
app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);

export default app;
