import calendar
import os
from datetime import UTC, datetime
from io import StringIO

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from sklearn.linear_model import LinearRegression


class DemandForecaster:
    def __init__(self, data_path: str):
        self.data_source = "synthetic"
        self.model = LinearRegression()
        initial_data = self._load_and_prepare_data(data_path)
        if data_path and os.path.exists(data_path):
            self.data_source = data_path
        self._set_dataset(initial_data)

    def _load_and_prepare_data(self, data_path: str) -> pd.DataFrame:
        if data_path and os.path.exists(data_path):
            raw_data = pd.read_csv(data_path)
        else:
            raw_data = self._generate_synthetic_data()

        return self._prepare_frame(raw_data)

    def _prepare_frame(self, raw_data: pd.DataFrame) -> pd.DataFrame:

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

    def _set_dataset(self, prepared_data: pd.DataFrame) -> None:
        self.data = prepared_data
        self.items = sorted(self.data["item"].unique().tolist())
        self.stores = sorted(self.data["store"].unique().tolist())
        self.item_index = {item: idx for idx, item in enumerate(self.items)}
        self.store_index = {store: idx for idx, store in enumerate(self.stores)}
        self._train_model()

    def upload_dataset(self, csv_content: str, source_name: str = "uploaded.csv") -> dict:
        if not csv_content.strip():
            raise ValueError("Uploaded CSV content is empty.")

        raw_frame = pd.read_csv(StringIO(csv_content))
        self.data_source = source_name
        self._set_dataset(self._prepare_frame(raw_frame))
        return {
            "rows_loaded": len(self.data),
            "items_loaded": len(self.items),
            "stores_loaded": len(self.stores),
            "data_source": self.data_source,
        }

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
        fitted_values = self.model.predict(features)
        residuals = target - fitted_values
        self.residual_std = float(np.std(residuals)) if len(residuals) else 0.0

    def _train_model_from_frame(self, frame: pd.DataFrame) -> LinearRegression:
        model = LinearRegression()
        features = self._feature_frame(frame)
        target = frame["sales"]
        model.fit(features, target)
        return model

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

    def predict_monthly_demand(
        self,
        item: str,
        month: int,
        year: int,
        store: str | None = None,
        holiday_boost: float = 0.0,
    ):
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
        monthly_total = self._apply_holiday_adjustment(monthly_total, month, holiday_boost)
        confidence_band = self._monthly_confidence_band(number_of_days, len(stores_to_predict))

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
            "lower_bound": max(0, int(round(monthly_total - confidence_band))),
            "upper_bound": max(0, int(round(monthly_total + confidence_band))),
            "historical_average": int(round(historical_average)) if historical_average else 0,
            "holiday_boost": round(holiday_boost, 2),
            "explanation": self._build_explanation(item, month, monthly_total, historical_average, holiday_boost),
        }

    def _monthly_confidence_band(self, number_of_days: int, number_of_stores: int) -> float:
        daily_std = max(self.residual_std, 1.0)
        scaled_std = daily_std * np.sqrt(max(number_of_days * number_of_stores, 1))
        # Approximate 80% interval for a practical planning range.
        return float(1.28 * scaled_std)

    def _predict_monthly_total_with_model(
        self,
        model: LinearRegression,
        item: str,
        month: int,
        year: int,
        store: str | None = None,
    ) -> float:
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
        daily_prediction = model.predict(feature_frame)
        return float(np.clip(daily_prediction, 0, None).sum())

    def _apply_holiday_adjustment(self, monthly_total: float, month: int, holiday_boost: float) -> float:
        if holiday_boost <= 0:
            return monthly_total

        seasonal_weight = 1.0 if month in (11, 12, 1) else 0.55
        return monthly_total * (1 + (holiday_boost / 100.0) * seasonal_weight)

    def _build_explanation(
        self,
        item: str,
        month: int,
        predicted: float,
        historical_average: float,
        holiday_boost: float = 0.0,
    ) -> str:
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
        holiday_sentence = ""
        if holiday_boost > 0:
            holiday_sentence = f" A holiday uplift of {holiday_boost:.0f}% was applied for planning."

        return f"{item} demand in {month_name}: {trend_sentence} {seasonal_sentence}{holiday_sentence}"

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

    def forecast(
        self,
        item: str,
        start_month: int,
        start_year: int,
        horizon: int,
        store: str | None = None,
        holiday_boost: float = 0.0,
    ):
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
                holiday_boost=holiday_boost,
            )

            forecast_rows.append(
                {
                    "month": f"{calendar.month_abbr[current_month]} {current_year}",
                    "month_number": current_month,
                    "year": current_year,
                    "predicted_sales": prediction["predicted_sales"],
                    "lower_bound": prediction["lower_bound"],
                    "upper_bound": prediction["upper_bound"],
                    "holiday_boost": prediction["holiday_boost"],
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
            "holiday_boost": round(holiday_boost, 2),
            "forecast": forecast_rows,
        }

    def reorder_recommendation(
        self,
        item: str,
        month: int,
        year: int,
        current_stock: int,
        lead_time_days: int,
        store: str | None = None,
        service_level: float = 0.80,
        holiday_boost: float = 0.0,
    ):
        if current_stock < 0:
            raise ValueError("`current_stock` must be zero or greater.")
        if lead_time_days < 1 or lead_time_days > 180:
            raise ValueError("`lead_time_days` must be between 1 and 180.")

        prediction = self.predict_monthly_demand(
            item=item,
            month=month,
            year=year,
            store=store,
            holiday_boost=holiday_boost,
        )

        monthly_demand = float(prediction["predicted_sales"])
        days_in_month = max(calendar.monthrange(year, month)[1], 1)
        daily_demand = monthly_demand / days_in_month

        lead_time_demand = daily_demand * lead_time_days
        band_width = max(prediction["upper_bound"] - prediction["predicted_sales"], 0)
        lead_time_ratio = min(lead_time_days / days_in_month, 1.0)
        safety_factor = min(max(service_level, 0.50), 0.99)
        safety_stock = int(round(band_width * max(lead_time_ratio, 0.35) * (0.75 + safety_factor)))
        reorder_point = int(round(lead_time_demand + safety_stock))
        recommended_order = max(0, reorder_point - current_stock)

        if current_stock < reorder_point * 0.7:
            stockout_risk = "High"
        elif current_stock < reorder_point:
            stockout_risk = "Medium"
        else:
            stockout_risk = "Low"

        coverage_days = float(current_stock / daily_demand) if daily_demand > 0 else float("inf")

        return {
            "item": item,
            "store": store or "All Stores",
            "month": month,
            "month_name": calendar.month_name[month],
            "year": year,
            "current_stock": current_stock,
            "lead_time_days": lead_time_days,
            "predicted_sales": prediction["predicted_sales"],
            "lower_bound": prediction["lower_bound"],
            "upper_bound": prediction["upper_bound"],
            "lead_time_demand": int(round(lead_time_demand)),
            "safety_stock": safety_stock,
            "reorder_point": reorder_point,
            "recommended_order_quantity": recommended_order,
            "stockout_risk": stockout_risk,
            "estimated_coverage_days": 999 if coverage_days == float("inf") else int(round(coverage_days)),
            "holiday_boost": round(holiday_boost, 2),
            "explanation": (
                f"Plan for {prediction['predicted_sales']} units in {calendar.month_name[month]}. "
                f"With {lead_time_days} lead-time days, keep about {safety_stock} units as safety stock."
            ),
        }

    def risk_dashboard(
        self,
        month: int,
        year: int,
        current_stock: int,
        lead_time_days: int,
        store: str | None = None,
        holiday_boost: float = 0.0,
    ):
        rows = []
        for item in self.items:
            recommendation = self.reorder_recommendation(
                item=item,
                month=month,
                year=year,
                current_stock=current_stock,
                lead_time_days=lead_time_days,
                store=store,
                holiday_boost=holiday_boost,
            )
            if recommendation["current_stock"] > recommendation["upper_bound"] * 1.35:
                inventory_risk = "Overstock"
            elif recommendation["stockout_risk"] == "High":
                inventory_risk = "Stockout"
            else:
                inventory_risk = "Balanced"

            rows.append(
                {
                    "item": item,
                    "predicted_sales": recommendation["predicted_sales"],
                    "lower_bound": recommendation["lower_bound"],
                    "upper_bound": recommendation["upper_bound"],
                    "reorder_point": recommendation["reorder_point"],
                    "recommended_order_quantity": recommendation["recommended_order_quantity"],
                    "stockout_risk": recommendation["stockout_risk"],
                    "inventory_risk": inventory_risk,
                }
            )

        ranked = sorted(
            rows,
            key=lambda row: (
                {"Stockout": 0, "Balanced": 1, "Overstock": 2}[row["inventory_risk"]],
                -row["recommended_order_quantity"],
            ),
        )
        return {
            "store": store or "All Stores",
            "month": month,
            "month_name": calendar.month_name[month],
            "year": year,
            "current_stock_assumption": current_stock,
            "lead_time_days": lead_time_days,
            "holiday_boost": round(holiday_boost, 2),
            "summary": {
                "stockout_items": sum(1 for row in ranked if row["inventory_risk"] == "Stockout"),
                "overstock_items": sum(1 for row in ranked if row["inventory_risk"] == "Overstock"),
                "balanced_items": sum(1 for row in ranked if row["inventory_risk"] == "Balanced"),
            },
            "items": ranked,
        }

    def accuracy(self, item: str, store: str | None = None, months: int = 6):
        self._validate_item_store(item, store)
        months = max(3, min(months, 12))

        filtered = self.data[self.data["item"] == item].copy()
        if store:
            filtered = filtered[filtered["store"] == store]

        monthly_actuals = (
            filtered.set_index("date")
            .resample("MS")["sales"]
            .sum()
            .reset_index()
            .sort_values("date")
        )

        if len(monthly_actuals) < months + 3:
            raise ValueError(
                f"At least {months + 3} months of history are required to compute accuracy."
            )

        holdout = monthly_actuals.tail(months).copy()
        holdout_start = holdout.iloc[0]["date"]
        training_frame = self.data[self.data["date"] < holdout_start].copy()

        if len(training_frame) < 30:
            raise ValueError("Not enough historical rows are available to backtest the model.")

        model = self._train_model_from_frame(training_frame)

        rows = []
        absolute_errors = []
        squared_errors = []
        percentage_errors = []
        signed_errors = []

        for _, monthly_row in holdout.iterrows():
            month_date = monthly_row["date"]
            actual_sales = int(monthly_row["sales"])
            predicted_sales = int(
                round(
                    self._predict_monthly_total_with_model(
                        model=model,
                        item=item,
                        month=int(month_date.month),
                        year=int(month_date.year),
                        store=store,
                    )
                )
            )

            error = predicted_sales - actual_sales
            absolute_error = abs(error)

            absolute_errors.append(absolute_error)
            squared_errors.append(error ** 2)
            signed_errors.append(error)

            if actual_sales > 0:
                percentage_errors.append((absolute_error / actual_sales) * 100)

            rows.append(
                {
                    "month": month_date.strftime("%b %Y"),
                    "actual_sales": actual_sales,
                    "predicted_sales": predicted_sales,
                    "absolute_error": int(round(absolute_error)),
                }
            )

        mae = float(np.mean(absolute_errors)) if absolute_errors else 0.0
        rmse = float(np.sqrt(np.mean(squared_errors))) if squared_errors else 0.0
        mape = float(np.mean(percentage_errors)) if percentage_errors else 0.0
        bias = float(np.mean(signed_errors)) if signed_errors else 0.0

        return {
            "item": item,
            "store": store or "All Stores",
            "months_evaluated": len(rows),
            "metrics": {
                "mae": round(mae, 1),
                "rmse": round(rmse, 1),
                "mape": round(mape, 1),
                "bias": round(bias, 1),
            },
            "history": rows,
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
            "data_source": self.data_source,
        }

    def catalog(self):
        return {
            "items": self.items,
            "stores": self.stores,
            "months": [calendar.month_name[idx] for idx in range(1, 13)],
            "data_source": self.data_source,
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
        "data_source": forecaster.data_source,
        "timestamp": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
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
        year = int(payload.get("year", datetime.now(UTC).year))
        store = payload.get("store")
        holiday_boost = float(payload.get("holiday_boost", 0))

        month = forecaster.parse_month(month_raw)
        if not item or month is None:
            return jsonify({"error": "`product` (or `item`) and valid `month` are required."}), 400

        result = forecaster.predict_monthly_demand(
            item=item,
            month=month,
            year=year,
            store=store,
            holiday_boost=holiday_boost,
        )
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
        now = datetime.now(UTC)
        item = request.args.get("item") or request.args.get("product")
        store = request.args.get("store")
        horizon = int(request.args.get("horizon", "6"))
        holiday_boost = float(request.args.get("holiday_boost", "0"))

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
            holiday_boost=holiday_boost,
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


@app.get("/accuracy")
def accuracy():
    try:
        item = request.args.get("item") or request.args.get("product")
        store = request.args.get("store")
        months = int(request.args.get("months", "6"))

        if not item:
            return jsonify({"error": "`item` (or `product`) is required."}), 400

        return jsonify(forecaster.accuracy(item=item, store=store, months=months))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to compute accuracy: {exc}"}), 500


@app.post("/reorder-recommendation")
def reorder_recommendation():
    try:
        payload = request.get_json(silent=True) or {}
        item = payload.get("product") or payload.get("item")
        store = payload.get("store")
        month_raw = payload.get("month")
        year = int(payload.get("year", datetime.now(UTC).year))
        current_stock = int(payload.get("current_stock", 0))
        lead_time_days = int(payload.get("lead_time_days", 14))
        service_level = float(payload.get("service_level", 0.80))
        holiday_boost = float(payload.get("holiday_boost", 0))

        month = forecaster.parse_month(month_raw)
        if not item or month is None:
            return jsonify({"error": "`product` (or `item`) and valid `month` are required."}), 400

        result = forecaster.reorder_recommendation(
            item=item,
            month=month,
            year=year,
            current_stock=current_stock,
            lead_time_days=lead_time_days,
            store=store,
            service_level=service_level,
            holiday_boost=holiday_boost,
        )
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to build reorder recommendation: {exc}"}), 500


@app.get("/risk-dashboard")
def risk_dashboard():
    try:
        now = datetime.now(UTC)
        month_raw = request.args.get("month")
        month = forecaster.parse_month(month_raw) if month_raw else now.month
        year = int(request.args.get("year", str(now.year)))
        current_stock = int(request.args.get("current_stock", "250"))
        lead_time_days = int(request.args.get("lead_time_days", "14"))
        store = request.args.get("store")
        holiday_boost = float(request.args.get("holiday_boost", "0"))

        if month is None:
            return jsonify({"error": "`month` must be a month name or number (1-12)."}), 400

        result = forecaster.risk_dashboard(
            month=month,
            year=year,
            current_stock=current_stock,
            lead_time_days=lead_time_days,
            store=store,
            holiday_boost=holiday_boost,
        )
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to compute risk dashboard: {exc}"}), 500


@app.post("/dataset")
def upload_dataset():
    try:
        payload = request.get_json(silent=True) or {}
        csv_content = payload.get("csv_content", "")
        file_name = payload.get("file_name", "uploaded.csv")
        return jsonify(forecaster.upload_dataset(csv_content=csv_content, source_name=file_name))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to load dataset: {exc}"}), 500


if __name__ == "__main__":
    flask_port = int(os.getenv("FLASK_PORT", "8000"))
    app.run(host="0.0.0.0", port=flask_port, debug=False)
