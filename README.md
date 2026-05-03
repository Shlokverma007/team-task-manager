# Team Task Manager

A minimal full-stack team task manager built with Node.js, Express, JWT auth, and a browser dashboard.

## Features

- Signup and login
- Role-based access control for admin/member users
- Project creation and team member tracking
- Task creation, assignment, due dates, and status updates
- Dashboard counters for projects, tasks, in-progress work, and overdue tasks
- REST APIs served from the same deployed app

## Demo Login

```txt
Email: admin@test.com
Password: 123456
Role: admin
```

## Run Locally

```bash
npm install
npm start
```

Open:

```txt
http://localhost:5000
```

## API Routes

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/users
GET  /api/projects
POST /api/projects
GET  /api/tasks
POST /api/tasks
PUT  /api/tasks/:id
GET  /api/dashboard
```

## Railway Deployment

1. Push this project to GitHub.
2. Create a new Railway project.
3. Select "Deploy from GitHub repo".
4. Choose this repository.
5. Railway will run `npm start`.
6. Add this environment variable:

```txt
JWT_SECRET=team-task-manager-secret
```

## Notes

This version uses in-memory storage for a fast working demo deployment. Data resets when the server restarts.
