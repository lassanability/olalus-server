const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
}, { _id: false });

const waiverSectionSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  description: { type: String, default: '' },
  programs: { type: [programSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('WaiverSection', waiverSectionSchema);
