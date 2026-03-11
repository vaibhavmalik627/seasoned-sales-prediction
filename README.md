# Seasonal Demand Forecasting Tool

An AI-assisted retail planning platform for seasonal demand forecasting, inventory decisions, data quality checks, and natural-language analytics.

## Stack

- `frontend`: React + Vite
- `backend`: Node.js + Express
- `ml-service`: Flask + scikit-learn
- `database`: MongoDB for store accounts and AI chat history

## Key Capabilities

- store account signup and login
- MongoDB-backed retail store auth and session handling
- dataset upload for custom retail sales history
- demand forecasting with confidence ranges
- reorder and risk planning
- accuracy backtesting
- AI-generated forecast explanations
- AI inventory advisor
- natural-language analytics queries
- AI data quality review after CSV upload
- AI demand storytelling
- AI forecast report generation with PDF export
- conversational forecast assistant with persisted chat history
- dedicated `AI Workspace` page that aggregates the AI features

## Local Setup

Open 3 terminals from the project root.

### 1. Start MongoDB

Use a local MongoDB server, for example:

```bash
mongodb://localhost:27017
```

The backend expects:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=seasonal_demand_forecasting
```

### 2. Start ML Service

```bash
cd ml-service
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:8000`.

### 3. Start Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Runs on `http://localhost:5000`.

Required backend env values:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=seasonal_demand_forecasting
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is omitted, the AI endpoints fall back to deterministic business explanations.

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Sample Data

A ready-to-upload retail dataset is included at:

- `sample-data/retail-sales-upload.csv`

Required upload schema:

```csv
date,store,item,sales
2025-01-01,Store-1,Jacket,43
```

## Main Routes

- `/` home
- `/auth` store login and create account
- `/dashboard`
- `/forecast`
- `/confidence`
- `/reorder`
- `/risk`
- `/accuracy`
- `/ai-workspace`

## Core API Surface

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Forecasting and Retail Analytics

- `POST /api/predict`
- `GET /api/forecast`
- `GET /api/sales-history`
- `GET /api/analytics`
- `GET /api/catalog`
- `GET /api/accuracy`
- `POST /api/reorder-recommendation`
- `GET /api/risk-dashboard`
- `POST /api/dataset`

### AI Endpoints

- `POST /api/ai/insights`
- `POST /api/ai/inventory-advice`
- `POST /api/ai/query`
- `POST /api/ai/data-quality`
- `POST /api/ai/report`
- `POST /api/ai/story`
- `POST /api/ai/metric-explanation`
- `POST /api/ai/chat`
- `GET /api/ai/chat/history`
- `DELETE /api/ai/chat/history`

## Notes

- The ML service can generate synthetic retail training data if `ml-service/data/train.csv` is missing.
- Forecasting remains model-driven; the LLM layer explains results and generates recommendations.
- AI chat is report-aware and can use active forecast/report context from the page.
- AI chat history is persisted per logged-in retail store in MongoDB.
- The forecast report panel can export a manager-facing PDF from the frontend.
- Uploading a CSV replaces the active in-memory dataset used by the running ML service.

## Feature Documentation

Detailed functional coverage is in [FEATURES.md](FEATURES.md).
