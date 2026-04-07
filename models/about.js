const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
}, { _id: false });

const aboutSchema = new mongoose.Schema({
  missionHeading: { type: String, default: 'Our Goal For You' },
  missionParagraphs: { type: [String], default: [] },
  missionImage: { type: String, default: '' },
  visionHeading: { type: String, default: 'Our Vision' },
  visionBullets: { type: [String], default: [] },
  visionImage: { type: String, default: '' },
  branches: { type: [branchSchema], default: [] },
  appointmentAvatar: { type: String, default: '' },
  appointmentFeatures: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
