# API Documentation

## Overview
Skybrain provides a RESTful API for accessing flight data, airport status, and weather information.

## Base URL
`https://skybrain-api.fly.dev` (Production)
`http://localhost:8000` (Local)

## Endpoints

### 1. Get Airport Status
**POST** `/api/airport-status`

Request Body:
```json
{
  "airport_code": "JFK"
}
```

Response:
```json
{
  "airport": "JFK",
  "status": "Delayed",
  "delay_time": "45 mins"
}
```

### 2. Compare Airports
**POST** `/api/compare`

Request Body:
```json
{
  "airport_codes": ["JFK", "LAX"]
}
```

## Authentication
Currently, the API is open for demonstration purposes. Future versions will require an API key.
