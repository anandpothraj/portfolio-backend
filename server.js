const express = require("express");
const mongoose = require("mongoose");
const config = require("./config/default.json");
const cors = require("cors");
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "7mb"}));
app.use(bodyParser.urlencoded({limit: "7mb", extended: true, parameterLimit:7000}))

var allowedOrigins = [
  config.frontend_url.local,
  config.frontend_url.development,
  config.frontend_url.production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

const db = config.mongoURI;

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

app.use("/api/visits", require("./api/visits"));
app.use("/api/contact", require("./api/contact"));

app.listen(port, () => {
  console.log(`Server started and listening onn port: ${port}`);
});