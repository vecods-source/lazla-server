// import "./types/express";
// import express from "express";
// import dotenv from "dotenv";
// import { applyMiddleware } from "./middleware/initalizationMiddleware";
// import { connectDB } from "./db/pool";

// // route imports
// import Auth from "./routes/authRoutes";

// // configuration
// dotenv.config();
// connectDB();
// const app = express();
// applyMiddleware(app);

// //routes
// app.use("/api/auth/customer", Auth);
// app.get("/", (_req, res) => {
//   res.status(200).json({ response: "auth server is ON" });
// });

// /* SERVER */
// const port = Number(process.env.AUTHPORT) || 8000;
// app.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on port ${port}`);
// });
