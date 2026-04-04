const express = require("express");
const app = express();
app.set('trust proxy', 1);
const cors = require("cors");
require("dotenv").config({ path: ".env" });

const REQUIRED_ENV = [
  'PORT', 'MONGO_CONNECTION_URL',
  'SEAWEED_S3_URL', 'SEAWEED_BUCKET', 'SEAWEED_ACCESS_KEY', 'SEAWEED_SECRET_KEY',
  'JWT_SECRET', 'ADMIN_EMAIL',
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[!] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const morgan = require("morgan");
const { applySecurityMiddleware, buildCorsOptions } = require("./middleware/security");
const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");
const { initSuperAdmin } = require("./config/superAdmin");

const authRoute = require("./routes/auth");
const adminUserRoute = require("./routes/adminUser");
const commentRoute = require("./routes/comment");
const logRoute = require("./routes/log");
const bannerRoute = require("./routes/banner");
const serviceRoute = require("./routes/service");
const waiverRoute = require("./routes/waiver");
const partnerRoute = require("./routes/partner");
const testimonialRoute = require("./routes/testimonial");
const faqRoute = require("./routes/faq");
const jobRoute = require("./routes/job");
const resourceRoute = require("./routes/resource");
const blogRoute = require("./routes/blog");
const contactRoute = require("./routes/contact");
const physicalExamRoute = require("./routes/physicalExam");

connectDB().then(() => initSuperAdmin());
connectRedis();

const PORT = process.env.PORT;
const WEBSITE = process.env.WEBSITE;
const ADMIN_DASHBOARD = process.env.ADMIN_DASHBOARD;

const corsOptions = buildCorsOptions(WEBSITE, ADMIN_DASHBOARD);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

applySecurityMiddleware(app);

// Auth
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/admin-users", adminUserRoute);
app.use("/api/v1/logs", logRoute);

// Content
app.use("/api/v1/banner", bannerRoute);
app.use("/api/v1/services", serviceRoute);
app.use("/api/v1/waiver", waiverRoute);
app.use("/api/v1/partners", partnerRoute);
app.use("/api/v1/testimonials", testimonialRoute);
app.use("/api/v1/faq", faqRoute);
app.use("/api/v1/jobs", jobRoute);
app.use("/api/v1/resources", resourceRoute);
app.use("/api/v1/blog", blogRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/comments", commentRoute);
app.use("/api/v1/physical-exam", physicalExamRoute);

app.get("/", (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV || 'development',
    memory: mem.heapUsed,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ status: 'error', message: "An unexpected error occurred" });
});

app.listen(PORT, () => {
  console.log(`[+] Olalus server running on port ${PORT}`);
  console.log(`[+] Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on("SIGINT", async () => {
  console.log("[-] Shutting down...");
  process.exit(0);
});
