const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, async (req, res) => {
  const project = new Project({ ...req.body, createdBy: req.user.id });
  await project.save();
  res.json(project);
});

router.get("/", auth, async (req, res) => {
  const projects = await Project.find().populate("createdBy", "name email role");
  res.json(projects);
});

module.exports = router;
