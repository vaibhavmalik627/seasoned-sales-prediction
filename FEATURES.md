# Feature Guide

## Product Summary

This project is a retail forecasting and planning tool built for store managers, planners, and analysts who need:

- demand forecasts from sales history
- store-level and product-level planning views
- reorder and stock risk guidance
- forecast trust signals through accuracy metrics
- AI explanations and business recommendations
- a way to upload custom retail CSV datasets

## Core Retail Features

### 1. Store Account Access

What it does:

- lets retail users create a store account
- supports login, logout, and protected frontend routes
- stores accounts and sessions in MongoDB

Form fields:

- `Store Name`
- `Contact Name`
- `Email`
- `Password`
- `Confirm Password`

Problem it solves:

- gives each retail user a protected workspace before using forecasting and AI tools

### 2. Dashboard

What it does:

- shows KPI cards for products, stores, seasonal peaks, and top sellers
- visualizes historical sales and forecast trends
- supports product and store filters
- surfaces AI insight and chat access from the main workflow

Problem it solves:

- gives a fast operational view of retail demand without reading raw data manually

### 3. Forecast

What it does:

- predicts future demand for a selected product, month, year, and store
- supports holiday uplift scenarios
- shows forecast tables and charts with confidence context
- exports forecast data as CSV
- generates AI explanation, demand story, report, and chat assistance

Problem it solves:

- helps planners estimate upcoming demand before placing inventory decisions

### 4. Confidence View

What it does:

- shows confidence bounds around forecast output
- visualizes forecast uncertainty for planning
- exports the forecast confidence view as CSV

Problem it solves:

- helps users avoid treating a forecast like a guaranteed number

### 5. Accuracy

What it does:

- backtests the model on recent periods
- shows `MAPE`, `MAE`, `RMSE`, and `Bias`
- displays actual vs predicted outcomes
- adds AI explanation of forecast quality

Problem it solves:

- helps users decide whether the forecast is strong enough for business action

### 6. Reorder Planning

What it does:

- calculates reorder point, safety stock, and recommended order quantity
- estimates coverage days and stockout risk
- supports holiday uplift assumptions
- adds AI inventory advice
- exports reorder results as CSV

Problem it solves:

- converts forecast numbers into concrete replenishment actions

### 7. Risk Dashboard

What it does:

- highlights stockout and overstock exposure by product
- supports store, lead-time, stock, and holiday assumptions
- summarizes the portfolio with AI inventory advice
- exports risk output as CSV

Problem it solves:

- helps planners identify which products need urgent action first

### 8. CSV Dataset Upload

What it does:

- lets users upload their own sales history CSV
- refreshes catalog, analytics, forecast, reorder, and risk flows against uploaded data
- supports AI data-quality review on uploaded records

Required schema:

```csv
date,store,item,sales
2025-01-01,Store-1,Jacket,43
```

Problem it solves:

- allows the tool to run on store-specific data instead of only demo records

## AI / LLM Features

### 9. AI Insight Panel

What it does:

- explains forecast output in business language
- summarizes demand change, likely drivers, and planning actions
- uses OpenAI when configured, otherwise a deterministic fallback

Problem it solves:

- makes forecast output understandable for non-technical retail users

### 10. Natural Language Query

What it does:

- answers questions like:
  - `Which product will sell the most next month?`
  - `What items should I stock more?`
  - `Which store has the highest demand?`
- performs intent detection and computes answers from forecast/analytics context before prompting the LLM

Problem it solves:

- allows users to ask business questions directly instead of reading multiple dashboard panels

### 11. AI Inventory Advisor

What it does:

- explains reorder urgency
- summarizes stockout vs overstock exposure
- suggests replenishment actions from reorder and risk results

Problem it solves:

- turns planning metrics into manager-friendly recommendations

### 12. AI Data Quality Analysis

What it does:

- reviews uploaded retail datasets for potential issues
- flags missing values, duplicates, suspicious spikes, and structure problems

Problem it solves:

- helps users trust the uploaded data before acting on forecasts

### 13. AI Demand Storytelling

What it does:

- summarizes recurring seasonal demand behavior for a product
- explains trends such as winter spikes or stable base demand

Problem it solves:

- helps non-technical stakeholders understand seasonal patterns quickly

### 14. AI Metric Explanation

What it does:

- explains `MAPE`, `MAE`, `RMSE`, and `Bias` in plain business language
- describes what the current accuracy means operationally

Problem it solves:

- makes model quality understandable to users who do not work with ML metrics

### 15. AI Forecast Report

What it does:

- generates a manager-style forecast summary
- can be exported to PDF from the frontend

Problem it solves:

- gives users a report-ready artifact they can share internally

### 16. Conversational Forecast Assistant

What it does:

- provides a chat interface for forecast, demand, and inventory questions
- uses report-aware context from the active page
- persists chat history in MongoDB for each logged-in store account

Problem it solves:

- turns the forecasting tool into an interactive assistant instead of a static dashboard

### 17. AI Workspace

What it does:

- aggregates the major AI surfaces in one page
- brings together:
  - data quality
  - AI insights
  - natural language query
  - inventory advisor
  - demand storytelling
  - AI report generation
  - Forecast AI chat

Problem it solves:

- gives users one place to work with all LLM outputs instead of navigating across pages

## User Value

Useful for:

- retail store owners
- inventory planners
- demand planners
- category managers
- ecommerce operators
- business analysts

Business value:

- fewer stockouts
- lower excess inventory
- better seasonal planning
- easier forecast interpretation
- faster decision-making from uploaded retail data
