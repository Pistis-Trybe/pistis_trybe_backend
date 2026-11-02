import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";
import { inputValidator } from "../utilities/helper_functions";
import { getFeedbackAdmin, submitFeedback } from "./controllers/feedback.controller";
import { submitFeedbackSchema } from "./feedback_joi_schema";

const feedbackRouter = Router();

feedbackRouter.post("/feedback", inputValidator(submitFeedbackSchema), submitFeedback);
feedbackRouter.get("/admin/feedback", requireAdmin, getFeedbackAdmin);

export default feedbackRouter;
