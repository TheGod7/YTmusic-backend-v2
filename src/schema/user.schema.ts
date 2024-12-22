import mongoose, { Document, Schema } from "mongoose";

interface ISession extends Document {
  refresh_token: string;
  access_token: string;
  expiry_date: Number;
  lastAccessed: Date;
  visitor_data: string;
  po_token: string;
}

const sessionSchema = new Schema<ISession>({
  refresh_token: {
    type: String,
    required: true,
  },
  access_token: {
    type: String,
    required: true,
  },
  expiry_date: {
    type: Number,
    required: true,
  },
  lastAccessed: {
    type: Date,
    required: true,
    default: Date.now,
  },
  visitor_data: {
    type: String,
    required: true,
  },
  po_token: {
    type: String,
    required: true,
  },
});

sessionSchema.post("findOne", (doc: ISession | null) => {
  if (doc) {
    doc.lastAccessed = new Date();
    doc.save();
  }
});

const Session = mongoose.model<ISession>("Session", sessionSchema);

export default Session;
