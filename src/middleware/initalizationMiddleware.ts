import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

export const applyMiddleware = (app: express.Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  app.use(morgan("common"));
};
