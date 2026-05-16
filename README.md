# TeamTask - Team Task Manager

A full-stack web application for managing projects, tasks, and teams with role-based access control.

## Features

- **Authentication** — Sign up, login, and JWT-based session management
- **Project Management** — Create and manage projects with team members
- **Task Management** — Kanban-style task board with drag-and-drop status updates
- **Role-Based Access** — Admin and Member roles with different permissions
- **Dashboard** — Overview of tasks, status distribution, overdue items
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, React Router 6, Axios    |
| Backend  | Node.js, Express 4                  |
| Database | MongoDB (Mongoose ODM)              |
| Auth     | JWT (JSON Web Tokens)               |
| Styling  | CSS with custom properties          |

## Project Structure

```
/
├── backend/
│   ├── config/        # Database connection
│   ├── middleware/     # Auth & RBAC middleware
│   ├── models/         # Mongoose schemas (User, Project, Task)
│   ├── routes/         # API routes (auth, projects, tasks, dashboard)
│   ├── validators/     # Express-validator rules
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios API client
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Auth context provider
│   │   └── pages/      # Route pages
│   └── index.html
├── nixpacks.toml       # Railway deployment config
├── .env.example        # Environment variables template
└── package.json        # Root scripts
```

## API Endpoints

### Authentication
| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| POST   | `/api/auth/signup` | Register a new user |
| POST   | `/api/auth/login`  | Login and get token |
| GET    | `/api/auth/me`     | Get current user    |

### Projects
| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| GET    | `/api/projects`           | List user's projects   |
| POST   | `/api/projects`           | Create a project       |
| GET    | `/api/projects/:id`       | Get project details    |
| PUT    | `/api/projects/:id`       | Update project         |
| DELETE | `/api/projects/:id`       | Delete project         |
| POST   | `/api/projects/:id/members` | Add member          |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint                             | Description        |
| ------ | ------------------------------------ | ------------------ |
| GET    | `/api/tasks/project/:projectId`      | List project tasks |
| POST   | `/api/tasks/project/:projectId`      | Create task        |
| GET    | `/api/tasks/:id`                     | Get task details   |
| PUT    | `/api/tasks/:id`                     | Update task        |
| DELETE | `/api/tasks/:id`                     | Delete task        |

### Dashboard
| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/dashboard`  | Get dashboard statistics |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)

### 1. Clone and install

```bash
git clone <repo-url>
cd team-task-manager
npm run install:all
```

### 2. Set environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI` — Your MongoDB connection string
- `JWT_SECRET` — A random secret string for JWT signing

### 3. Run in development

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Frontend: http://localhost:3000
Backend API: http://localhost:5000

### 4. Build for production

```bash
npm run build:frontend
npm run start:backend
```

The backend will serve the built frontend from `frontend/dist/`.

## Deployment (Railway)

### Manual deployment

1. Push to GitHub
2. Connect repository on Railway
3. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Railway will auto-detect the `nixpacks.toml` config
5. Deploy — the app builds the frontend and serves it from the backend

### Environment Variables

| Variable        | Description                    |
| --------------- | ------------------------------ |
| `PORT`          | Server port (default: 5000)    |
| `MONGODB_URI`   | MongoDB connection string      |
| `JWT_SECRET`    | JWT signing secret             |
| `JWT_EXPIRES_IN`| Token expiry (default: 7d)     |
| `NODE_ENV`      | Environment mode               |

## License

MIT
