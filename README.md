# Unifolio - AI Powered Centralized System

Production-ready full-stack platform for trusted student achievement portfolios, admin verification, public profile discovery, and AI-powered resume building.

## Highlights
- Centralized student achievements with proof upload and trust score
- Admin verification workflow with approve/reject and feedback
- Public profile search by full name or skill with trust-score ranking
- Public profile visibility restricted to verified achievements only
- Manual skill management by students (add/remove)
- AI resume builder with provider and template support
  - Providers: Groq, OpenAI, Gemini
  - Templates: General, Java, MERN, Data
  - Editable resume sections with add/delete controls
  - Download as TXT and styled PDF
- Fake proof detector with duplicate detection and suspicious content checks

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Axios, jsPDF, Chart.js
- Backend: Node.js, Express, MongoDB (Mongoose), Multer, OCR/PDF utilities
- AI Integrations: Groq API, OpenAI API, Gemini API (with graceful fallback)

## Project Structure

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
|       |-- middleware/upload.js
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
|           |-- aiResumeService.js
|           |-- certificateDetector.js
|           |-- resumeBuilder.js
|           |-- scoring.js
|           `-- skillMap.js
|-- frontend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
|       |-- App.jsx
|       |-- index.css
|       |-- api/api.js
|       |-- context/AuthContext.jsx
|       |-- components/
|       `-- pages/
|           |-- AddAchievementPage.jsx
|           |-- AdminPanel.jsx
|           |-- LoginPage.jsx
|           |-- PublicProfile.jsx
|           |-- PublicSearchPage.jsx
|           `-- StudentDashboard.jsx
`-- package.json
```

## Core Workflows

### Student
1. Register/login as Student
2. Add achievement with optional proof file
3. Track timeline status in dashboard
4. Manage profile skills manually
5. Generate AI resume, edit sections, copy/download TXT/PDF

### Admin
1. Review submissions in Admin Panel
2. Approve/reject with feedback
3. Open student profile using View Profile action
4. Suspicious submissions are blocked before admin queue

### Public/Recruiter
1. Search by name or by skill
2. Results are sorted by trust score (highest first)
3. Visit public profile with verified achievements and skills

## Trust Score Logic
- Verified achievement: +50
- Internship category: +30
- Hackathon category: +20
- Proof attached: +20

## Fake Detector Overview
- Filename suspicious keyword checks
- OCR/PDF text extraction checks
- File hash duplicate detection
- Text fingerprint duplicate detection
- Visual hash duplicate detection
- Similarity checks against existing submissions
- Suspicious submissions are blocked and not added to timeline/admin queue

## API Snapshot

### Auth
- POST /api/register-student
- POST /api/login
- GET /api/users

### Achievements & Dashboard
- POST /api/add-achievement
- GET /api/achievements/:userId
- GET /api/dashboard/:userId

### Admin
- GET /api/admin/submissions
- PUT /api/verify/:id
- DELETE /api/admin/reset-details

### Profile, Search, Resume
- GET /api/profile/:userId
- POST /api/profile/:userId/skills
- DELETE /api/profile/:userId/skills/:skillId
- GET /api/public/search?name=<value>
- GET /api/public/search?skill=<value>
- GET /api/resume/:userId
- POST /api/resume-ai/:userId

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then update `backend/.env` with your values.

### 3) Run full stack

```bash
npm run dev
```

App URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

### Optional run commands
- Backend only: `npm run dev:backend`
- Frontend only: `npm run dev:frontend`

## Environment Variables

### Backend (`backend/.env`)
- PORT
- MONGO_URI
- CORS_ORIGIN
- DNS_SERVERS
- MONGO_TLS_INSECURE
- MONGO_IPV4_ONLY

Optional AI providers:
- GROQ_API_KEY
- GROQ_MODEL (default: llama-3.1-8b-instant)
- OPENAI_API_KEY
- OPENAI_MODEL (default: gpt-4o-mini)
- GEMINI_API_KEY
- GEMINI_MODEL (recommended: gemini-2.0-flash)

### Frontend (`frontend/.env`)
- VITE_API_URL (for deployed backend URL)

## Demo Credentials (Auto Seed)
- Student: student@unifolio.com / student123
- Admin: admin@unifolio.com / admin123

## Deployment (Vercel)

### Backend
1. Create Vercel project with root directory `backend`
2. Add backend env variables
3. Deploy and verify `/api/health`

### Frontend
1. Create Vercel project with root directory `frontend`
2. Set `VITE_API_URL` to deployed backend `/api` URL
3. Deploy

## Troubleshooting
- If AI resume shows provider quota/model error:
  - Select another provider in Resume Builder
  - Verify corresponding API key in backend env
  - Restart backend server
- If new backend changes not reflecting:
  - Stop running backend process and start again (`npm run dev`)
- If CORS fails on deployment:
  - Ensure backend `CORS_ORIGIN` exactly matches frontend URL

## License
This project is intended for educational, portfolio, and hackathon use.
