const kollectS2sService = require("../services/kollect-s2s.service");

async function createPayment(req, res) {
  try {
    const invoiceDetails = req.body;
    const result = await kollectS2sService.createPayment(invoiceDetails);
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
  createPayment,
};

