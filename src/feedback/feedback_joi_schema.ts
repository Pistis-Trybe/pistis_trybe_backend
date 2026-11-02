import Joi from "joi";

export const submitFeedbackSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Name is required",
    "string.max": "Name must be at most 100 characters",
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  message: Joi.string().trim().min(5).max(2000).required().messages({
    "string.empty": "Feedback is required",
    "string.min": "Feedback must be at least 5 characters",
    "string.max": "Feedback must be at most 2000 characters",
  }),
});
