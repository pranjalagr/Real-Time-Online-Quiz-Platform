import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import cors from "cors";
app.use(cors({
    origin: "http://localhost:5173", // frontend
  credentials: true
}));
const PORT= process.env.PORT||5000;
import http from "http";
import { initsockets } from "./socket/index.js";
const server = http.createServer(app);
const io = initsockets(server);
server.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT}`)
});