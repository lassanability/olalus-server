const mongoose = require('mongoose');

const physicalExamSchema = new mongoose.Schema({
  dateOfExam: { type: String, required: true },
  employeeName: { type: String, required: true, trim: true },

  // Physician info
  physicianName: { type: String, required: true, trim: true },
  physicianPhone: { type: String, trim: true },
  physicianAddress: { type: String, trim: true },

  // Physician assessment questions
  contagiousDisease: { type: String, enum: ['yes', 'no', ''] },
  contagiousDiseaseExplanation: { type: String },
  freeOfCommunicableDisease: { type: String, enum: ['yes', 'no', ''] },
  medicalIssues: { type: String, enum: ['yes', 'no', ''] },
  medicalIssuesExplanation: { type: String },
  canLift40Pounds: { type: String, enum: ['yes', 'no', ''] },
  canLift40PoundsExplanation: { type: String },

  // TB test
  tbTestGiven: { type: String, enum: ['yes', 'no', ''] },
  tbTestNotGivenReason: { type: String },
  tbTestResultsMm: { type: String },
  tbTestResult: { type: String, enum: ['positive', 'negative', ''] },

  // Physician signature
  physicianSignature: { type: String, trim: true },
  physicianSignatureDate: { type: String },

  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PhysicalExam', physicalExamSchema);
