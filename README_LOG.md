# Project Log

## Overview

This project is a full-stack retail demand forecasting demo built around a simple service-oriented pipeline:

`React frontend -> Express backend -> Flask ML service -> forecast and analytics response`

The application allows a user to:

- view retail KPI metrics
- inspect historical sales trends
- generate single-month demand predictions
- generate multi-month forecasts

The project is structured to look like a small production-style system, where the frontend does not talk directly to the Python model service. Instead, the Node.js backend acts as the API gateway.

## Purpose

The main goal of the project is to demonstrate how a machine learning forecasting workflow can be exposed through a modern web application.

This includes:

- a user-facing dashboard
- a backend integration layer
- an ML inference service
- synthetic data fallback when no external dataset is available

## High-Level Architecture

### 1. Frontend

Location: [frontend](c:\Users\vaibhavmalik\Desktop\genai\frontend)

Stack:

- React
- Vite
- Recharts
- Axios

Responsibilities:

- render the dashboard and forecast pages
- collect user input from forms
- call backend API endpoints
- display KPI cards, tables, and charts

Main files:

- [frontend/src/App.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\App.jsx)
- [frontend/src/pages/Dashboard.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\pages\Dashboard.jsx)
- [frontend/src/pages/Forecast.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\pages\Forecast.jsx)
- [frontend/src/api/client.js](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\api\client.js)

### 2. Backend

Location: [backend](c:\Users\vaibhavmalik\Desktop\genai\backend)

Stack:

- Node.js
- Express
- Axios

Responsibilities:

- expose frontend-safe API endpoints under `/api`
- validate and normalize request payloads
- forward requests to the ML service
- standardize service errors

Main files:

- [backend/server.js](c:\Users\vaibhavmalik\Desktop\genai\backend\server.js)
- [backend/controllers/forecast.controller.js](c:\Users\vaibhavmalik\Desktop\genai\backend\controllers\forecast.controller.js)
- [backend/services/ml.service.js](c:\Users\vaibhavmalik\Desktop\genai\backend\services\ml.service.js)

### 3. ML Service

Location: [ml-service](c:\Users\vaibhavmalik\Desktop\genai\ml-service)

Stack:

- Python
- Flask
- pandas
- numpy
- scikit-learn

Responsibilities:

- load historical sales data
- generate synthetic data if the dataset is missing
- engineer date/store/item features
- train a regression model
- return predictions, forecast sequences, history, catalog, and analytics

Main file:

- [ml-service/app.py](c:\Users\vaibhavmalik\Desktop\genai\ml-service\app.py)

## Request Flow

### Dashboard flow

1. The frontend loads catalog and analytics from the backend.
2. The backend forwards those requests to the ML service.
3. The ML service returns available items, stores, and KPI values.
4. The frontend renders KPI cards and filter controls.
5. When a product or store changes, the frontend requests sales history and forecast data.

### Prediction flow

1. The user submits the forecast form.
2. The frontend sends the request to `POST /api/predict`.
3. The backend validates item, month, year, and optional store.
4. The backend forwards the normalized payload to the ML service.
5. The ML service predicts daily demand for the target month and aggregates it to a monthly value.
6. The frontend displays the result, explanation text, chart, and forecast table.

## API Surface

### Backend endpoints

Base URL: `http://localhost:5000/api`

- `GET /catalog`
- `GET /analytics`
- `GET /sales-history`
- `GET /forecast`
- `POST /predict`

### ML service endpoints

Base URL: `http://localhost:8000`

- `GET /health`
- `GET /catalog`
- `GET /analytics`
- `GET /sales-history`
- `GET /forecast`
- `POST /predict`

## Data Model

The ML service expects data with these columns:

- `date`
- `store`
- `item`
- `sales`

If `ml-service/data/train.csv` does not exist, the service creates synthetic retail data with:

- multiple stores
- multiple products
- seasonal month effects
- weekend effects
- winter-heavy item patterns
- random noise for realism

This means the app remains runnable even without downloading the Kaggle dataset.

