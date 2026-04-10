const Policy = require('../models/policy');

const DEFAULTS = {
  privacy: {
    title: 'Privacy Policy',
    effectiveDate: 'January 1, 2024',
    content: '<p>Olalus Community Healthcare Services is committed to protecting the privacy and confidentiality of your personal and health information. As a licensed Pennsylvania Home Care Agency, we comply fully with HIPAA, the HITECH Act, and all applicable Pennsylvania state privacy laws.</p>',
  },
  'non-discrimination': {
    title: 'Non-Discrimination Policy',
    effectiveDate: 'January 1, 2024',
    content: '<p>Olalus Community Healthcare Services is committed to providing high-quality home healthcare services to all individuals without regard to race, color, national origin, age, disability, or sex. We comply with all applicable federal and state civil rights laws.</p>',
  },
};

exports.getAll = async (req, res) => {
  try {
    const policies = await Policy.find({});
    res.json({ success: true, data: policies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByKey = async (req, res) => {
  try {
    const { key } = req.params;
    let policy = await Policy.findOne({ key });
    if (!policy) {
      const def = DEFAULTS[key];
      if (!def) return res.status(404).json({ success: false, message: 'Policy not found' });
      policy = await Policy.create({ key, ...def });
    }
    res.json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upsert = async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content, effectiveDate } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { key },
      { title, content, effectiveDate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
