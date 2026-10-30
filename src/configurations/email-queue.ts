import Queue from "bull";
import config from ".";
import { sendMail, IMailPayload } from "../utilities/mailer";

const emailQueue = config.REDIS_URL ? new Queue<IMailPayload>("email queue", config.REDIS_URL) : null;

if (!emailQueue) {
  console.warn("REDIS_URL is not set: emails will be sent inline instead of through the queue.");
} else {
  emailQueue.process("sendEmail", async (job) => {
    await sendMail(job.data);
  });

  emailQueue.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  emailQueue.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed: ${err.message}`);
  });

  emailQueue.on("error", (err) => {
    console.error("Email queue error:", err.message);
  });
}

export const queueEmail = async (payload: IMailPayload): Promise<void> => {
  if (!emailQueue) {
    sendMail(payload).catch((error) => {
      console.error("Failed to send email:", error.message);
    });
    return;
  }

  emailQueue
    .add("sendEmail", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: true,
    })
    .catch((error) => {
      console.error("Failed to add email to queue:", error);
    });
};

export default { queueEmail };
