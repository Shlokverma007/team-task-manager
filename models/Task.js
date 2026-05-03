const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dueDate: Date
});

module.exports = mongoose.model("Task", taskSchema);
