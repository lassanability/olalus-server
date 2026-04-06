const mongoose = require("mongoose");

// ─── Sub-schemas ───────────────────────────────────────────────
const ActionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // Button text shown to user
    targetNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
    },
    style: {
      type: String,
      enum: ["primary", "secondary", "outline", "link"],
      default: "primary",
    },
    icon: { type: String, default: null }, // e.g. "📄", "🔍", "💬"
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ConditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // e.g. "userInput", "resumeUploaded", "intent"
    operator: {
      type: String,
      enum: ["equals", "contains", "matches", "exists", "gt", "lt"],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    targetNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      required: true,
    },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "file", "link", "map"],
      required: true,
    },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
  },
  { _id: false }
);

// ─── Main Node Schema ──────────────────────────────────────────
const NodeSchema = new mongoose.Schema(
  {
    // ── Identity ──
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ── Node Type ──
    type: {
      type: String,
      required: true,
      enum: [
        "greeting",       // Entry point / welcome message
        "message",        // Simple text response
        "question",       // Asks user a question (free text)
        "quick_reply",    // Presents quick-reply buttons
        "menu",           // Multi-option menu (like Humana's main nav)
        "resume_upload",  // Triggers resume paste/upload flow
        "job_match",      // Shows matched jobs from resume analysis
        "job_list",       // Browse all open positions
        "faq",            // FAQ answer node
        "form",           // Collects structured data (name, email, etc.)
        "handoff",        // Escalate to human recruiter
        "api_call",       // Trigger external API (job search, ATS, etc.)
        "conditional",    // Routes based on conditions
        "end",            // Conversation end / thank you
      ],
    },

    // ── Content ──
    content: {
      text: { type: String, default: "" },             // Main message text
      richText: { type: String, default: "" },          // HTML/Markdown version
      typingDelay: { type: Number, default: 800 },      // ms before showing
      attachments: [AttachmentSchema],
    },

    // ── Navigation / Flow ──
    actions: [ActionSchema],           // Quick reply buttons / menu items
    conditions: [ConditionSchema],     // Conditional routing rules
    fallbackNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
    },
    defaultNextNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
    },

    // ── Form Fields (for type: "form") ──
    formFields: [
      {
        fieldName: { type: String, required: true },
        fieldType: {
          type: String,
          enum: ["text", "email", "phone", "textarea", "select", "file"],
          default: "text",
        },
        label: { type: String, required: true },
        placeholder: { type: String, default: "" },
        required: { type: Boolean, default: false },
        options: [String],  // For select type
        validation: { type: String, default: null }, // regex pattern
      },
    ],

    // ── API Call Config (for type: "api_call") ──
    apiConfig: {
      endpoint: { type: String, default: null },
      method: {
        type: String,
        enum: ["GET", "POST", "PUT", "PATCH"],
        default: "POST",
      },
      headers: { type: mongoose.Schema.Types.Mixed, default: {} },
      bodyTemplate: { type: String, default: null },  // JSON template with {{variables}}
      responseMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // ── AI / Intent Config ──
    aiConfig: {
      enabled: { type: Boolean, default: false },
      systemPrompt: { type: String, default: null },
      intentKeywords: [String],              // Trigger words that route here
      temperature: { type: Number, default: 0.7 },
      maxTokens: { type: Number, default: 500 },
    },

    // ── Position (for visual flow editor) ──
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },

    // ── Organization ──
    tags: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: [
        "onboarding",
        "careers",
        "benefits",
        "support",
        "application",
        "general",
      ],
      default: "general",
    },

    // ── Status ──
    isActive: { type: Boolean, default: true },
    isEntryPoint: { type: Boolean, default: false }, // Only one should be true
    version: { type: Number, default: 1 },

    // ── Metadata ──
    analytics: {
      impressions: { type: Number, default: 0 },
      interactions: { type: Number, default: 0 },
      avgTimeSpent: { type: Number, default: 0 },   // ms
    },
    createdBy: { type: String, default: "system" },
    updatedBy: { type: String, default: "system" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────
NodeSchema.index({ type: 1, isActive: 1 });
NodeSchema.index({ "aiConfig.intentKeywords": 1 });
NodeSchema.index({ category: 1 });
NodeSchema.index({ isEntryPoint: 1, isActive: 1 });
NodeSchema.index({ tags: 1 });

// ─── Virtuals ──────────────────────────────────────────────────
NodeSchema.virtual("actionCount").get(function () {
  return this.actions ? this.actions.length : 0;
});

NodeSchema.virtual("hasConditions").get(function () {
  return this.conditions && this.conditions.length > 0;
});

// ─── Pre-save: auto-generate slug ──────────────────────────────
NodeSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// ─── Statics ───────────────────────────────────────────────────
NodeSchema.statics.findEntryPoint = function () {
  return this.findOne({ isEntryPoint: true, isActive: true });
};

NodeSchema.statics.findByIntent = function (userInput) {
  const words = userInput.toLowerCase().split(/\s+/);
  return this.find({
    "aiConfig.intentKeywords": { $in: words },
    isActive: true,
  });
};

NodeSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ createdAt: 1 });
};

NodeSchema.statics.getFlowGraph = async function () {
  const nodes = await this.find({ isActive: true })
    .select("name slug type position actions conditions defaultNextNodeId fallbackNodeId isEntryPoint")
    .lean();
  return nodes;
};

// ─── Instance Methods ──────────────────────────────────────────
NodeSchema.methods.recordImpression = function () {
  this.analytics.impressions += 1;
  return this.save();
};

NodeSchema.methods.recordInteraction = function (timeSpentMs = 0) {
  const { interactions, avgTimeSpent } = this.analytics;
  this.analytics.interactions += 1;
  if (timeSpentMs > 0) {
    this.analytics.avgTimeSpent =
      (avgTimeSpent * interactions + timeSpentMs) / (interactions + 1);
  }
  return this.save();
};

NodeSchema.methods.resolveNextNode = function (context = {}) {
  // Check conditions first
  for (const cond of this.conditions || []) {
    const fieldValue = context[cond.field];
    let match = false;
    switch (cond.operator) {
      case "equals":
        match = fieldValue === cond.value;
        break;
      case "contains":
        match =
          typeof fieldValue === "string" &&
          fieldValue.toLowerCase().includes(String(cond.value).toLowerCase());
        break;
      case "matches":
        match = new RegExp(cond.value, "i").test(fieldValue);
        break;
      case "exists":
        match = fieldValue != null && fieldValue !== "";
        break;
      case "gt":
        match = Number(fieldValue) > Number(cond.value);
        break;
      case "lt":
        match = Number(fieldValue) < Number(cond.value);
        break;
    }
    if (match) return cond.targetNodeId;
  }
  // Fall through to default
  return this.defaultNextNodeId || this.fallbackNodeId || null;
};

module.exports = mongoose.model("Node", NodeSchema);
