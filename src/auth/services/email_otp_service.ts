import crypto from "crypto";
import config from "../../configurations";
import { createError } from "../../middlewares/error_handlers";
import { queueEmail } from "../../configurations/email-queue";
import { otpEmail } from "../../utilities/email_templates";
import { StatusCodes } from "../../utilities/status_codes";
import { EmailOtp } from "../email_otp.model";

// TEMPORARY: fixed OTP accepted for testing. Remove before release.
export const DEFAULT_TEST_OTP = "345678";

export const hashOtp = (userId: string, code: string) =>
  crypto.createHmac("sha256", config.APP_JWT_SECRET!).update(`${userId}:${code}`).digest("hex");

export const getResendWaitSeconds = async (userId: string): Promise<number> => {
  const existing = await EmailOtp.findOne({ userId }).select("lastSentAt").lean();
  if (!existing) return 0;
  const waitMs = existing.lastSentAt.getTime() + config.OTP_RESEND_COOLDOWN_SECONDS * 1000 - Date.now();
  return Math.max(0, Math.ceil(waitMs / 1000));
};

export const issueEmailOtp = async (user: { _id: any; email: string; fullName?: string | null }) => {
  const userId = String(user._id);

  const wait = await getResendWaitSeconds(userId);
  if (wait > 0) {
    throw createError(
      `Please wait ${wait}s before requesting another code.`,
      StatusCodes.TooManyRequests,
    );
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const now = new Date();

  await EmailOtp.findOneAndUpdate(
    { userId },
    {
      codeHash: hashOtp(userId, code),
      attempts: 0,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + config.OTP_TTL_MINUTES * 60 * 1000),
    },
    { upsert: true },
  );

  await queueEmail({
    to: user.email,
    toName: user.fullName || undefined,
    ...otpEmail(code, config.OTP_TTL_MINUTES),
  });

  return { resendAfterSeconds: config.OTP_RESEND_COOLDOWN_SECONDS };
};
