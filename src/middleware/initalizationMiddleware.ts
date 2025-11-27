import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { rateLimiter } from "./rateLimiter";
import cookieParser from "cookie-parser";

export const applyMiddleware = (app: express.Application) => {
  app.use(rateLimiter(200, 15));
  app.use(morgan("common"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
};
