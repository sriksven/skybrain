# Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.8+
- Git

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/sriksven/skybrain.git
cd skybrain
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
