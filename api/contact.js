const express = require("express");
const router = express.Router();
const config = require("../config/default.json");
var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.nodemailer.username,
    pass: config.nodemailer.password
  },
});

router.post("/sendMessage", (req, res) => {
  try {
    let reqBody = req.body;
    let requiredFields = [ "name", "email", "message" ];
    let invalidFields = [];

    requiredFields.forEach((field) => {
      if (!isFieldPresentInRequest(reqBody, field)) {
        invalidFields.push(field);
      }
    });

    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Error - Missing fields: ${invalidFields.join(", ")}`,
      });
    }

    const { name, email, message } = reqBody;

    var mailOptions = {
      from:'anandpothraj11052001@gmail.com',
      to:'pothrajanand@gmail.com',
      subject:`${name} want to contact you`,
      text:`${message}. You can contact me here ${email}`
    }
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("There was a problem while sending message: ", error);
        return res.status(500).json({
          message:"There was a problem while sending message. Please try again later.",
        });
      }
      else {
        res.status(201).json({
          message: "message sended successfully",
        });
      }
    });
  }
  catch (e) {
    console.log(`Error while send the message: ${e}`);
    return res.status(500).json({
      message:"There was a problem while sending the message. Please try again later.",
    });
  }
});

function isFieldPresentInRequest(reqBody, fieldName) {
  try {
    return (
      reqBody.hasOwnProperty(fieldName) &&
      reqBody[fieldName] !== null &&
      reqBody[fieldName] !== undefined &&
      reqBody[fieldName] !== ""
    );
  } 
  catch (e) {
    console.log(`There was a problem with send OTP: ${e}`);
    return false;
  }
}

module.exports = router;