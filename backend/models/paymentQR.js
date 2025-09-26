const mongoose = require("mongoose");

const paymentQRSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },       // Cloudinary secure URL
    public_id: { type: String, required: true }, // Cloudinary public_id
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentQR", paymentQRSchema);
