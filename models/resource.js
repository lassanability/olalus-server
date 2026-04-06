const mongoose = require('mongoose');

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true, trim: true },
  description: { type: String },
  content: { type: String },
  link: { type: String, trim: true },
  pdfUrl: { type: String },
  type: {
    type: String,
    enum: ['client-form', 'service-guide', 'therapy-portal'],
    default: 'service-guide',
  },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

resourceSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    let base = slugify(this.title);
    let slug = base;
    let count = 1;
    while (await mongoose.model('Resource').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
