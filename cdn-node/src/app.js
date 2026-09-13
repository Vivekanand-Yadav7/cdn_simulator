const express = require("express");
const contentRoutes = require("./routes/contentRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.use(express.json());
app.use(express.text({ type: '*/*' }));

app.use("/content", contentRoutes);
app.use("/api/file", fileRoutes);

module.exports = app;