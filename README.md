# Unifolio - AI Powered Cetralized System

Production-ready, hackathon-optimized full-stack application for centralized, trusted student achievement records.

## 1. Folder Structure

```text
.
|-- backend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
|       |-- app.js
|       |-- server.js
|       |-- config/db.js
|       |-- controllers/
|       |   |-- achievementController.js
|       |   |-- adminController.js
|       |   |-- authController.js
|       |   `-- profileController.js
|       |-- data/seed.js
|       |-- models/
|       |   |-- Achievement.js
|       |   |-- Skill.js
|       |   `-- User.js
|       |-- routes/
|       |   |-- achievementRoutes.js
|       |   |-- adminRoutes.js
|       |   |-- authRoutes.js
|       |   `-- profileRoutes.js
|       `-- utils/
|           |-- scoring.js
|           `-- skillMap.js
|-- frontend/
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- tailwind.config.js
|   `-- src/
|       |-- App.jsx
|       |-- index.css
|       |-- main.jsx
|       |-- api/api.js
|       |-- components/
|       |   |-- Badge.jsx
|       |   |-- CategoryChart.jsx
|       |   |-- Layout.jsx
|       |   |-- ProtectedRoute.jsx
|       |   `-- StatCard.jsx
|       |-- context/AuthContext.jsx
|       |-- pages/
|       |   |-- AddAchievementPage.jsx
|       |   |-- AdminPanel.jsx
|       |   |-- LoginPage.jsx
|       |   |-- PublicProfile.jsx
|       |   `-- StudentDashboard.jsx
|       `-- utils/
|           |-- constants.js
|           `-- formatters.js
`-- package.json
```

## 2. Backend Features and APIs

### Models
- User: name, email, role
- Achievement: userId, title, category, description, date, hasProof, verified, rejected, verifiedBadge, score
- Skill: userId, skillName

### Trust Score Logic
- Verified: +50
- Internship: +30
- Hackathon: +20
- Proof: +20

### Skill Mapping
- Hackathon -> Problem Solving
- Internship -> Industry Experience
- Sports -> Teamwork
- Course -> Technical Knowledge

### APIs
- POST /api/add-achievement
- GET /api/achievements/:userId
- PUT /api/verify/:id
- GET /api/profile/:userId
- GET /api/resume/:userId
- GET /api/dashboard/:userId
- POST /api/login
- POST /api/register-student
- GET /api/users
- GET /api/admin/submissions

## 3. Frontend Features

### Pages
- Login Page (dummy role-based login)
- Student Dashboard
- Add Achievement Page
- Admin Panel
- Public Profile Page (/profile/:id)

### UI and Functionality
- Tailwind modern card-based UI
- Verified badge (green), Pending badge (red), Rejected badge
- Category chart (Chart.js)
- Timeline cards
- Filtering by category and status
- Auto-generated skills display
- Public trusted portfolio with trust score

## 4. Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB local instance or MongoDB Atlas URI

### Install and Run (Single command workflow)
1. From project root:
   - `npm install`
2. Configure backend env:
   - Copy `backend/.env.example` to `backend/.env`
   - Set `MONGO_URI`
3. Start full stack from root:
   - `npm run dev`

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Optional split run
- Backend only: `npm run dev:backend`
- Frontend only: `npm run dev:frontend`

## 5. Sample Data (Auto Seeded)

On first backend startup, demo records are inserted automatically.

### Demo Users
- Student: student@unifolio.com / student123
- Admin: admin@unifolio.com / admin123

### Demo Achievement Set
- Smart Campus Hackathon Finalist (verified + proof)
- Software Engineering Internship (verified + proof)
- Inter-College Football Tournament (pending)
- Cloud Computing Certification (pending + proof)

## Demo Flow for Judges
1. Use separate Student Login or Admin Login on first page.
2. Optionally create a new student account using Create Student Account.
3. Login as Student and show dashboard cards, chart, and timeline filters.
4. Add a new achievement with proof.
5. Switch to Admin and approve/reject submissions.
6. Open public profile URL and show trusted portfolio with updated trust score.

## Vercel Deployment (Frontend + Backend)

### Backend Deploy (Vercel Project 1)
1. Push this repository to GitHub.
2. In Vercel, create a new project and set root directory to `backend`.
3. Add environment variables in Vercel backend project:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `CORS_ORIGIN` = your frontend Vercel URL (for example: `https://unifolio-frontend.vercel.app`)
4. Deploy.
5. Verify backend URL:
   - `https://<backend-project>.vercel.app/api/health`

### Frontend Deploy (Vercel Project 2)
1. In Vercel, create another project and set root directory to `frontend`.
2. Add environment variable:
   - `VITE_API_URL` = `https://<backend-project>.vercel.app/api`
3. Deploy frontend.
4. Open your frontend Vercel URL and test login flow.

### Notes
- `frontend/vercel.json` handles React route fallback.
- `backend/vercel.json` exposes Express app as serverless API.
- If CORS issue appears, update backend `CORS_ORIGIN` to exact frontend URL and redeploy backend.
