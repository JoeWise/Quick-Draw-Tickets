import express, { Application } from 'express';
import authRoutes from './routes/authRoutes';

const app: Application = express();

// Middleware to parse JSON
app.use(express.json());

// Register routes
app.use('/auth', authRoutes);

export default app;
