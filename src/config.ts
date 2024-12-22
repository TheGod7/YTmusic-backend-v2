import { config } from "dotenv";
config();

export const PORT = process.env.PORT || 3001;
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/MusicClone";
export const CLIENT_ID = process.env.CLIENT_ID || "";
export const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
