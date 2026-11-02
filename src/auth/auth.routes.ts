import { Router } from "express";
import registerUserController from "./controllers/register_user_controller";
import loginUserController from "./controllers/login_user_controller";
import changePasswordController from "./controllers/change_password_controller";
import googleAuthController from "./controllers/google_auth_controller";
import forgotPasswordController from "./controllers/forgot_password_controller";
import resetPasswordController from "./controllers/reset_password_controller";
import { verifyRecaptcha } from "../middlewares/recaptcha";
import { inputValidator } from "../utilities/helper_functions";
import { verifyEmailController, resendOtpController } from "./controllers/verify_email_controller";
import { loginUserSchema, userRegisterSchemaViaEmail, verifyEmailSchema, resendOtpSchema } from "./auth_joi_schema";

const authV1Router = Router();

authV1Router.post("/auth/register", verifyRecaptcha, inputValidator(userRegisterSchemaViaEmail), registerUserController);
authV1Router.post("/auth/verify-email", inputValidator(verifyEmailSchema), verifyEmailController);
authV1Router.post("/auth/resend-otp", inputValidator(resendOtpSchema), resendOtpController);
authV1Router.post("/auth/login", verifyRecaptcha, inputValidator(loginUserSchema), loginUserController);
authV1Router.post("/auth/google", googleAuthController);
authV1Router.post("/auth/change-password", changePasswordController);

// FIX: Forgot / reset password endpoints
authV1Router.post("/auth/forgot-password", verifyRecaptcha, forgotPasswordController);
authV1Router.post("/auth/reset-password", resetPasswordController);

export default authV1Router;
