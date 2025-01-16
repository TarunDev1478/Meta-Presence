import express from 'express';
import { router } from './router/v1';
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins; change to specific domain(s) for production
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/v1', router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
