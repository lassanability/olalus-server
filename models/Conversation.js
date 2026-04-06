const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["bot", "user"],
      required: true,
    },
    text: { type: String, default: "" },
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      default: null,
    },
    messages: [MessageSchema],

    // Visitor info collected during the conversation
    visitor: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      resumeText: { type: String, default: null },
      location: { type: String, default: null },
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
    },

    // Context bag — accumulates data as user moves through nodes
    context: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Matched jobs from resume analysis
    matchedJobs: [
      {
        jobId: String,
        title: String,
        matchScore: Number,
        department: String,
        location: String,
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "handed_off", "abandoned"],
      default: "active",
    },

    handoffDetails: {
      assignedTo: { type: String, default: null },
      handoffTime: { type: Date, default: null },
      notes: { type: String, default: null },
    },

    // Source tracking
    source: {
      page: { type: String, default: null },   // Which page the chat was opened on
      referrer: { type: String, default: null },
      utm: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────
ConversationSchema.index({ status: 1, lastActivityAt: -1 });
ConversationSchema.index({ "visitor.email": 1 });
ConversationSchema.index({ createdAt: -1 });

// ─── Virtuals ──────────────────────────────────────────────────
ConversationSchema.virtual("messageCount").get(function () {
  return this.messages ? this.messages.length : 0;
});

ConversationSchema.virtual("duration").get(function () {
  const end = this.endedAt || this.lastActivityAt || new Date();
  return end - this.startedAt;
});

// ─── Instance Methods ──────────────────────────────────────────
ConversationSchema.methods.addMessage = function (role, text, nodeId = null, metadata = {}) {
  this.messages.push({ role, text, nodeId, metadata });
  this.lastActivityAt = new Date();
  return this.save();
};

ConversationSchema.methods.setContext = function (key, value) {
  this.context[key] = value;
  this.markModified("context");
  return this.save();
};

ConversationSchema.methods.endConversation = function (status = "completed") {
  this.status = status;
  this.endedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Conversation", ConversationSchema);
