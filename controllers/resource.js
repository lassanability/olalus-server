const Resource = require('../models/resource');
const storage = require('../config/storage');

const getImageUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${process.env.SEAWEED_S3_URL}/${process.env.SEAWEED_BUCKET}/${key}`;
};

exports.getAll = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: 1 });
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

exports.getBySlug = async (req, res) => {
  try {
    const resource = await Resource.findOne({ slug: req.params.slug });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, content, link, type, order, active } = req.body;
    const resource = new Resource({ title, description, content, link, type, order, active });

    if (req.file) {
      const key = `resources/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      await storage.uploadFile(req.file.buffer, key, req.file.mimetype);
      resource.pdfUrl = getImageUrl(key);
    }

    await resource.save();
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const { title, description, content, link, type, order, active } = req.body;
    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (content !== undefined) resource.content = content;
    if (link !== undefined) resource.link = link;
    if (type !== undefined) resource.type = type;
    if (order !== undefined) resource.order = Number(order);
    if (active !== undefined) resource.active = active === 'true' || active === true;

    if (req.file) {
      const key = `resources/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      await storage.uploadFile(req.file.buffer, key, req.file.mimetype);
      resource.pdfUrl = getImageUrl(key);
    }

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
