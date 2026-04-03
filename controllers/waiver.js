const Waiver = require('../models/waiver');

exports.getAll = async (req, res) => {
  try {
    const waivers = await Waiver.find().sort({ order: 1, createdAt: 1 });
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
    const { title, description, icon, features, order } = req.body;
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || [];
    const waiver = await Waiver.create({ title, description, icon, features: parsedFeatures, order });
    res.status(201).json({ success: true, data: waiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const waiver = await Waiver.findById(req.params.id);
    if (!waiver) return res.status(404).json({ success: false, message: 'Waiver not found' });

    const { title, description, icon, features, order } = req.body;
    if (title !== undefined) waiver.title = title;
    if (description !== undefined) waiver.description = description;
    if (icon !== undefined) waiver.icon = icon;
    if (order !== undefined) waiver.order = Number(order);
    if (features !== undefined) {
      waiver.features = typeof features === 'string' ? JSON.parse(features) : features;
    }

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
