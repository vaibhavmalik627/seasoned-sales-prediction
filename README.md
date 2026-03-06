# Seasonal Demand Forecasting Tool for Retail

Full-stack demo of a production-style GenAI/ML architecture:

`React Frontend -> Express API -> Python ML Service -> Forecast Response -> UI`

## 1) Architecture

- `frontend` (React + Vite): dashboard, form-driven prediction, charts, and forecast table
- `backend` (Node.js + Express): API gateway with clean route/controller/service layers
- `ml-service` (Python + Flask + scikit-learn): loads retail sales data, trains linear regression, serves predictions/analytics

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
.
├─ backend
│  ├─ controllers/forecast.controller.js
│  ├─ routes/predict.routes.js
│  ├─ routes/sales.routes.js
│  ├─ services/ml.service.js
│  └─ server.js
├─ frontend
│  ├─ src/components/ForecastForm.jsx
│  ├─ src/components/SalesChart.jsx
│  ├─ src/pages/Dashboard.jsx
│  ├─ src/pages/Forecast.jsx
│  └─ src/App.jsx
└─ ml-service
   └─ app.py
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
cd backend
npm install
copy .env.example .env
npm run dev
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

