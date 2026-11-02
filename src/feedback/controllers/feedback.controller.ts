import { Request, Response } from "express";
import { withControllerErrorHandling } from "../../middlewares/error_handlers";
import { getFeedbackAdminService, submitFeedbackService } from "../services/feedback.service";

export const submitFeedback = withControllerErrorHandling(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  const result = await submitFeedbackService({ userId: (req as any).user.userId, name, email, message });
  return res.status(result.statusCode).json(result);
});

export const getFeedbackAdmin = withControllerErrorHandling(async (req: Request, res: Response) => {
  const result = await getFeedbackAdminService({
    page: Number(req.query.page) || 1,
    limit: Math.min(Number(req.query.limit) || 20, 100),
  });
  return res.status(result.statusCode).json(result);
});
