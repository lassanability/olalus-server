const Resource = require('../models/resource');

exports.getAll = async (req, res) => {
  try {
    const resources = await Resource.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, link, type, order, active } = req.body;
    const resource = await Resource.create({ title, description, link, type, order, active });
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const { title, description, link, type, order, active } = req.body;
    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (link !== undefined) resource.link = link;
    if (type !== undefined) resource.type = type;
    if (order !== undefined) resource.order = Number(order);
    if (active !== undefined) resource.active = active === 'true' || active === true;

    await resource.save();
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
