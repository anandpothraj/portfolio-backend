const express = require("express");
const config = require("config");
const cors = require("cors");
const app = express();

var allowedOrigins = [
  config.get("frontend_url.production"),
  "frontend_url.development","frontend_url.local"
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

const port = process.env.PORT || 6678;

app.get("/", (req, res) => {
  res.status(200).send("Hello server is running").end();
});

app.use("/api/contact", require("./api/contact"));

app.listen(port, () => {
  console.log(`Server started and listening onn port: ${port}`);
});