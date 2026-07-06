const express = require("express");
const kollectFiatSettlementS2sController = require("../controllers/kollect-fiat-settlement-s2s.controller");

const router = express.Router();

// POST /api/kollect/fiat-settlement/s2s/create-invoice
router.post("/create-invoice", kollectFiatSettlementS2sController.createFiatSettlement);

module.exports = router;
