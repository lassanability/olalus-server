const About = require('../models/about');
const storage = require('../config/storage');

const getImageUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${process.env.SEAWEED_S3_URL}/${process.env.SEAWEED_BUCKET}/${key}`;
};

exports.get = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = await About.create({});
    res.json({ success: true, data: about });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = new About();

    const { missionHeading, missionParagraphs, visionHeading, visionBullets, branches, communityAvatars, appointmentFeatures, imageField } = req.body;

    if (missionHeading !== undefined) about.missionHeading = missionHeading;
    if (missionParagraphs !== undefined) {
      about.missionParagraphs = Array.isArray(missionParagraphs)
        ? missionParagraphs
        : JSON.parse(missionParagraphs);
    }
    if (visionHeading !== undefined) about.visionHeading = visionHeading;
    if (visionBullets !== undefined) {
      about.visionBullets = Array.isArray(visionBullets)
        ? visionBullets
        : JSON.parse(visionBullets);
    }
    if (branches !== undefined) {
      about.branches = Array.isArray(branches) ? branches : JSON.parse(branches);
    }
    if (communityAvatars !== undefined) {
      about.communityAvatars = Array.isArray(communityAvatars) ? communityAvatars : JSON.parse(communityAvatars);
    }
    if (appointmentFeatures !== undefined) {
      about.appointmentFeatures = Array.isArray(appointmentFeatures) ? appointmentFeatures : JSON.parse(appointmentFeatures);
    }

    if (req.file && imageField) {
      const key = `about/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      await storage.uploadFile(req.file.buffer, key, req.file.mimetype);
      const url = getImageUrl(key);
      if (imageField === 'missionImage') about.missionImage = url;
      if (imageField === 'visionImage') about.visionImage = url;
      if (imageField === 'appointmentAvatar') about.appointmentAvatar = url;
    }

    await about.save();
    res.json({ success: true, data: about });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
