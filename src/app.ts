import express, { NextFunction, Request, Response, Application } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import bodyParser from "body-parser";
import logger from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { globalErrorHandler } from "./middlewares/error_handlers";
import { pistisTribeRouterV1 } from "./routers";
import { generalAuthFunction } from "./middlewares/authorization";
import { health_check_html } from "./configurations/constants";
import swaggerRouter from "./configurations/swagger";
import config from "./configurations";
import { parseCorsOrigin } from "./configurations/env";

function createApp() {
  const app: Application = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  const corsOptions = {
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    origin: parseCorsOrigin(config.CORS_ORIGIN),
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Auth"],
    exposedHeaders: ["X-Refresh-Auth", "x-access-token", "verif-hash"],
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(logger("dev"));
  app.use(express.json());
  app.use(cookieParser());


  const globalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: config.RATE_LIMIT_GLOBAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "error", message: "Too many requests, please slow down." },
  });

  const authLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: config.RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "error", message: "Too many auth attempts. Please try again later." },
  });

  app.use(globalLimiter);
  app.use("/v1/auth/login", authLimiter);
  app.use("/v1/auth/register", authLimiter);
  app.use("/v1/auth/verify-email", authLimiter);
  app.use("/v1/auth/resend-otp", authLimiter);
  app.use("/v1/auth/forgot-password", authLimiter);
  app.use("/v1/auth/reset-password", authLimiter);
  app.get("/", (_request: Request, response: Response) => {
    response.send(health_check_html);
  });

  app.use("/v1/swagger", swaggerRouter);
  app.use("/v1", generalAuthFunction, pistisTribeRouterV1);

  app.use(globalErrorHandler);

  app.use((_error: Error, _request: Request, response: Response, _next: NextFunction) => {
    response.status(500).send("Something went wrong");
  });

  return app;
}

export default createApp;
