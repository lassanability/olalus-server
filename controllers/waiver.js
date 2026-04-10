const Waiver = require('../models/waiver');
const WaiverSection = require('../models/WaiverSection');

exports.getSection = async (req, res) => {
  try {
    let section = await WaiverSection.findOne();
    if (!section) section = await WaiverSection.create({});
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    let section = await WaiverSection.findOne();
    if (!section) section = await WaiverSection.create({});
    const { heading, description, programs } = req.body;
    if (heading !== undefined) section.heading = heading;
    if (description !== undefined) section.description = description;
    if (programs !== undefined) section.programs = programs;
    await section.save();
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const waivers = await Waiver.find().sort({ createdAt: 1 });
    res.json({ success: true, data: waivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const waiver = await Waiver.findById(req.params.id);
    if (!waiver) return res.status(404).json({ success: false, message: 'Waiver not found' });
    res.json({ success: true, data: waiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description } = req.body;
    const waiver = await Waiver.create({ title, description });
    res.status(201).json({ success: true, data: waiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const waiver = await Waiver.findById(req.params.id);
    if (!waiver) return res.status(404).json({ success: false, message: 'Waiver not found' });

    const { title, description } = req.body;
    if (title !== undefined) waiver.title = title;
    if (description !== undefined) waiver.description = description;

    await waiver.save();
    res.json({ success: true, data: waiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const waiver = await Waiver.findByIdAndDelete(req.params.id);
    if (!waiver) return res.status(404).json({ success: false, message: 'Waiver not found' });
    res.json({ success: true, message: 'Waiver program deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
