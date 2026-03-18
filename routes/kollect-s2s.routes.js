const express = require("express");
const kollectS2sController = require("../controllers/kollect-s2s.controller");

const router = express.Router();

// POST /api/kollect/s2s/create-payment
router.post("/create-payment", kollectS2sController.createPayment);

module.exports = router;