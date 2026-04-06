const Appointment = require('../models/appointment');

exports.submit = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, serviceType, dateTime, message, type } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required' });
    }
    const appointment = await Appointment.create({ firstName, lastName, email, phone, serviceType, dateTime, message, type });
    res.status(201).json({ success: true, message: 'Appointment submitted successfully', data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    const total = await Appointment.countDocuments();
    res.json({ success: true, data: appointments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, read: true },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
