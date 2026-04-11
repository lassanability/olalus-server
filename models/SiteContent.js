const mongoose = require("mongoose");

const FAQItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const ServiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const SiteContentSchema = new mongoose.Schema(
  {
    _key: { type: String, default: "main", unique: true, immutable: true },

    company: {
      name: { type: String, default: "Olalus Community Health Care Services" },
      tagline: { type: String, default: "Devoted to Excellence care & Individual Services" },
      description: { type: String, default: "" },
      yearsExperience: { type: Number, default: 11 },
      totalCareTakers: { type: Number, default: 300 },
      mission: { type: String, default: "" },
      vision: [{ type: String }],
    },

    contact: {
      phone: { type: String, default: "610-237-7199" },
      fax: { type: String, default: "610-237-3488" },
      email: { type: String, default: "olalusnursing@aol.com" },
      address: {
        street: { type: String, default: "320 Macdade Blvd." },
        suite: { type: String, default: "Suite 103" },
        city: { type: String, default: "Collingdale" },
        state: { type: String, default: "PA" },
        zip: { type: String, default: "19023" },
      },
      workingHours: {
        days: { type: String, default: "Monday - Friday" },
        hours: { type: String, default: "8:30 Am - 4:30 Pm" },
      },
    },

    insuranceAccepted: [{ type: String }],
    services: [ServiceItemSchema],
    faqs: [FAQItemSchema],

    websitePages: {
      home:            { type: String, default: "https://olalusgroupllc.com" },
      bookAppointment: { type: String, default: "https://olalusgroupllc.com/#appointment" },
      hrApplication:   { type: String, default: "https://olalusgroupllc.com/career/apply" },
      careers:         { type: String, default: "https://olalusgroupllc.com/career" },
      services:        { type: String, default: "https://olalusgroupllc.com/services" },
      contact:         { type: String, default: "https://olalusgroupllc.com/about#contact" },
      about:           { type: String, default: "https://olalusgroupllc.com/about" },
      faq:             { type: String, default: "https://olalusgroupllc.com/faq" },
      blog:            { type: String, default: "https://olalusgroupllc.com/blog" },
      resources:       { type: String, default: "https://olalusgroupllc.com/resources" },
    },

    careerPage: {
      heading: { type: String, default: "Wanna be apart of the family?" },
      subtext: { type: String, default: "" },
      applicationFormEnabled: { type: Boolean, default: true },
      pdfDownloadUrl: { type: String, default: null },
    },

    waiverPrograms: [
      {
        name: { type: String },
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
      },
    ],

    resources: [
      {
        name: { type: String },
        description: { type: String },
        linkText: { type: String },
        url: { type: String },
      },
    ],

    lastUpdatedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

// ─── Get site content (single document pattern) ────────────────
SiteContentSchema.statics.getContent = async function () {
  let doc = await this.findOne({ _key: "main" }).lean();
  if (!doc) doc = await this.seed();
  return doc;
};

// ─── Build context object for the AI agent ─────────────────────
SiteContentSchema.statics.getAgentContext = async function () {
  const c = await this.getContent();
  return {
    company: c.company,
    contact: c.contact,
    insuranceAccepted: c.insuranceAccepted || [],
    services: (c.services || []).filter((s) => s.isActive),
    waiverPrograms: (c.waiverPrograms || []).filter((w) => w.isActive),
    faqs: (c.faqs || []).filter((f) => f.isActive),
    websitePages: c.websitePages || {},
    careerPage: c.careerPage,
    resources: c.resources || [],
  };
};

// ─── Seed with Olalus data from the Figma designs ──────────────
SiteContentSchema.statics.seed = async function () {
  const existing = await this.findOne({ _key: "main" });
  if (existing) return existing;

  return this.create({
    _key: "main",

    company: {
      name: "Olalus Community Health Care Services",
      tagline: "Devoted to Excellence care & Individual Services",
      description: "Olalus Community Health Care Services is an in-home care service provider dedicated to helping our clients lead dignified, independent lifestyles in the comfort and safety of their own homes.",
      yearsExperience: 11,
      totalCareTakers: 300,
      mission: "To provide the highest quality, client-centered, cost-effective home and community care solutions that promote independent living that enhance client's quality of life in the comfort and safety of their own homes.",
      vision: [
        "To be known and valued for providing the highest standard of in-home and community health care services.",
        "To be the provider of choice in the community.",
        "To be known as a business and company that embraces people with disabilities as equal partners and valued citizens.",
      ],
    },

    contact: {
      phone: "610-237-7199",
      fax: "610-237-3488",
      email: "olalusnursing@aol.com",
      address: { street: "320 Macdade Blvd.", suite: "Suite 103", city: "Collingdale", state: "PA", zip: "19023" },
      workingHours: { days: "Monday - Friday", hours: "8:30 Am - 4:30 Pm" },
    },

    insuranceAccepted: [
      "Medicare",
      "Personal Funds or Private Pay",
      "Worker's Compensation",
      "VA / Veterans Aid",
      "Selected Private Insurances (please call to verify)",
    ],

    services: [
      { name: "Personal Care Assistance", description: "Help with daily living activities including bathing, dressing, grooming, and mobility.", icon: "🛁", order: 1 },
      { name: "Dementia & Alzheimer's Care", description: "Specialized care for individuals living with memory-related conditions.", icon: "🧠", order: 2 },
      { name: "Companionship", description: "Social engagement, conversation, and emotional support to reduce isolation.", icon: "🤝", order: 3 },
      { name: "Meal Preparation", description: "Nutritious meal planning and preparation based on dietary needs.", icon: "🍽️", order: 4 },
      { name: "Light Housekeeping", description: "Maintaining a clean and safe home environment.", icon: "🏠", order: 5 },
      { name: "Transportation", description: "Safe transportation to medical appointments, errands, and community activities.", icon: "🚗", order: 6 },
      { name: "Therapy Support Services", description: "Assistance with physical, occupational, and speech therapy exercises.", icon: "💪", order: 7 },
      { name: "Medication Management", description: "Medication reminders, tracking, and coordination with healthcare providers.", icon: "💊", order: 8 },
    ],

    faqs: [
      { question: "Which Insurance Do You Accept?", answer: "We accept Medicare, Personal Funds or Private Pay, Worker's Compensation, VA / Veterans Aid, and Selected Private Insurances (please call to verify).", order: 1 },
      { question: "Do You Cover Emergency Situations?", answer: "While we primarily provide scheduled in-home care, we understand emergencies happen. For urgent care coordination needs, please call our main line immediately at 610-237-7199. For life-threatening emergencies, always call 911 first.", order: 2 },
      { question: "Are You Also In Charge Of Getting The Medications Needed?", answer: "Our caregivers can assist with medication reminders and management as part of your care plan. For specific medication procurement, we coordinate with your healthcare provider and pharmacy to ensure everything is handled smoothly.", order: 3 },
      { question: "What Services Do You Provide?", answer: "We provide comprehensive in-home care including personal care assistance, dementia and Alzheimer's care, companionship, meal preparation, light housekeeping, transportation, medication management, and therapy support services.", order: 4 },
      { question: "What Are Your Working Hours?", answer: "Our office is open Monday through Friday, 8:30 AM to 4:30 PM. However, our caregivers provide care services 24/7, including weekends and holidays, based on your individual care plan.", order: 5 },
    ],

    careerPage: {
      heading: "Wanna be apart of the family?",
      subtext: "We thank you for your interest in joining our staff. Olalus Community Healthcare Services is always in search of growth through people. To submit your application, please use the online form below.",
      applicationFormEnabled: true,
      pdfDownloadUrl: null,
    },

    websitePages: {
      home:            "https://olalusgroupllc.com",
      bookAppointment: "https://olalusgroupllc.com/#appointment",
      hrApplication:   "https://olalusgroupllc.com/career/apply",
      careers:         "https://olalusgroupllc.com/career",
      services:        "https://olalusgroupllc.com/services",
      contact:         "https://olalusgroupllc.com/about#contact",
      about:           "https://olalusgroupllc.com/about",
      faq:             "https://olalusgroupllc.com/faq",
      blog:            "https://olalusgroupllc.com/blog",
      resources:       "https://olalusgroupllc.com/resources",
    },

    resources: [
      { name: "Client Forms", description: "Download intake forms, consent documents, and service agreements for new and existing clients.", linkText: "Download forms →", url: "/resources/forms" },
      { name: "Service Guide", description: "Full overview of all services offered, eligibility requirements, and how to get started with care.", linkText: "View guide →", url: "/resources/guide" },
      { name: "Therapy Portal", description: "Check out our full documentation on our therapy portal features.", linkText: "View guide →", url: "/resources/therapy" },
    ],
  });
};

module.exports = mongoose.model("SiteContent", SiteContentSchema);
