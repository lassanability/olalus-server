const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['full-time', 'part-time', 'contract'], default: 'full-time' },
  location: { type: String, trim: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
