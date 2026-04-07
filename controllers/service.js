const Service = require('../models/service');
const storage = require('../config/storage');

const getImageUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${process.env.SEAWEED_S3_URL}/${process.env.SEAWEED_BUCKET}/${key}`;
};

exports.getAll = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: 1 });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, icon, order, active } = req.body;
    let imageUrl = '';

    if (req.file) {
      const key = `services/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      await storage.uploadFile(req.file.buffer, key, req.file.mimetype);
      imageUrl = getImageUrl(key);
    }

    const service = await Service.create({ title, description, image: imageUrl, icon, order, active });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    const { title, description, icon, order, active } = req.body;
    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (icon !== undefined) service.icon = icon;
    if (order !== undefined) service.order = Number(order);
    if (active !== undefined) service.active = active === 'true' || active === true;

    if (req.file) {
      const key = `services/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      await storage.uploadFile(req.file.buffer, key, req.file.mimetype);
      service.image = getImageUrl(key);
    }

    await service.save();
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
