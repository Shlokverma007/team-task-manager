const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "demo-secret";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const users = [
  {
    id: "u1",
    name: "Admin User",
    email: "admin@test.com",
    password: "123456",
    role: "admin"
  }
];

const projects = [
  {
    id: "p1",
    name: "Team Task Manager",
    description: "Submission demo project",
    members: ["u1"],
    createdBy: "u1"
  }
];

const tasks = [
  {
    id: "t1",
    title: "Build dashboard",
    description: "Create overview for task progress",
    status: "in-progress",
    project: "p1",
    assignedTo: "u1",
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  }
];

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin access required" });
  }
  next();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Team Task Manager API running" });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role = "member" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Name, email and password are required" });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const user = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    role: role === "admin" ? "admin" : "member"
  };

  users.push(user);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email && item.password === password);

  if (!user) return res.status(400).json({ msg: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/users", auth, (req, res) => {
  res.json(users.map(publicUser));
});

app.get("/api/projects", auth, (req, res) => {
  res.json(projects.map(hydrateProject));
});

app.post("/api/projects", auth, requireAdmin, (req, res) => {
  const { name, description, members = [] } = req.body;

  if (!name) return res.status(400).json({ msg: "Project name is required" });

  const project = {
    id: `p${Date.now()}`,
    name,
    description,
    members: Array.from(new Set([req.user.id, ...members])),
    createdBy: req.user.id
  };

  projects.push(project);
  res.status(201).json(hydrateProject(project));
});

app.get("/api/tasks", auth, (req, res) => {
  res.json(tasks.map(hydrateTask));
});

app.post("/api/tasks", auth, (req, res) => {
  const { title, description, project, assignedTo, dueDate } = req.body;

  if (!title || !project) {
    return res.status(400).json({ msg: "Title and project are required" });
  }

  if (req.user.role !== "admin" && assignedTo && assignedTo !== req.user.id) {
    return res.status(403).json({ msg: "Members can only assign tasks to themselves" });
  }

  const task = {
    id: `t${Date.now()}`,
    title,
    description,
    status: "todo",
    project,
    assignedTo: assignedTo || req.user.id,
    dueDate
  };

  tasks.push(task);
  res.status(201).json(hydrateTask(task));
});

app.put("/api/tasks/:id", auth, (req, res) => {
  const task = tasks.find((item) => item.id === req.params.id);

  if (!task) return res.status(404).json({ msg: "Task not found" });
  if (req.user.role !== "admin" && task.assignedTo !== req.user.id) {
    return res.status(403).json({ msg: "You can update only your assigned tasks" });
  }

  Object.assign(task, req.body);
  res.json(hydrateTask(task));
});

app.get("/api/dashboard", auth, (req, res) => {
  const visibleTasks = req.user.role === "admin"
    ? tasks
    : tasks.filter((task) => task.assignedTo === req.user.id);

  const today = new Date().toISOString().slice(0, 10);

  res.json({
    users: users.length,
    projects: projects.length,
    tasks: visibleTasks.length,
    todo: visibleTasks.filter((task) => task.status === "todo").length,
    inProgress: visibleTasks.filter((task) => task.status === "in-progress").length,
    done: visibleTasks.filter((task) => task.status === "done").length,
    overdue: visibleTasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "done").length
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function hydrateProject(project) {
  return {
    ...project,
    members: project.members.map((id) => publicUser(users.find((user) => user.id === id))).filter(Boolean),
    createdBy: publicUser(users.find((user) => user.id === project.createdBy))
  };
}

function hydrateTask(task) {
  return {
    ...task,
    project: projects.find((project) => project.id === task.project) || task.project,
    assignedTo: publicUser(users.find((user) => user.id === task.assignedTo))
  };
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
