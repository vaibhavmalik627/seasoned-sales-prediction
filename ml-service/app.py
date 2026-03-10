import calendar
import os
from datetime import datetime

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from sklearn.linear_model import LinearRegression


class DemandForecaster:
    def __init__(self, data_path: str):
        self.data = self._load_and_prepare_data(data_path)
        self.items = sorted(self.data["item"].unique().tolist())
        self.stores = sorted(self.data["store"].unique().tolist())
        self.item_index = {item: idx for idx, item in enumerate(self.items)}
        self.store_index = {store: idx for idx, store in enumerate(self.stores)}
        self.model = LinearRegression()
        self._train_model()

    def _load_and_prepare_data(self, data_path: str) -> pd.DataFrame:
        if data_path and os.path.exists(data_path):
            raw_data = pd.read_csv(data_path)
        else:
            raw_data = self._generate_synthetic_data()

        required_columns = {"date", "store", "item", "sales"}
        missing = required_columns.difference(raw_data.columns)
        if missing:
            raise ValueError(f"Dataset is missing columns: {', '.join(sorted(missing))}")

        prepared = raw_data.copy()
        prepared["date"] = pd.to_datetime(prepared["date"], errors="coerce")
        prepared = prepared.dropna(subset=["date"])

        if pd.api.types.is_numeric_dtype(prepared["store"]):
            prepared["store"] = prepared["store"].astype(int).map(lambda value: f"Store-{value}")
        else:
            prepared["store"] = prepared["store"].astype(str)

        if pd.api.types.is_numeric_dtype(prepared["item"]):
            prepared["item"] = prepared["item"].astype(int).map(lambda value: f"Item-{value}")
        else:
            prepared["item"] = prepared["item"].astype(str)

        prepared["sales"] = pd.to_numeric(prepared["sales"], errors="coerce").fillna(0)
        prepared["sales"] = prepared["sales"].clip(lower=0)
        prepared = prepared.sort_values("date").reset_index(drop=True)
        return prepared

    def _generate_synthetic_data(self) -> pd.DataFrame:
        np.random.seed(42)

        date_index = pd.date_range(start="2021-01-01", end="2025-12-31", freq="D")
        stores = {"Store-1": 1.00, "Store-2": 1.15, "Store-3": 0.92}
        items = {
            "Jacket": 22,
            "Sweater": 18,
            "Boots": 12,
            "Jeans": 16,
            "Tshirt": 20,
            "Scarf": 10,
        }
        month_factor = {
            1: 1.25,
            2: 1.14,
            3: 1.02,
            4: 0.94,
            5: 0.92,
            6: 0.88,
            7: 0.90,
            8: 0.97,
            9: 1.04,
            10: 1.12,
            11: 1.34,
            12: 1.52,
        }

        rows = []
        winter_items = {"Jacket", "Sweater", "Boots", "Scarf"}

        for current_date in date_index:
            month = int(current_date.month)
            is_weekend = current_date.dayofweek >= 5

            for store_name, store_multiplier in stores.items():
                for item_name, base_demand in items.items():
                    expected = base_demand * month_factor[month] * store_multiplier

                    if item_name in winter_items and month in (11, 12, 1, 2):
                        expected += 10

                    if item_name == "Tshirt" and month in (5, 6, 7, 8):
                        expected += 7

                    if is_weekend:
                        expected += 4

                    noise = np.random.normal(loc=0.0, scale=max(expected * 0.10, 1.5))
                    sales = max(0, int(round(expected + noise)))

                    rows.append(
                        {
                            "date": current_date,
                            "store": store_name,
                            "item": item_name,
                            "sales": sales,
                        }
                    )

        return pd.DataFrame(rows)

    def _feature_frame(self, frame: pd.DataFrame) -> pd.DataFrame:
        return pd.DataFrame(
            {
                "month": frame["date"].dt.month,
                "day": frame["date"].dt.day,
                "year": frame["date"].dt.year,
                "day_of_week": frame["date"].dt.dayofweek,
                "is_weekend": (frame["date"].dt.dayofweek >= 5).astype(int),
                "store_id": frame["store"].map(self.store_index),
                "item_id": frame["item"].map(self.item_index),
            }
        )

    def _train_model(self) -> None:
        features = self._feature_frame(self.data)
        target = self.data["sales"]
        self.model.fit(features, target)

    def parse_month(self, month_value):
        if month_value is None or month_value == "":
            return None

        if isinstance(month_value, int):
            return month_value if 1 <= month_value <= 12 else None

        if isinstance(month_value, str):
            normalized = month_value.strip().lower()

            if normalized.isdigit():
                month_as_int = int(normalized)
                return month_as_int if 1 <= month_as_int <= 12 else None

            month_names = {calendar.month_name[idx].lower(): idx for idx in range(1, 13)}
            month_names.update({calendar.month_abbr[idx].lower(): idx for idx in range(1, 13)})
            return month_names.get(normalized)

        return None

    def _validate_item_store(self, item: str, store: str | None):
        if item not in self.item_index:
            raise ValueError(f"Unknown item '{item}'. Use /catalog to list available items.")

        if store and store not in self.store_index:
            raise ValueError(f"Unknown store '{store}'. Use /catalog to list available stores.")

    def predict_monthly_demand(self, item: str, month: int, year: int, store: str | None = None):
        if month < 1 or month > 12:
            raise ValueError("Month must be between 1 and 12.")

        self._validate_item_store(item, store)

        stores_to_predict = [store] if store else self.stores
        number_of_days = calendar.monthrange(year, month)[1]

        rows = []
        for current_store in stores_to_predict:
            for day in range(1, number_of_days + 1):
                rows.append(
                    {
                        "date": datetime(year, month, day),
                        "store": current_store,
                        "item": item,
                    }
                )

        prediction_frame = pd.DataFrame(rows)
        feature_frame = self._feature_frame(prediction_frame)
        daily_prediction = self.model.predict(feature_frame)
        monthly_total = float(np.clip(daily_prediction, 0, None).sum())

        historical_filter = (
            (self.data["item"] == item) &
            (self.data["date"].dt.month == month)
        )
        if store:
            historical_filter = historical_filter & (self.data["store"] == store)

        historical_monthly = (
            self.data.loc[historical_filter]
            .groupby(self.data.loc[historical_filter, "date"].dt.year)["sales"]
            .sum()
        )
        historical_average = float(historical_monthly.mean()) if not historical_monthly.empty else 0.0

        return {
            "item": item,
            "store": store or "All Stores",
            "month": month,
            "month_name": calendar.month_name[month],
            "year": year,
            "predicted_sales": int(round(monthly_total)),
            "historical_average": int(round(historical_average)) if historical_average else 0,
            "explanation": self._build_explanation(item, month, monthly_total, historical_average),
        }

    def _build_explanation(self, item: str, month: int, predicted: float, historical_average: float) -> str:
        month_name = calendar.month_name[month]

        if historical_average <= 0:
            trend_sentence = "Limited historical data was available for this segment."
        else:
            delta = ((predicted - historical_average) / historical_average) * 100
            if delta > 8:
                trend_sentence = f"Forecast is {abs(delta):.1f}% above its historical average for {month_name}."
            elif delta < -8:
                trend_sentence = f"Forecast is {abs(delta):.1f}% below its historical average for {month_name}."
            else:
                trend_sentence = f"Forecast is close to the historical average for {month_name}."

        seasonal_sentence = (
            "Seasonality and calendar features (month/day/year/weekend pattern) drive this estimate."
        )

        return f"{item} demand in {month_name}: {trend_sentence} {seasonal_sentence}"

    def sales_history(self, item: str | None = None, store: str | None = None, months: int = 24):
        frame = self.data.copy()

        if item:
            if item not in self.item_index:
                raise ValueError(f"Unknown item '{item}'.")
            frame = frame[frame["item"] == item]

        if store:
            if store not in self.store_index:
                raise ValueError(f"Unknown store '{store}'.")
            frame = frame[frame["store"] == store]

        monthly = (
            frame.set_index("date")
            .resample("MS")["sales"]
            .sum()
            .reset_index()
            .sort_values("date")
        )

        if months > 0:
            monthly = monthly.tail(months)

        history = [
            {
                "month": row["date"].strftime("%b %Y"),
                "sales": int(row["sales"]),
            }
            for _, row in monthly.iterrows()
        ]

        return {
            "item": item or "All Items",
            "store": store or "All Stores",
            "history": history,
        }

    def forecast(self, item: str, start_month: int, start_year: int, horizon: int, store: str | None = None):
        if horizon < 1 or horizon > 12:
            raise ValueError("Horizon must be between 1 and 12 months.")

        forecast_rows = []
        current_month = start_month
        current_year = start_year

        for _ in range(horizon):
            prediction = self.predict_monthly_demand(
                item=item,
                month=current_month,
                year=current_year,
                store=store,
            )

            forecast_rows.append(
                {
                    "month": f"{calendar.month_abbr[current_month]} {current_year}",
                    "month_number": current_month,
                    "year": current_year,
                    "predicted_sales": prediction["predicted_sales"],
                }
            )

            if current_month == 12:
                current_month = 1
                current_year += 1
            else:
                current_month += 1

        return {
            "item": item,
            "store": store or "All Stores",
            "horizon": horizon,
            "forecast": forecast_rows,
        }

    def analytics(self):
        monthly_sales = self.data.groupby(self.data["date"].dt.month)["sales"].sum()
        top_month_number = int(monthly_sales.idxmax())
        top_item = (
            self.data.groupby("item")["sales"]
            .sum()
            .sort_values(ascending=False)
            .index[0]
        )

        return {
            "total_products": len(self.items),
            "total_stores": len(self.stores),
            "highest_demand_month": calendar.month_name[top_month_number],
            "top_selling_product": top_item,
            "total_sales": int(self.data["sales"].sum()),
        }

    def catalog(self):
        return {
            "items": self.items,
            "stores": self.stores,
            "months": [calendar.month_name[idx] for idx in range(1, 13)],
        }


