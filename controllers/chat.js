const { v4: uuidv4 } = require("uuid");
const Conversation = require("../models/Conversation");
const Job = require("../models/job");
const Blog = require("../models/blog");
const Resource = require("../models/resource");
const SiteContent = require("../models/SiteContent");
const About = require("../models/about");
const ai = require("../services/aiService");

/** Format Job documents for the chat agent / AI service */
function formatJobsForAgent(jobs) {
  return jobs.map((job) => ({
    jobId: job._id,
    title: job.title,
    department: job.type,
    location: job.location || "See description",
    type: job.type,
    setting: null,
    salary: null,
    isFeatured: false,
    description: job.description || "",
    matchKeywords: [],
    certifications: [],
    requirements: job.requirements || [],
  }));
}

exports.startChat = async (req, res) => {
  try {
    const siteContent = await SiteContent.getAgentContext();
    const companyName = siteContent.company.name;
    const sessionId = uuidv4();
    const greetingText = `Welcome to ${companyName}! 👋 I'm Olalus AI, your virtual assistant. I can help you explore career opportunities, learn about our in-home care services, book appointments, or answer any questions. How can I assist you today?`;

    await Conversation.create({
      sessionId,
      messages: [{ role: "bot", text: greetingText }],
      visitor: { ip: req.ip, userAgent: req.get("User-Agent") },
      source: { page: req.body.page || null, referrer: req.body.referrer || null, utm: req.body.utm || {} },
    });

    const activeJobs = formatJobsForAgent(await Job.find({ active: true }).lean());

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        greeting: greetingText,
        quickActions: [
          { label: "📄 Upload Resume", action: "resume" },
          { label: "💼 Open Positions", action: "jobs" },
          { label: "🏥 Our Services", action: "services" },
          { label: "📞 Contact Info", action: "contact" },
          { label: "❓ FAQs", action: "faq" },
        ],
        openPositionCount: activeJobs.length,
        aiEnabled: ai.isConfigured(),
      },
    });
  } catch (err) {
    console.error("startChat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: "sessionId and message required" });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    conversation.messages.push({ role: "user", text: message });
    conversation.lastActivityAt = new Date();

    const [siteContent, rawJobs, recentBlogs, activeResources, aboutContent] = await Promise.all([
      SiteContent.getAgentContext(),
      Job.find({ active: true }).lean(),
      Blog.find({ published: true }).sort({ publishedAt: -1 }).limit(8).select("title category author publishedAt readTime _id").lean(),
      Resource.find({ active: true }).sort({ createdAt: 1 }).select("title description type url").lean(),
      About.findOne().lean(),
    ]);
    const activeJobs = formatJobsForAgent(rawJobs);

    let botResponse;
    if (ai.isConfigured()) {
      const result = await ai.generateResponse(message, conversation.messages.slice(-20), siteContent, activeJobs, recentBlogs, activeResources, aboutContent);
      botResponse = result.text;
    } else {
      botResponse = ai.smartFallback(message, siteContent, activeJobs);
    }

    conversation.messages.push({ role: "bot", text: botResponse });
    await conversation.save();

    res.json({
      success: true,
      data: {
        sessionId,
        response: botResponse,
        intent: ai.detectIntent(message),
        aiEnabled: ai.isConfigured(),
      },
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.submitResume = async (req, res) => {
  try {
    const { sessionId, resumeText } = req.body;
    if (!sessionId || !resumeText) {
      return res.status(400).json({ success: false, error: "sessionId and resumeText required" });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    const wordCount = resumeText.split(/\s+/).length;
    conversation.messages.push({ role: "user", text: `[Resume submitted — ${wordCount} words]` });
    conversation.visitor.resumeText = resumeText;
    conversation.lastActivityAt = new Date();

    const [siteContent, rawJobsForResume] = await Promise.all([
      SiteContent.getAgentContext(),
      Job.find({ active: true }).lean(),
    ]);
    const activeJobs = formatJobsForAgent(rawJobsForResume);

    let result;
    if (ai.isConfigured()) {
      result = await ai.matchResume(resumeText, activeJobs, siteContent);
    } else {
      result = ai.keywordMatch(resumeText, activeJobs, siteContent);
    }

    conversation.matchedJobs = result.matchedJobs;
    conversation.messages.push({ role: "bot", text: result.text });
    await conversation.save();

    res.json({
      success: true,
      data: { sessionId, response: result.text, matchedJobs: result.matchedJobs, aiEnabled: ai.isConfigured() },
    });
  } catch (err) {
    console.error("submitResume error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getChat = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getJobs = async (_req, res) => {
  try {
    const jobs = formatJobsForAgent(await Job.find({ active: true }).lean());
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.seedAll = async (req, res) => {
  try {
    await SiteContent.seed();
    const jobCount = await Job.countDocuments({ active: true });
    const content = await SiteContent.getContent();

    res.status(201).json({
      success: true,
      message: "Database seeded successfully",
      data: {
        company: content.company.name,
        jobs: jobCount,
        faqs: content.faqs.length,
        services: content.services.length,
        aiEnabled: ai.isConfigured(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.healthCheck = async (_req, res) => {
  const jobCount = await Job.countDocuments({ active: true });
  const contentExists = !!(await SiteContent.findOne({ _key: "main" }));
  const budget = await ai.getBudgetStatus();

  res.json({
    status: "ok",
    agent: "Olalus AI",
    version: "2.0.0",
    aiStatus: ai.isConfigured() ? "active" : "no_api_key",
    budget: {
      spent: `$${budget.spent.toFixed(4)}`,
      limit: `$${budget.limit.toFixed(2)}`,
      remaining: `$${budget.remaining.toFixed(4)}`,
      percentUsed: `${budget.percentUsed}%`,
      overBudget: budget.overBudget,
      calls: budget.calls,
      tokens: budget.tokens,
      month: budget.month,
    },
    data: { jobsLoaded: jobCount, siteContentLoaded: contentExists },
    timestamp: new Date().toISOString(),
  });
};
