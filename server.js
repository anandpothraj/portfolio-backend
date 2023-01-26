const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: [config.get("frontend_url.production"), "http://localhost:3000"],
  })
);

app.use(express.json());

const db = config.get("mongoURI");

mongoose.set("strictQuery", false);
mongoose.connect(db, {useNewUrlParser: true})
  .then(() => {
    console.log(`MongoDB connected...`);
  })
  .catch((error) => {
    console.log(error);
  });

const port = process.env.PORT || 6678;

app.get("/", (req, res) => {
  res.status(200).send("Hello servers is running").end();
});

app.use("/api/contact", require("./api/contact"));

app.listen(port, () => {
  console.log(`Server started and listening onn port: ${port}`);
});