app = Flask(__name__)

model_data_path = os.getenv("ML_DATA_PATH", os.path.join(os.path.dirname(__file__), "data", "train.csv"))
forecaster = DemandForecaster(model_data_path)


@app.get("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "service": "ml-service",
        "rows_loaded": len(forecaster.data),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


@app.get("/catalog")
def get_catalog():
    return jsonify(forecaster.catalog())


@app.post("/predict")
def predict():
    try:
        payload = request.get_json(silent=True) or {}
        item = payload.get("product") or payload.get("item")
        month_raw = payload.get("month")
        year = int(payload.get("year", datetime.utcnow().year))
        store = payload.get("store")

        month = forecaster.parse_month(month_raw)
        if not item or month is None:
            return jsonify({"error": "`product` (or `item`) and valid `month` are required."}), 400

        result = forecaster.predict_monthly_demand(item=item, month=month, year=year, store=store)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.get("/sales-history")
def sales_history():
    try:
        item = request.args.get("item") or request.args.get("product")
        store = request.args.get("store")
        months = int(request.args.get("months", "24"))
        result = forecaster.sales_history(item=item, store=store, months=months)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to fetch sales history: {exc}"}), 500


@app.get("/forecast")
def forecast():
    try:
        now = datetime.utcnow()
        item = request.args.get("item") or request.args.get("product")
        store = request.args.get("store")
        horizon = int(request.args.get("horizon", "6"))

        start_month_raw = request.args.get("start_month")
        start_month = forecaster.parse_month(start_month_raw) if start_month_raw else now.month
        start_year = int(request.args.get("start_year", str(now.year)))

        if not item:
            return jsonify({"error": "`item` (or `product`) is required."}), 400
        if start_month is None:
            return jsonify({"error": "`start_month` must be a month name or number (1-12)."}), 400

        result = forecaster.forecast(
            item=item,
            store=store,
            start_month=start_month,
            start_year=start_year,
            horizon=horizon,
        )
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to build forecast: {exc}"}), 500


@app.get("/analytics")
def analytics():
    try:
        return jsonify(forecaster.analytics())
    except Exception as exc:
        return jsonify({"error": f"Unable to compute analytics: {exc}"}), 500


if __name__ == "__main__":
    # Prefer the platform-assigned PORT for managed deployments.
    flask_port = int(os.getenv("PORT", os.getenv("FLASK_PORT", "8000")))
    app.run(host="0.0.0.0", port=flask_port, debug=False)
