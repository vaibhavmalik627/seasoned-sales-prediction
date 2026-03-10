# Seasonal Demand Forecasting Tool for Retail

Full-stack demo of a production-style GenAI/ML architecture:

`React Frontend -> Express API -> Python ML Service -> Forecast Response -> UI`

## 1) Architecture

- `frontend` (React + Vite): dashboard, form-driven prediction, charts, and forecast table
- `backend` (legacy backend copy): original Express API location retained for reference
- `ml-service` (Python + Flask + scikit-learn): loads retail sales data, trains linear regression, serves predictions/analytics
- repository root: SnapDeploy-compatible Node.js backend entrypoint

## 2) Features Implemented

- `POST /predict`: predict seasonal demand by product + month (+ optional store/year)
- `GET /sales-history`: monthly historical sales for charting
- `GET /forecast`: multi-month demand forecast (default 6 months)
- Retail analytics dashboard:
  - total products
  - total stores
  - highest demand month
  - top selling product
- AI-style explanation text generated from historical vs predicted trend deltas

## 3) Dataset

The ML service expects Kaggle-style columns:

- `date`
- `store`
- `item`
- `sales`

Use Kaggle `train.csv` from:
https://www.kaggle.com/competitions/demand-forecasting-kernels-only

Place it at:

- `ml-service/data/train.csv`

If this file is not present, the app auto-generates a synthetic retail dataset with strong seasonality so the full pipeline still runs.

## 4) Project Structure

```text
project-root/
package.json
package-lock.json
server.js
config/
controllers/
models/
routes/
services/
backend/
frontend/
ml-service/
```

## 5) Run Locally

Open 3 terminals from project root.

### A) Start ML Service

```bash
cd ml-service
python -m venv .venv
# Windows
.venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:8000`.

### B) Start Backend

```bash
npm install
copy .env.example .env
npm start
```

Runs on `http://localhost:5000`.

### C) Start Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Runs on `http://localhost:5173`.

## 6) API Examples

### Predict

```http
POST /api/predict
Content-Type: application/json

{
  "product": "Jacket",
  "month": "December",
  "year": 2026,
  "store": "Store-1"
}
```

### Multi-month Forecast

```http
GET /api/forecast?item=Jacket&horizon=6&start_month=October&start_year=2026
```

### Sales History

```http
GET /api/sales-history?item=Jacket&months=24
```

## 7) Notes

- Regression features include `month`, `day`, `year`, `day_of_week`, `is_weekend`, `store_id`, and `item_id`.
- Forecasting is performed at daily granularity and aggregated to monthly demand.
- PostgreSQL was kept optional; this demo uses in-memory dataframe processing for fast setup.

## 8) Deploy on Render

This repo includes a [`render.yaml`](./render.yaml) blueprint for a three-service deployment:

- `retail-demand-frontend` as a static site
- `retail-demand-backend` as a Node web service
- `retail-demand-ml-service` as a Python web service

Steps:

1. Push the repo to GitHub.
2. In Render, create a new Blueprint instance from the repo.
3. Render will provision all 3 services and wire these env vars automatically:
   - `VITE_API_BASE_URL`
   - `ML_SERVICE_URL`
   - `CORS_ORIGIN`

Deployment notes:

- The frontend accepts either `https://your-backend-host` or `https://your-backend-host/api` for `VITE_API_BASE_URL`.
- The ML service now honors `PORT`, which managed platforms like Render inject automatically.
- If you want production-grade Python serving later, swap `python app.py` for Gunicorn and add it to `requirements.txt`.

## 9) Deploy on SnapDeploy

SnapDeploy expects the deployable Node service to be present at the repository root. This repo now exposes the backend from the root with:

- `package.json`
- `server.js`
- `routes/`
- `controllers/`
- `models/`
- `config/`

Required backend environment variables:

- `PORT`
- `ML_SERVICE_URL`
- `CORS_ORIGIN`

The current backend does not use MongoDB, Cloudinary, or JWT-based authentication, so there are no required `MONGO_*`, `CLOUDINARY_*`, or `JWT_*` variables for this project.
