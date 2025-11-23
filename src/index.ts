import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/pool";
import { applyMiddleware } from "./middleware/initalizationMiddleware";

// configuration
dotenv.config();
connectDB();
const app = express();
applyMiddleware(app);

// routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express with TypeScript!");
});

/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
