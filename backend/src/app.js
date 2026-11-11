const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/akun", require("./routes/akunRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/materi", require("./routes/materiRoutes"));

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: `Endpoint ${req.method} ${req.originalUrl} tidak ada.` });
});

app.use((err, req, res, next) => {
  console.error("[errorHandler]", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

module.exports = app;