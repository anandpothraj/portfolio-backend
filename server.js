require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "7mb"}));
app.use(bodyParser.urlencoded({limit: "7mb", extended: true, parameterLimit:7000}))

var allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL,
  process.env.FRONTEND_URL_DEVELOPMENT,
  process.env.FRONTEND_URL_PRODUCTION,
  'http://localhost:3000',
].filter(Boolean);

function originAllowed(origin) {
  if (!origin) return true;
  var normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.some(function (allowed) {
    return allowed && (allowed === origin || allowed.replace(/\/$/, '') === normalized);
  })) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (originAllowed(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

const db = process.env.MONGO_URI;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    // useCreateIndex: true
  })
  .then(() => {
    console.log(`MongoDB connected...`);
  })
  .catch((error) => {
    console.log(error);
  });

const port = process.env.PORT || 6678;

app.get("/", (req, res) => {
  res.status(200).send("Hello server is running").end();
});

app.use("/api/chat", require("./api/chats"));
app.use("/api/visits", require("./api/visits"));
app.use("/api/contact", require("./api/contact"));
app.use("/api/projects", require("./api/projects"));
app.use("/api/testimonials", require("./api/testimonials"));
app.use("/api/kollect", require("./api/kollect"));
// app.use("/api/auth", require("./api/auth"));

app.listen(port, () => {
  console.log(`Server started and listening onn port: ${port}`);
});