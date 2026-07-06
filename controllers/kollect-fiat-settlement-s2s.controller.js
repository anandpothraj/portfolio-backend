const kollectFiatSettlementS2sService = require("../services/kollect-fiat-settlement-s2s.service");

async function createFiatSettlement(req, res) {
  try {
    const fiatSettlementDetails = req.body;
    const result = await kollectFiatSettlementS2sService.createFiatSettlement(fiatSettlementDetails);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(err.status || 500).json({
      ok: false,
      message: err.message,
      data: err.data || null,
    });
  }
}

module.exports = {
  createFiatSettlement,
};
