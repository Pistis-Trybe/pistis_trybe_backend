import { Schema, model, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

FeedbackSchema.index({ createdAt: -1 });

export const Feedback = model<IFeedback>("Feedback", FeedbackSchema);
