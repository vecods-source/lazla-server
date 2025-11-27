import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db/pool";
import { applyMiddleware } from "./middleware/initalizationMiddleware";
import Auth from "./modules/Auth/auth.route";
// configuration
dotenv.config();
connectDB();
const app = express();
applyMiddleware(app);

// routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Qatar");
});
app.use("/api/auth/customer", Auth);

/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