## Forecasting Logic

The ML service trains a `LinearRegression` model using derived features:

- month
- day
- year
- day_of_week
- is_weekend
- store_id
- item_id

For a requested future month, the service:

1. creates one row per day of the month
2. maps the selected item and store to numeric IDs
3. predicts daily sales
4. clips negative values
5. sums the predictions into a monthly total

It also calculates a historical average for the same month and item, and produces a short explanation describing whether the prediction is above, below, or near the historical baseline.

## Frontend Components

### Dashboard page

File: [frontend/src/pages/Dashboard.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\pages\Dashboard.jsx)

Responsibilities:

- loads catalog and analytics
- selects a default item
- fetches historical and forecast series
- renders KPI cards, filters, chart, and forecast table

### Forecast page

File: [frontend/src/pages/Forecast.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\pages\Forecast.jsx)

Responsibilities:

- loads available items and stores
- submits forecast requests
- renders forecast summary, chart, and multi-month table

### Shared UI components

- [frontend/src/components/ForecastForm.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\components\ForecastForm.jsx)
- [frontend/src/components/ForecastTable.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\components\ForecastTable.jsx)
- [frontend/src/components/KpiCards.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\components\KpiCards.jsx)
- [frontend/src/components/SalesChart.jsx](c:\Users\vaibhavmalik\Desktop\genai\frontend\src\components\SalesChart.jsx)

## Backend Responsibilities in Detail

The backend does more than simple proxying.

It also:

- converts month names like `December` into month numbers
- supports both `item` and `product` field naming
- clamps forecast horizon into a safe range
- converts network and service failures into cleaner user-facing errors

This keeps the frontend simpler and isolates ML-service-specific behavior from the UI.

## Operational Notes

### Environment variables

Backend example:

- [backend/.env.example](c:\Users\vaibhavmalik\Desktop\genai\backend\.env.example)

Frontend example:

- [frontend/.env.example](c:\Users\vaibhavmalik\Desktop\genai\frontend\.env.example)

### Default ports

- frontend: `5173`
- backend: `5000`
- ML service: `8000`

## Run Instructions

From the project root, start all three services in separate terminals.

### ML service

```powershell
cd .\ml-service
python app.py
```

If needed:

```powershell
cd .\ml-service
& "C:\Users\vaibhavmalik\Desktop\genai\.venv\Scripts\python.exe" app.py
```

### Backend

```powershell
cd .\backend
npm run dev
```

### Frontend

```powershell
cd .\frontend
npm run dev
```

Open:

- `http://localhost:5173`

## Verification Status

The project was validated with the following checks:

- backend health endpoint responded successfully
- backend catalog endpoint responded successfully
- backend prediction endpoint responded successfully
- ML service endpoints responded successfully
- frontend production build completed successfully

## Fix Log

### Issue fixed

The ML service dependency pins in [ml-service/requirements.txt](c:\Users\vaibhavmalik\Desktop\genai\ml-service\requirements.txt) were too strict for the Python version present in this environment.

Original problem:

- pinned scientific packages did not install on Python `3.14.3`
- this prevented the ML service from starting
- without the ML service, the backend and frontend forecasting flow could not work

### Resolution

The dependency file was updated to version ranges:

- `flask>=3.1,<4`
- `joblib>=1.4,<2`
- `numpy>=2.3`
- `pandas>=2.3`
- `python-dateutil>=2.9,<3`
- `scikit-learn>=1.7`

This allowed package installation and restored the project runtime flow.

## Known Limitations

- the model is a simple linear regression baseline, not a production forecasting model
- predictions are only as realistic as the synthetic or provided dataset
- the frontend production build warns about a large bundle size
- there are currently no automated tests in the repository

## Suggested Next Improvements

- add automated API and UI tests
- split the frontend bundle to reduce build warning noise
- add loading and empty states in more UI paths
- persist historical data in a database instead of in-memory dataframe processing
- replace the baseline regression model with a stronger time-series approach

