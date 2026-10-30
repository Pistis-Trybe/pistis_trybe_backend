import crypto from "crypto";
import { withServiceErrorHandling } from "../../middlewares/error_handlers";
import responseHandler from "../../middlewares/response_handler";
import { User } from "../../users/users.models";
import { StatusCodes } from "../../utilities/status_codes";
import config from "../../configurations";
import { queueEmail } from "../../configurations/email-queue";
import { resetPasswordEmail } from "../../utilities/email_templates";

const forgotPasswordService = withServiceErrorHandling(
  async ({ email }: { email: string }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user: any = await User.findOne({ email: normalizedEmail });

    // Generic response — never reveal if email exists
    const genericMsg = "If an account with that email exists, a reset link has been sent.";

    if (!user || user.signupMethod === "google") {
      return responseHandler(genericMsg, StatusCodes.OK, null);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + config.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    await user.save();

    const clientUrl = String(config.CLIENT_URL).replace(/\/$/, "");
    const link = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await queueEmail({ to: user.email, toName: user.fullName || undefined, ...resetPasswordEmail(link, config.PASSWORD_RESET_TTL_MINUTES) });

    return responseHandler(genericMsg, StatusCodes.OK, null);
  }
);

export default forgotPasswordService;
