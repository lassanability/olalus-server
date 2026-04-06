const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    // ── Core Fields (match the career page Figma) ──
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Full-time",
        "Part-time",
        "Full-time & part-time",
        "Full-time & PRN",
        "PRN",
        "Contract",
        "Temporary",
      ],
      default: "Full-time",
    },
    setting: {
      type: String,
      enum: [
        "In-home settings",
        "Community & residential",
        "Community programs",
        "Office",
        "Multiple locations",
        "Remote",
        "Hybrid",
      ],
      default: "In-home settings",
    },

    // ── Description & Requirements ──
    description: { type: String, default: "" },
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    certifications: [{ type: String }],       // e.g. "CNA", "RN License", "CPR"
    experienceRequired: { type: String, default: "" },  // e.g. "1-2 years"

    // ── Compensation (optional, shown if provided) ──
    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      period: {
        type: String,
        enum: ["hourly", "weekly", "biweekly", "monthly", "annually"],
        default: "hourly",
      },
      display: { type: String, default: null },  // e.g. "$15-$18/hr" — shown to users
    },

    // ── AI Matching Keywords ──
    // The agent uses these to score resume matches
    matchKeywords: [{ type: String, lowercase: true, trim: true }],

    // ── Status ──
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    // ── Tracking ──
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },

    // ── Admin ──
    createdBy: { type: String, default: "admin" },
    updatedBy: { type: String, default: "admin" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────
JobSchema.index({ isActive: 1, publishedAt: -1 });
JobSchema.index({ department: 1, isActive: 1 });
JobSchema.index({ matchKeywords: 1 });
JobSchema.index({ isFeatured: 1, isActive: 1 });

// ─── Pre-validate: auto-generate slug ──────────────────────────
JobSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// ─── Virtuals ──────────────────────────────────────────────────
JobSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

JobSchema.virtual("postedAgo").get(function () {
  const diff = Date.now() - this.publishedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month(s) ago`;
});

// ─── Statics ───────────────────────────────────────────────────

/** Get all active, non-expired jobs */
JobSchema.statics.getActiveJobs = function () {
  return this.find({
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ isFeatured: -1, publishedAt: -1 });
};

/** Get active jobs formatted for the chat agent */
JobSchema.statics.getJobsForAgent = async function () {
  const jobs = await this.getActiveJobs().lean();
  return jobs.map((job) => ({
    jobId: job._id,
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    setting: job.setting,
    postedAgo: getPostedAgo(job.publishedAt),
    salary: job.salary?.display || null,
    isFeatured: job.isFeatured,
  }));
};

/** Match jobs against resume text, scored by keyword overlap */
JobSchema.statics.matchResumeToJobs = async function (resumeText) {
  const jobs = await this.getActiveJobs().lean();
  const lower = resumeText.toLowerCase();
  const resumeWords = new Set(lower.split(/\s+/));

  const scored = jobs.map((job) => {
    let score = 40; // base score

    // Keyword matching
    (job.matchKeywords || []).forEach((kw) => {
      if (lower.includes(kw)) score += 8;
    });

    // Title word matching
    job.title.toLowerCase().split(/\s+/).forEach((w) => {
      if (resumeWords.has(w) && w.length > 3) score += 5;
    });

    // Department matching
    if (lower.includes(job.department.toLowerCase())) score += 6;

    // Certification matching
    (job.certifications || []).forEach((cert) => {
      if (lower.includes(cert.toLowerCase())) score += 10;
    });

    return {
      jobId: job._id,
      title: job.title,
      matchScore: Math.min(98, score),
      department: job.department,
      location: job.location,
      type: job.type,
      setting: job.setting,
      postedAgo: getPostedAgo(job.publishedAt),
      salary: job.salary?.display || null,
    };
  });

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);  // Top 10 matches
};

/** Seed the initial Olalus jobs from the career page */
JobSchema.statics.seedJobs = async function () {
  const count = await this.countDocuments();
  if (count > 0) return;

  await this.insertMany([
    {
      title: "Direct Support Professional (DSP)",
      department: "Care Services",
      location: "Multiple locations",
      type: "Full-time & part-time",
      setting: "Multiple locations",
      description: "Provide direct care and support to individuals with disabilities in community and residential settings.",
      responsibilities: [
        "Assist individuals with daily living activities",
        "Implement individualized support plans",
        "Document progress and incidents",
        "Transport clients to appointments and community activities",
        "Promote independence and community integration",
      ],
      qualifications: [
        "High school diploma or GED",
        "Valid driver's license",
        "Ability to pass background check",
        "Experience with individuals with disabilities preferred",
      ],
      certifications: ["CPR", "First Aid"],
      matchKeywords: [
        "support", "care", "disability", "community", "residential",
        "direct", "dsp", "behavioral", "mental health", "developmental",
        "aide", "assistant", "caregiver",
      ],
      isFeatured: true,
    },
    {
      title: "Registered Nurse (RN)",
      department: "Clinical",
      location: "Community & residential",
      type: "Full-time",
      setting: "Community & residential",
      description: "Provide skilled nursing care in community and residential settings for clients with complex medical needs.",
      responsibilities: [
        "Perform health assessments and develop care plans",
        "Administer medications and treatments",
        "Supervise CNAs and home health aides",
        "Coordinate with physicians and specialists",
        "Maintain accurate medical documentation",
      ],
      qualifications: [
        "Active RN license in Pennsylvania",
        "BSN preferred",
        "2+ years clinical experience",
        "Home health experience preferred",
      ],
      certifications: ["RN License", "BSN", "CPR", "BLS"],
      matchKeywords: [
        "nurse", "nursing", "rn", "clinical", "medical", "healthcare",
        "patient", "assessment", "medication", "bsn", "lpn",
        "home health", "skilled nursing",
      ],
      isFeatured: true,
    },
    {
      title: "Community Integration Specialist",
      department: "Community Programs",
      location: "Delaware County, PA",
      type: "Part-time",
      setting: "Community programs",
      description: "Support individuals in developing skills for community participation and social integration.",
      responsibilities: [
        "Facilitate community-based activities",
        "Develop individualized integration goals",
        "Build relationships with community partners",
        "Document participant progress",
      ],
      qualifications: [
        "Bachelor's degree in human services or related field preferred",
        "Experience in community-based programs",
        "Strong communication and organizational skills",
      ],
      matchKeywords: [
        "community", "integration", "social", "program", "outreach",
        "engagement", "development", "coordinator", "human services",
      ],
    },
    {
      title: "Home Health Aide",
      department: "In-Home Care",
      location: "Philadelphia & Delaware County, PA",
      type: "Full-time & PRN",
      setting: "In-home settings",
      description: "Provide personal care assistance in clients' homes including ADLs, meal prep, light housekeeping, and companionship.",
      responsibilities: [
        "Assist with bathing, dressing, grooming, and toileting",
        "Prepare nutritious meals per dietary requirements",
        "Perform light housekeeping duties",
        "Provide companionship and emotional support",
        "Monitor and report changes in client condition",
      ],
      qualifications: [
        "HHA certification or CNA license",
        "Valid driver's license and reliable transportation",
        "Ability to lift up to 50 lbs",
        "Compassionate and patient demeanor",
      ],
      certifications: ["HHA", "CNA", "CPR"],
      matchKeywords: [
        "home health", "aide", "hha", "personal care", "adl",
        "caregiver", "companion", "homecare", "home care", "cna",
        "bathing", "grooming", "meal prep",
      ],
      isFeatured: true,
    },
    {
      title: "Care Coordinator",
      department: "Operations",
      location: "Collingdale, PA (Office)",
      type: "Full-time",
      setting: "Office",
      description: "Coordinate client care plans, schedule caregivers, and serve as liaison between clients, families, and care staff.",
      responsibilities: [
        "Schedule and coordinate caregiver assignments",
        "Communicate with clients and families about care plans",
        "Handle intake assessments and service authorizations",
        "Ensure compliance with regulatory requirements",
        "Manage caregiver timesheets and documentation",
      ],
      qualifications: [
        "Associate's or Bachelor's degree preferred",
        "Experience in healthcare coordination or scheduling",
        "Proficiency in office software and scheduling systems",
        "Excellent organizational and communication skills",
      ],
      matchKeywords: [
        "coordinator", "scheduling", "admin", "operations", "planning",
        "management", "liaison", "organize", "intake", "authorization",
      ],
    },
    {
      title: "Physical Therapy Aide",
      department: "Therapy Services",
      location: "Delaware County, PA",
      type: "Part-time",
      setting: "In-home settings",
      description: "Assist physical therapists with patient exercises, equipment setup, and therapy session support.",
      responsibilities: [
        "Prepare therapy areas and equipment",
        "Assist patients with prescribed exercises under PT supervision",
        "Maintain therapy equipment and supplies",
        "Document session observations",
      ],
      qualifications: [
        "High school diploma required",
        "Interest in physical therapy or rehabilitation",
        "Ability to assist with physical activities",
      ],
      certifications: ["CPR"],
      matchKeywords: [
        "therapy", "physical", "rehabilitation", "exercise", "pt",
        "rehab", "therapist", "aide", "kinesiology",
      ],
    },
  ]);
};

// Helper
function getPostedAgo(date) {
  const diff = Date.now() - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

module.exports = mongoose.model("AgentJob", JobSchema);
