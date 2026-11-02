import config from "../../configurations";
import { queueEmail } from "../../configurations/email-queue";
import { withServiceErrorHandling } from "../../middlewares/error_handlers";
import responseHandler from "../../middlewares/response_handler";
import { StatusCodes } from "../../utilities/status_codes";
import { feedbackEmail } from "../../utilities/email_templates";
import { Feedback } from "../feedback.model";

export const submitFeedbackService = withServiceErrorHandling(
  async ({ userId, name, email, message }: { userId: string; name: string; email: string; message: string }) => {
    const feedback = await Feedback.create({ userId, name, email, message });

    // Stored first; a failed notification email must never fail the submission.
    await queueEmail({ to: config.FEEDBACK_TO_EMAIL, ...feedbackEmail({ name, email, message }) });

    return responseHandler("Thank you for your feedback", StatusCodes.Created, { _id: feedback._id });
  },
);

export const getFeedbackAdminService = withServiceErrorHandling(
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number }) => {
    const skip = (page - 1) * limit;
    const [feedback, total] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "_id fullName email avatarUrl").lean(),
      Feedback.countDocuments(),
    ]);
    return responseHandler("Feedback fetched", StatusCodes.OK, {
      feedback,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  },
);
