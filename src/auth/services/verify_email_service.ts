import crypto from "crypto";
import { createError, withServiceErrorHandling } from "../../middlewares/error_handlers";
import responseHandler from "../../middlewares/response_handler";
import { User } from "../../users/users.models";
import { generateToken } from "../../utilities/helper_functions";
import config from "../../configurations";
import { StatusCodes } from "../../utilities/status_codes";
import { EmailOtp } from "../email_otp.model";
import { DEFAULT_TEST_OTP, getResendWaitSeconds, hashOtp, issueEmailOtp } from "./email_otp_service";

const INVALID_CODE = "That code is incorrect or has expired.";

export const verifyEmailService = withServiceErrorHandling(
  async ({ email, otp }: { email: string; otp: string }) => {
    const user: any = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) throw createError(INVALID_CODE, StatusCodes.BadRequest);

    if (user.isVerified) {
      throw createError("This email is already verified. Please log in.", StatusCodes.BadRequest);
    }

    const isTestOtp = otp.trim() === DEFAULT_TEST_OTP;
    const record = await EmailOtp.findOne({ userId: user._id });

    if (!isTestOtp) {
      if (!record || record.expiresAt.getTime() < Date.now()) {
        throw createError(INVALID_CODE, StatusCodes.BadRequest);
      }

      if (record.attempts >= config.OTP_MAX_ATTEMPTS) {
        await EmailOtp.deleteOne({ _id: record._id });
        throw createError("Too many incorrect attempts. Please request a new code.", StatusCodes.TooManyRequests);
      }

      const expected = Buffer.from(record.codeHash);
      const received = Buffer.from(hashOtp(String(user._id), otp.trim()));
      const matches = expected.length === received.length && crypto.timingSafeEqual(expected, received);

      if (!matches) {
        record.attempts += 1;
        await record.save();
        throw createError(INVALID_CODE, StatusCodes.BadRequest);
      }
    }

    user.isVerified = true;
    const tokenData = { userId: user._id, email: user.email, role: user.role };
    const accessToken = generateToken(tokenData, config.ACCESS_TOKEN_EXPIRY);
    const refreshToken = generateToken(tokenData, config.REFRESH_TOKEN_EXPIRY);
    user.refreshToken = refreshToken;
    await user.save();
    await EmailOtp.deleteMany({ userId: user._id });

    return responseHandler("Email verified. Welcome to Pistis Trybe!", StatusCodes.OK, {
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        biography: user.biography,
        avatarUrl: user.avatarUrl,
        role: user.role,
        signupMethod: user.signupMethod,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
      },
    });
  },
);

export const resendOtpService = withServiceErrorHandling(async ({ email }: { email: string }) => {
  const user: any = await User.findOne({ email: email.trim().toLowerCase() });
  const eligible = user && !user.isVerified && user.signupMethod === "direct" && !user.isBlocked;

  if (!eligible) {
    return responseHandler(
      "If that account is awaiting verification, a new code has been sent.",
      StatusCodes.OK,
      { sent: true, resendAfterSeconds: config.OTP_RESEND_COOLDOWN_SECONDS },
    );
  }

  const wait = await getResendWaitSeconds(String(user._id));
  if (wait > 0) {
    return responseHandler(
      `Please wait ${wait}s before requesting another code.`,
      StatusCodes.OK,
      { sent: false, resendAfterSeconds: wait },
    );
  }

  const { resendAfterSeconds } = await issueEmailOtp(user);
  return responseHandler(
    "If that account is awaiting verification, a new code has been sent.",
    StatusCodes.OK,
    { sent: true, resendAfterSeconds },
  );
});
