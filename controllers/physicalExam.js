const PhysicalExam = require('../models/physicalExam');

exports.submit = async (req, res) => {
  try {
    const {
      dateOfExam, employeeName, physicianName, physicianPhone, physicianAddress,
      contagiousDisease, contagiousDiseaseExplanation,
      freeOfCommunicableDisease,
      medicalIssues, medicalIssuesExplanation,
      canLift40Pounds, canLift40PoundsExplanation,
      tbTestGiven, tbTestNotGivenReason, tbTestResultsMm, tbTestResult,
      physicianSignature, physicianSignatureDate,
    } = req.body;

    if (!dateOfExam || !employeeName || !physicianName) {
      return res.status(400).json({
        success: false,
        message: 'Date of exam, employee name, and physician name are required',
      });
    }

    const exam = await PhysicalExam.create({
      dateOfExam, employeeName, physicianName, physicianPhone, physicianAddress,
      contagiousDisease, contagiousDiseaseExplanation,
      freeOfCommunicableDisease,
      medicalIssues, medicalIssuesExplanation,
      canLift40Pounds, canLift40PoundsExplanation,
      tbTestGiven, tbTestNotGivenReason, tbTestResultsMm, tbTestResult,
      physicianSignature, physicianSignatureDate,
    });

    res.status(201).json({ success: true, message: 'Physical examination record submitted', data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const exams = await PhysicalExam.find().sort({ createdAt: -1 });
    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const exam = await PhysicalExam.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
