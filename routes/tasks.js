const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

router.get("/", auth, async (req, res) => {
  const tasks = await Task.find()
    .populate("project", "name")
    .populate("assignedTo", "name email role");

  res.json(tasks);
});

router.put("/:id", auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

module.exports = router;
