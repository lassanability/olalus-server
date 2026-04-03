const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  link: { type: String, trim: true },
  type: {
    type: String,
    enum: ['client-form', 'service-guide', 'therapy-portal'],
    default: 'service-guide',
  },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
