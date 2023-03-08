const mongoose = require('mongoose');

const portfolioSchema = mongoose.Schema(
    {
        visitsCount: {
            type:Number,
            required:true,
            trim:true,
        }
    },
    {
        timestamps:true,
    }
);

const Portfolio = mongoose.model("portfolio", portfolioSchema);

module.exports = Portfolio;