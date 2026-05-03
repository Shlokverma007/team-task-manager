let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let projects = [];
let users = [];
let tasks = [];

const authPanel = document.getElementById("authPanel");
const workspace = document.getElementById("workspace");
const userInfo = document.getElementById("userInfo");

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || "Request failed");
  return data;
}

function saveSession(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(currentUser));
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  try {
    saveSession(await api("/api/auth/login", { method: "POST", body: JSON.stringify(body) }));
    await loadApp();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  try {
    saveSession(await api("/api/auth/register", { method: "POST", body: JSON.stringify(body) }));
    await loadApp();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  token = null;
  currentUser = null;
  renderShell();
});

document.getElementById("projectForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  try {
    await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
    event.target.reset();
    await loadData();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  try {
    await api("/api/tasks", { method: "POST", body: JSON.stringify(body) });
    event.target.reset();
    await loadData();
  } catch (err) {
    alert(err.message);
  }
});

async function loadApp() {
  renderShell();
  await loadData();
}

async function loadData() {
  [projects, users, tasks, dashboard] = await Promise.all([
    api("/api/projects"),
    api("/api/users"),
    api("/api/tasks"),
    api("/api/dashboard")
  ]);

  renderDashboard(dashboard);
  renderProjects();
  renderTasks();
  renderOptions();
}

function renderShell() {
  authPanel.classList.toggle("hidden", Boolean(token));
  workspace.classList.toggle("hidden", !token);

  if (currentUser) {
    userInfo.textContent = `${currentUser.name} (${currentUser.role})`;
  }
}

function renderDashboard(dashboard) {
  document.getElementById("stats").innerHTML = [
    ["Projects", dashboard.projects],
    ["Tasks", dashboard.tasks],
    ["In Progress", dashboard.inProgress],
    ["Overdue", dashboard.overdue]
  ].map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
}

function renderProjects() {
  document.getElementById("projectsList").innerHTML = projects.map((project) => `
    <article class="item">
      <h3>${project.name}</h3>
      <p class="muted">${project.description || "No description"}</p>
      <span class="badge">${project.members.length} member(s)</span>
    </article>
  `).join("");
}

function renderTasks() {
  document.getElementById("tasksList").innerHTML = tasks.map((task) => `
    <article class="item">
      <div class="row">
        <h3>${task.title}</h3>
        <span class="badge">${task.status}</span>
      </div>
      <p class="muted">${task.description || "No description"}</p>
      <p class="muted">Project: ${task.project.name || "Unknown"} | Assigned: ${task.assignedTo?.name || "Unassigned"}</p>
      <div class="row">
        <span>Due: ${task.dueDate || "No due date"}</span>
        <select onchange="updateTask('${task.id}', this.value)">
          ${["todo", "in-progress", "done"].map((status) => `<option value="${status}" ${task.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
    </article>
  `).join("");
}

function renderOptions() {
  document.getElementById("projectSelect").innerHTML = projects
    .map((project) => `<option value="${project.id}">${project.name}</option>`)
    .join("");

  document.getElementById("userSelect").innerHTML = users
    .map((user) => `<option value="${user.id}">${user.name} (${user.role})</option>`)
    .join("");
}

async function updateTask(id, status) {
  await api(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  await loadData();
}

renderShell();
if (token) loadApp().catch(() => localStorage.clear());
