import express from "express";
import Router from './routes/room.routes.js';
import cors from "cors";
import authroutes from './routes/auth.routes.js';
const app= express();
app.use(cors({
    origin: "http://localhost:5173", // frontend
  credentials: true
}));
app.use(express.json());
app.use("/auth", authroutes);
app.use("/rooms",Router);
export default app;