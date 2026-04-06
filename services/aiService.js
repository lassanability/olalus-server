/**
 * AI SERVICE — The Brain of the Olalus Career Agent
 *
 * Uses Google Gemini 1.5 Flash (free tier: 1,500 req/day, 1M tokens/min)
 * Paid tier: $0.075/1M input, $0.30/1M output tokens
 * Budget tracking with alerts — AI never cuts off due to spend.
 * Fallback only fires on real API failures (outage, network, rate limit).
 *
 * ENV:
 *   GEMINI_API_KEY       — from Google AI Studio (aistudio.google.com)
 *   AI_MODEL             — default: gemini-1.5-flash
 *   AI_MONTHLY_BUDGET    — alert threshold in dollars (default: 20)
 *   USAGE_ALERT_WEBHOOK  — optional URL to POST usage alerts to
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  totalSpent: { type: Number, default: 0 },
  totalCalls: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  alertsFired: { type: [Number], default: [] }, // thresholds already notified this month
});
const Budget = mongoose.model("AIBudget", BudgetSchema);

const CONFIG = {
  model: process.env.AI_MODEL || "gemini-2.5-flash",
  monthlyBudget: parseFloat(process.env.AI_MONTHLY_BUDGET) || 20,
  maxTokens: 500,
  pricing: {
    "gemini-2.5-flash": { input: 0.15,  output: 0.60 },
    "gemini-2.5-pro":   { input: 1.25,  output: 10.00 },
  },
  alertThresholds: [50, 80, 100, 110, 120, 130, 140, 150], // percentages
};

let client = null;
function getClient() {
  if (!client && process.env.GEMINI_API_KEY) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getBudgetStatus() {
  const month = getCurrentMonth();
  let b = await Budget.findOne({ month });
  if (!b) b = await Budget.create({ month });
  const pct = CONFIG.monthlyBudget > 0 ? (b.totalSpent / CONFIG.monthlyBudget) * 100 : 0;
  return {
    month,
    spent: b.totalSpent,
    limit: CONFIG.monthlyBudget,
    remaining: Math.max(0, CONFIG.monthlyBudget - b.totalSpent),
    calls: b.totalCalls,
    tokens: b.totalTokens,
    percentUsed: Math.round(pct),
    overBudget: b.totalSpent > CONFIG.monthlyBudget,
  };
}

async function recordUsage(inputTok, outputTok) {
  const rates = CONFIG.pricing[CONFIG.model] || CONFIG.pricing["gpt-4o-mini"];
  const cost = (inputTok * rates.input + outputTok * rates.output) / 1_000_000;
  const month = getCurrentMonth();

  const updated = await Budget.findOneAndUpdate(
    { month },
    { $inc: { totalSpent: cost, totalCalls: 1, totalTokens: inputTok + outputTok } },
    { upsert: true, new: true }
  );

  await checkAndAlert(updated);
  return cost;
}

async function checkAndAlert(budget) {
  const pct = CONFIG.monthlyBudget > 0
    ? (budget.totalSpent / CONFIG.monthlyBudget) * 100
    : 0;

  for (const threshold of CONFIG.alertThresholds) {
    if (pct >= threshold && !(budget.alertsFired || []).includes(threshold)) {
      const label = threshold <= 100
        ? `⚠️  AI Usage Alert — ${threshold}% of monthly budget reached`
        : `🚨  AI Usage Alert — ${threshold}% of monthly budget (OVER BUDGET)`;

      const detail = [
        label,
        `Month:   ${budget.month}`,
        `Spent:   $${budget.totalSpent.toFixed(4)}  /  $${CONFIG.monthlyBudget.toFixed(2)} limit`,
        `Calls:   ${budget.totalCalls}`,
        `Tokens:  ${budget.totalTokens.toLocaleString()}`,
        `Note:    AI continues running — this is a spend alert, not a cutoff.`,
      ].join("\n");

      console.warn("\n" + "=".repeat(60));
      console.warn(detail);
      console.warn("=".repeat(60) + "\n");

      // Optional webhook alert
      if (process.env.USAGE_ALERT_WEBHOOK) {
        try {
          const https = require("https");
          const http  = require("http");
          const url   = new URL(process.env.USAGE_ALERT_WEBHOOK);
          const body  = JSON.stringify({
            alert: label,
            month: budget.month,
            spent: budget.totalSpent,
            limit: CONFIG.monthlyBudget,
            percentUsed: Math.round(pct),
            calls: budget.totalCalls,
            tokens: budget.totalTokens,
          });
          const req = (url.protocol === "https:" ? https : http).request({
            hostname: url.hostname, port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search, method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
          });
          req.write(body);
          req.end();
        } catch (e) {
          console.error("Usage alert webhook failed:", e.message);
        }
      }

      // Mark this threshold as fired so we don't spam
      await Budget.updateOne(
        { month: budget.month },
        { $addToSet: { alertsFired: threshold } }
      );
    }
  }
}

function buildSystemPrompt(site, jobs) {
  const { company, contact, insuranceAccepted, services, faqs } = site;
  const a = contact.address;
  const addr = `${a.street}, ${a.suite}, ${a.city}, ${a.state} ${a.zip}`;
  const jobList = jobs.map((j, i) => `${i+1}. ${j.title} - ${j.type} | ${j.location}`).join("\n") || "None currently.";
  const svcList = services.map(s => `- ${s.name}: ${s.description}`).join("\n");
  const faqList = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  return `YOU ARE: Olalus AI — the official virtual assistant for ${company.name}.
You are NOT ChatGPT, not Google, not a generic AI. You are Olalus AI, period.
If asked who or what you are: "I'm Olalus AI, the virtual assistant for ${company.name}, here to help with our services, careers, and general inquiries."
NEVER mention OpenAI, Google, Gemini, ChatGPT, or any underlying technology.

YOUR PERSONALITY:
- Warm, caring, professional. You represent a healthcare company that values dignity and compassion.
- Use "we" and "our" — you are part of the team.
- Clear, simple language. Many visitors are elderly, family caregivers, or non-native English speakers.
- Concise: 2–3 short paragraphs maximum per response.

════════════════════════════════════════
YOUR ONLY SOURCE OF TRUTH — READ CAREFULLY
════════════════════════════════════════

COMPANY:
${company.description}
Experience: ${company.yearsExperience}+ years | Staff: ${company.totalCareTakers}+ care takers
Tagline: "${company.tagline}"
Mission: ${company.mission}

CONTACT:
Phone: ${contact.phone}
Fax: ${contact.fax}
Email: ${contact.email}
Address: ${addr}
Office Hours: ${contact.workingHours.days}, ${contact.workingHours.hours}

INSURANCE ACCEPTED:
${(insuranceAccepted||[]).map(i => `- ${i}`).join("\n")}

SERVICES WE OFFER (EXACT LIST — DO NOT ADD TO THIS):
${svcList}

OPEN POSITIONS RIGHT NOW — ${jobs.length} total (EXACT LIST — DO NOT ADD TO THIS):
${jobList || "No open positions at this time."}

FREQUENTLY ASKED QUESTIONS:
${faqList}

════════════════════════════════════════
ANTI-HALLUCINATION RULES — NON-NEGOTIABLE
════════════════════════════════════════
1. EVERY fact you state must come WORD FOR WORD from the SOURCE OF TRUTH above. If it is not written above, it does not exist.
2. NEVER guess, infer, assume, or estimate any detail — not phone numbers, not services, not job titles, not hours, not anything.
3. If the user asks something not covered above, say EXACTLY: "I don't have that information on hand. Please call us at ${contact.phone} or email ${contact.email} and our team will be happy to help."
4. NEVER say we offer a service, position, or program that is not explicitly listed above.
5. NEVER discuss anything outside of ${company.name} — no politics, health advice, general knowledge, other companies, news, or anything unrelated.
6. If asked to do something unrelated (write code, tell jokes, etc.): "I'm here specifically to help with ${company.name}'s services and careers. How can I help you with that?"
7. Emergencies: ALWAYS respond first with "Please call 911 immediately." Then: "For urgent care coordination, call us at ${contact.phone}."
8. Job applications: direct to our Career page or call ${contact.phone}.
9. When listing services or positions, copy them EXACTLY as listed above — no paraphrasing, no additions.
10. If someone pastes a resume, match it ONLY against the open positions listed above. Never mention jobs not on the list.`;
}

async function callAI(systemPrompt, messages, maxTokens) {
  const genAI = getClient();
  if (!genAI) throw new Error("AI not configured");

  const model = genAI.getGenerativeModel({
    model: CONFIG.model,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens || CONFIG.maxTokens,
      temperature: 0,        // deterministic — no creative embellishment
      topP: 0.95,
      topK: 40,
    },
  });

  // Convert message history to Gemini format (roles: "user" / "model")
  // Gemini requires history to start with a "user" message — drop any leading bot messages
  let history = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  while (history.length > 0 && history[0].role !== "user") history.shift();
  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  const text = result.response.text();

  const usage = result.response.usageMetadata || {};
  const inputTok  = usage.promptTokenCount     || 0;
  const outputTok = usage.candidatesTokenCount || 0;
  await recordUsage(inputTok, outputTok);

  return { text, tokens: inputTok + outputTok };
}

// ── Main: generate chat response ──
async function generateResponse(userMessage, history, siteContent, activeJobs) {
  try {
    const msgs = history.slice(-16).map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }));
    msgs.push({ role: "user", content: userMessage });
    const result = await callAI(buildSystemPrompt(siteContent, activeJobs), msgs);
    return { text: result.text, intent: detectIntent(userMessage), tokens: result.tokens, fallback: false };
  } catch (err) {
    console.error("AI error — using smart fallback:", err.message);
    return {
      text: smartFallback(userMessage, siteContent, activeJobs),
      intent: detectIntent(userMessage),
      fallback: true,
      error: err.message,
    };
  }
}

// ── Resume matching ──
async function matchResume(resumeText, activeJobs, siteContent) {
  try {
    const jobDesc = activeJobs.map((j,i) =>
      `JOB ${i+1}: ${j.title} | ${j.department} | ${j.location} | ${j.type}\nCerts: ${(j.certifications||[]).join(", ")||"N/A"}\nKeywords: ${(j.matchKeywords||[]).join(", ")}`
    ).join("\n\n");

    const sys = `You are Olalus AI, the career matching assistant for ${siteContent.company.name}. You ONLY match candidates against the positions listed below. Never suggest jobs that aren't listed. Respond ONLY with valid JSON, no markdown:\n{"summary":"1-2 sentence assessment of candidate fit for OUR open roles","matches":[{"jobIndex":0,"score":85,"reason":"why they fit THIS specific role at ${siteContent.company.name}"}],"tip":"1 sentence career advice specific to home healthcare"}\n\nOUR OPEN POSITIONS:\n${jobDesc}`;
    const result = await callAI(sys, [{ role: "user", content: `Resume:\n${resumeText.substring(0,3000)}` }], 600);

    let parsed;
    try { parsed = JSON.parse(result.text.replace(/```json|```/g,"").trim()); } catch { return keywordMatch(resumeText, activeJobs, siteContent); }

    const matched = (parsed.matches||[])
      .filter(m => m.jobIndex >= 0 && m.jobIndex < activeJobs.length)
      .map(m => { const j = activeJobs[m.jobIndex]; return { jobId: j._id, title: j.title, matchScore: Math.min(98, Math.max(20, m.score)), department: j.department, location: j.location, type: j.type, reason: m.reason }; })
      .sort((a,b) => b.matchScore - a.matchScore);

    let text = `${parsed.summary}\n\n`;
    matched.slice(0,5).forEach(m => { text += `${m.matchScore>=85?"🌟":m.matchScore>=70?"✅":"📋"} ${m.title} — ${m.matchScore}% match\n${m.reason}\n\n`; });
    text += `${parsed.tip||""}\n\nApply via our Career page or call ${siteContent.contact.phone}!`;
    return { text, matchedJobs: matched, fallback: false };
  } catch (err) {
    console.error("Resume match error — using keyword fallback:", err.message);
    return keywordMatch(resumeText, activeJobs, siteContent);
  }
}

// ── Smart fallback — fires only when AI API is unreachable/erroring ──
function smartFallback(msg, site, jobs) {
  const lower = msg.toLowerCase();
  const { contact, company, insuranceAccepted, services, faqs } = site;
  const a = contact.address;
  const addr = `${a.street}, ${a.suite}, ${a.city}, ${a.state} ${a.zip}`;

  // Emergency — always first, no matter what
  if (["emergency","911","urgent","ambulance","dying","overdose"].some(w => lower.includes(w))) {
    return `Please call 911 immediately for any emergency.\n\nFor urgent care coordination with our team, call us at ${contact.phone}. We're here to support you.`;
  }

  // Score every intent category by how many of its keywords appear
  const scores = scoreIntents(lower);
  const topIntents = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([intent]) => intent);

  // Build a response that covers all matched intents (up to 2)
  const parts = [];
  const covered = new Set();

  for (const intent of topIntents.slice(0, 2)) {
    if (covered.has(intent)) continue;
    covered.add(intent);

    switch (intent) {
      case "jobs":
        if (jobs.length === 0) {
          parts.push(`We don't have any open positions listed at the moment. Check back soon or call ${contact.phone} to ask about upcoming openings.`);
        } else {
          const list = jobs.map(j => `• ${j.title} — ${j.type}, ${j.location}`).join("\n");
          parts.push(`We currently have ${jobs.length} open position${jobs.length > 1 ? "s" : ""}:\n\n${list}\n\nPaste your resume and I'll match you to the best fit, or visit our Career page to apply.`);
        }
        break;

      case "insurance":
        parts.push(`We accept the following insurance plans:\n${(insuranceAccepted||[]).map(i => `• ${i}`).join("\n")}\n\nFor coverage details specific to your plan, call us at ${contact.phone}.`);
        break;

      case "services":
        parts.push(`Here's what we provide:\n${services.map(s => `${s.icon || "•"} ${s.name}: ${s.description}`).join("\n")}\n\nCall ${contact.phone} to discuss which services are right for your situation.`);
        break;

      case "contact":
        parts.push(`Here's how to reach us:\n📞 ${contact.phone}\n📠 Fax: ${contact.fax}\n📧 ${contact.email}\n📍 ${addr}\n🕗 ${contact.workingHours.days}: ${contact.workingHours.hours}`);
        break;

      case "hours":
        parts.push(`Our office hours are ${contact.workingHours.days}, ${contact.workingHours.hours}.\n\nOur caregivers provide care 24/7 based on your care plan — we never leave you without support.`);
        break;

      case "about":
        parts.push(`${company.description}\n\nWith ${company.yearsExperience}+ years of experience and ${company.totalCareTakers}+ care takers on staff, our mission is: "${company.mission}"`);
        break;

      case "appointment":
        parts.push(`You can book a consultation by calling ${contact.phone} or using the Book Appointment form on our website.\n\nOur office is at ${addr}, open ${contact.workingHours.days} ${contact.workingHours.hours}.`);
        break;

      case "resume":
        parts.push(`To match your resume to our open positions, paste the full text of your resume in this chat. I'll review it against our ${jobs.length} current opening${jobs.length !== 1 ? "s" : ""} and highlight the best fit for you.`);
        break;
    }
  }

  // FAQ match — scored by number of overlapping meaningful words
  if (parts.length === 0) {
    const faqMatch = bestFaqMatch(lower, faqs || []);
    if (faqMatch) {
      parts.push(`${faqMatch.question}\n\n${faqMatch.answer}`);
    }
  }

  // Nothing matched — give a helpful, specific default
  if (parts.length === 0) {
    return [
      `Thanks for reaching out to ${company.name}! I'm Olalus AI and I'm here to help.`,
      `I can assist you with:\n• 💼 Career opportunities & open positions (${jobs.length} available)\n• 🏥 Our in-home care services\n• 🛡️ Insurance we accept\n• 📅 Booking an appointment\n• 📞 Contact & location info`,
      `What would you like to know?`,
    ].join("\n\n");
  }

  return parts.join("\n\n");
}

function scoreIntents(lower) {
  const map = {
    jobs:        ["job","position","career","hiring","work","opening","role","vacancy","employment"],
    insurance:   ["insurance","medicare","medicaid","accept","coverage","pay","plan","benefit"],
    services:    ["service","provide","offer","care","therapy","aide","help","support","assistance"],
    contact:     ["contact","phone","call","email","address","location","fax","reach","find","where"],
    hours:       ["hour","open","close","time","when","schedule","available","availability"],
    about:       ["about","who","company","mission","history","founded","background","team"],
    appointment: ["appointment","book","consult","schedule","visit","meet","intake","enroll"],
    resume:      ["resume","cv","background","experience","skills","qualifications","apply","application"],
    emergency:   ["emergency","urgent","911","ambulance","crisis"],
  };
  const scores = {};
  for (const [intent, keywords] of Object.entries(map)) {
    scores[intent] = keywords.filter(k => lower.includes(k)).length;
  }
  return scores;
}

function bestFaqMatch(lower, faqs) {
  let best = null;
  let bestScore = 0;
  const inputWords = lower.split(/\s+/).filter(w => w.length > 3);

  for (const faq of faqs) {
    const faqWords = faq.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const overlap = faqWords.filter(w => inputWords.includes(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      best = faq;
    }
  }
  // Require at least 2 meaningful words to overlap before surfacing a FAQ
  return bestScore >= 2 ? best : null;
}

function keywordMatch(resume, jobs, site) {
  const lower = resume.toLowerCase();
  const matched = jobs.map(j => {
    let s = 40;
    (j.matchKeywords||[]).forEach(k => { if(lower.includes(k)) s += 8; });
    (j.certifications||[]).forEach(c => { if(lower.includes(c.toLowerCase())) s += 10; });
    return { jobId: j._id, title: j.title, matchScore: Math.min(98, s), department: j.department, location: j.location, type: j.type, reason: "Matched based on your skills and certifications." };
  }).sort((a,b) => b.matchScore - a.matchScore);

  const top = matched.slice(0, 5);
  let text = `I've reviewed your resume and found ${top.length} potential match${top.length !== 1 ? "es" : ""} from our open positions:\n\n`;
  top.forEach(m => { text += `${m.matchScore >= 70 ? "✅" : "📋"} ${m.title} — ${m.matchScore}% match\n${m.reason}\n\n`; });
  text += `Visit our Career page to apply directly or call ${site.contact.phone} and mention the position you're interested in.`;

  return { text, matchedJobs: matched, fallback: true };
}

function detectIntent(input) {
  const lower = input.toLowerCase();
  const m = {
    job_search:  ["job","position","career","hire"],
    resume:      ["resume","cv","skills"],
    apply:       ["apply","application","form"],
    insurance:   ["insurance","medicare","accept"],
    services:    ["service","care","therapy"],
    contact:     ["contact","phone","email","call"],
    hours:       ["hour","open","time"],
    appointment: ["appointment","book","consult"],
    emergency:   ["emergency","urgent","911"],
    about:       ["about","who","company"],
    greeting:    ["hello","hi","hey"],
  };
  for (const [intent, kws] of Object.entries(m)) {
    if (kws.some(k => lower.includes(k))) return intent;
  }
  return "general";
}

function isConfigured() { return !!process.env.GEMINI_API_KEY; }

module.exports = { generateResponse, matchResume, detectIntent, isConfigured, getBudgetStatus, keywordMatch, smartFallback };
