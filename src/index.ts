import { PORT } from "./config.js";
import express from "express";
import morgan from "morgan";
import cors from "cors";

import "./db.js";
const app = express();

//Route Manager
import RouteManager from "./route/routes.js";

//Manager
import YTManager from "./modules/YTManager.js";

await YTManager.SetAllAccounts();

// Import Routes
app.use("/api", RouteManager);

// Import Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
