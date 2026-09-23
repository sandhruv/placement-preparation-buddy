# Placement Prep Buddy

An autonomous, multi-agent AI mock interview platform that conducts **dynamic, non-scripted interviews** based on the candidate's resume, target job role, researched job requirements, and previous answers.

## Features

- **Pre-Interview Gap Analysis**: Upload resume, select target role, get personalized skill gaps before the interview begins
- **Real-Time Job Research**: Uses Tavily API to research real-world requirements for the selected role
- **Dynamic Interview Flow**: LangGraph-powered conditional branching — weak answers trigger targeted follow-ups
- **Separate AI Agents**: Interviewer Agent conducts the interview; Evaluator Agent independently generates the final report
- **Structured Evaluation**: Scores across technical knowledge, problem solving, communication, role knowledge, and depth
- **MongoDB Persistence**: Full transcript and evaluation stored in MongoDB
- **Modern UI**: Clean, responsive React frontend with chat-style interface

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  FastAPI Backend  │────▶│     MongoDB     │
│  (Vite + Tail)  │◀────│  (Python)        │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │        │
                              ▼        ▼
                        ┌─────────┐ ┌─────────┐
                        │  Groq   │ │ Tavily  │
                        │  (LLM)  │ │ (Search)│
                        └─────────┘ └─────────┘
```

## Technology Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Vite, Tailwind CSS, Axios    |
| Backend  | Python, FastAPI, Pydantic            |
| AI       | Groq API (llama-3.3-70b-versatile)  |
| Agents   | LangGraph                           |
| Research | Tavily API                          |
| Resume   | pdfplumber                          |
| Database | MongoDB (PyMongo)                   |

## Folder Structure

```
placement-prep-buddy/
├── backend/
│   ├── agents/
│   │   ├── interviewer.py      # Interviewer Agent (conducts interview)
│   │   └── evaluator.py        # Evaluator Agent (generates final report)
│   ├── database/
│   │   └── mongodb.py          # MongoDB connection and operations
│   ├── graph/
│   │   └── interview_graph.py  # LangGraph state graph definition
│   ├── tools/
│   │   ├── tavily_search.py    # Tavily research tool
│   │   └── resume_parser.py    # PDF resume text extraction
│   ├── models/                 # (Reserved for Pydantic models)
│   ├── .env                    # Environment variables (DO NOT COMMIT)
│   ├── .env.example            # Template for environment variables
│   ├── main.py                 # FastAPI application entry point
│   ├── routes.py               # API endpoint definitions
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Axios API client
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Resume upload & role selection
│   │   │   ├── GapAnalysisPage.jsx  # Skill gap display
│   │   │   ├── InterviewPage.jsx    # Chat-style interview
│   │   │   └── ResultsPage.jsx      # Evaluation results
│   │   ├── components/              # (Reserved for shared components)
│   │   ├── App.jsx                  # Router setup
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Tailwind + custom styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Groq API Key** (free at https://console.groq.com)
- **Tavily API Key** (free at https://tavily.com)

## Installation

### 1. Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example and fill in your API keys:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```
GROQ_API_KEY=gsk_your_actual_key_here
TAVILY_API_KEY=tvly-your_actual_key_here
MONGODB_URI=mongodb://localhost:27017
```

### 3. Frontend Setup

```powershell
cd frontend
npm install
```

## Running the Application

### Start MongoDB

Make sure MongoDB is running. If installed locally:

```powershell
mongod
```

Or use MongoDB Atlas with your connection string in `.env`.

### Start Backend (Terminal 1)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

### Start Frontend (Terminal 2)

```powershell
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

## How LangGraph Branching Works

The interview uses LangGraph conditional edges for dynamic flow:

```
START
  ↓
generate_question
  ↓
evaluate_answer
  ↓
┌─────────────────────┐
│  Is answer strong?  │
└─────┬───────┬───────┘
      │       │
   Yes│    No│ (and follow_up_count < 3)
      │       │
      ▼       ▼
  next_    generate_
  topic    followup
      │       │
      │       └──→ evaluate_answer (loop back)
      ▼
  generate_question (next topic)
      │
      ▼ (when all topics covered or max questions reached)
     END → save_transcript → evaluator_agent → final_report
```

- **Strong answer** → moves to next topic/question
- **Weak answer** → targeted follow-up on the weak area
- **Still weak** → another follow-up (max 3 per topic)
- **Max follow-ups reached** → moves to next topic
- **All topics covered** → interview ends

## Interviewer vs Evaluator Agent Separation

### Interviewer Agent (`agents/interviewer.py`)
- Conducts the live interview
- Generates questions based on resume, role, and gaps
- Evaluates each answer in real-time
- Decides on follow-ups vs next topics
- Has access to live conversation state

### Evaluator Agent (`agents/evaluator.py`)
- Receives ONLY the completed transcript, target role, and skill gaps
- No access to live interviewer context
- Independently analyzes the full conversation
- Generates structured scores and feedback
- Provides strengths, areas to improve, and overall assessment

## How Tavily is Used

1. Candidate selects "Backend Developer"
2. FastAPI calls `research_role_requirements("Backend Developer")`
3. Tavily searches: `"Backend Developer required skills responsibilities technologies 2025 2026"`
4. Returns real-world job requirements from current job postings
5. Requirements are compared against resume to identify gaps
6. Interview questions are tailored to these researched requirements

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start interview with resume upload |
| POST | `/api/interview/{id}/answer` | Submit answer, get next question |
| POST | `/api/interview/{id}/finish` | End interview, get evaluation |
| GET | `/api/interview/{id}` | Get interview data |
| GET | `/api/evaluation/{id}` | Get evaluation report |

## Example Interview Flow

1. Upload a resume with Python, Django, MySQL, REST API skills
2. Select "Backend Developer" as target role
3. Tavily researches: Docker, Cloud, System Design are common requirements
4. Gap analysis identifies: Docker knowledge unclear, Cloud experience unclear
5. UI shows evaluation plan with ⚠️ markers
6. Click "Start Interview"
7. AI asks: "How would you containerize a Django application?"
8. Candidate gives vague answer
9. AI detects weak answer, asks targeted follow-up
10. Candidate improves, AI moves to next topic
11. Interview continues for 8-10 questions
12. Interview ends, Evaluator Agent generates report
13. Results page shows scores, strengths, areas to improve, and transcript

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for LLM inference |
| `TAVILY_API_KEY` | Tavily API key for job research |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CORS_ORIGINS` | Comma-separated allowed origins (optional) |

**Never commit `.env` files.** They are included in `.gitignore`.

## Deploy on Render

Single Docker service: builds frontend + serves it from FastAPI.

1. Push this repo to GitHub.
2. On [Render](https://dashboard.render.com) → **New → Blueprint** → select the repo.
3. `render.yaml` creates the web service. Set env vars:
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY`
   - `MONGODB_URI` (Atlas SRV string)
   - `JWT_SECRET` (auto-generated or your own)
   - `CORS_ORIGINS` = `https://<your-service>.onrender.com`
4. Deploy. Health check: `https://<your-service>.onrender.com/api/health`

Local equivalent:

```powershell
cd frontend; npm run build
cd ..\backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` — API + UI both served.

## License

This project is built for educational purposes (Continuous Assessment).
