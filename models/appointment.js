const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  serviceType: { type: String, trim: true },
  dateTime: { type: Date },
  message: { type: String, trim: true },
  type: { type: String, enum: ['consultation', 'appointment'], default: 'appointment' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
