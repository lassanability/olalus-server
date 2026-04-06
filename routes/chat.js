const express = require("express");
const router = express.Router();
const chat = require("../controllers/chat");

router.post("/start", chat.startChat);
router.post("/message", chat.sendMessage);
router.post("/resume", chat.submitResume);
router.get("/jobs", chat.getJobs);
router.get("/health/check", chat.healthCheck);
router.post("/seed", chat.seedAll);
router.get("/:sessionId", chat.getChat);

module.exports = router;
