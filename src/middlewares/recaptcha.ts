import { NextFunction, Request, Response } from "express";
import config from "../configurations";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const reject = (res: Response, status: number, message: string) =>
  res.status(status).json({ status: "error", message });

// Expects the client token in `recaptchaToken` (body) or the `x-recaptcha-token` header.
// Works for both reCAPTCHA v2 and v3 (v3 responses also carry a score).
export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const secret = config.RECAPTCHA_SECRET_KEY;
  const bodyToken = req.body?.recaptchaToken;
  const token = bodyToken ?? req.headers["x-recaptcha-token"];

  // Remove it so strict body validation downstream doesn't reject the extra field.
  if (req.body && "recaptchaToken" in req.body) delete req.body.recaptchaToken;

  if (!secret) {
    if (config.stage === "production") {
      console.error("RECAPTCHA_SECRET_KEY is not set: rejecting request.");
      return reject(res, 503, "Captcha verification is unavailable. Please try again later.");
    }
    console.warn("RECAPTCHA_SECRET_KEY is not set: skipping captcha check in development.");
    return next();
  }

  if (typeof token !== "string" || !token.trim()) {
    return reject(res, 400, "Captcha verification is required.");
  }

  try {
    const params = new URLSearchParams({ secret, response: token.trim() });
    if (req.ip) params.set("remoteip", req.ip);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: AbortSignal.timeout(5000),
    });
    const result: any = await response.json();

    const lowScore = typeof result.score === "number" && result.score < config.RECAPTCHA_MIN_SCORE;
    if (!result.success || lowScore) {
      return reject(res, 400, "Captcha verification failed. Please try again.");
    }
    return next();
  } catch (error: any) {
    console.error("reCAPTCHA verification error:", error.message);
    return reject(res, 503, "Captcha verification is unavailable. Please try again later.");
  }
};
