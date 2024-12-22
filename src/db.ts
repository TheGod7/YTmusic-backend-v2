import * as mongoose from "mongoose";
import { MONGODB_URI } from "./config.js";

mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
});
