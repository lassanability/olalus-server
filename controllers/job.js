const Job = require('../models/job');
const Application = require('../models/application');

exports.getAll = async (req, res) => {
  try {
    const jobs = await Job.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, type, location, description, requirements, active } = req.body;
    const parsedReqs = typeof requirements === 'string' ? JSON.parse(requirements) : requirements || [];
    const job = await Job.create({ title, type, location, description, requirements: parsedReqs, active });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const { title, type, location, description, requirements, active } = req.body;
    if (title !== undefined) job.title = title;
    if (type !== undefined) job.type = type;
    if (location !== undefined) job.location = location;
    if (description !== undefined) job.description = description;
    if (active !== undefined) job.active = active === 'true' || active === true;
    if (requirements !== undefined) {
      job.requirements = typeof requirements === 'string' ? JSON.parse(requirements) : requirements;
    }

    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.apply = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, message } = req.body;
    if (!firstName || !lastName || !email || !position) {
      return res.status(400).json({ success: false, message: 'First name, last name, email and position are required' });
    }
    const application = await Application.create({ firstName, lastName, email, phone, position, message });
    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
