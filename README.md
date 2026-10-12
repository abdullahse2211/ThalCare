<![CDATA[# 🩸 ThalCare — Alpha Thalassemia Detection System

> AI-powered anomaly detection platform for differentiating Alpha Thalassemia subtypes from overlapping hematological conditions using a 5-model ensemble strategy.

![ThalCare Banner](https://github.com/user-attachments/assets/fdaeb7e4-cb6e-46bf-832b-489439476cdd)

---

## 📋 Overview

**ThalCare** is a full-stack clinical decision support system designed to detect and differentiate between closely overlapping hematological disorders:

- **Alpha Trait**
- **Silent Carrier**
- **Iron Deficiency**
- **Infection / Other**
- **Normal**

### Key Innovations

- **Overlapping Disease Detection** — Differentiates biological conditions with near-identical hematological profiles
- **5-Model Ensemble Strategy** — Combines Hybrid CNN-Transformer, 1-D CNN, Transformer, SVM, and Random Forest models
- **Probability & Confidence Voting** — Results determined through weighted probability and confidence-based ensemble voting
- **Heuristic Guard Layer** — Secondary verification layer grounded in hematological philosophy to validate AI predictions

---

## 🏗️ Architecture

```
ThalCare-main/
├── frontend/          # React + Vite SPA (TailwindCSS)
│   ├── src/
│   │   ├── components/    # Reusable UI components (auth, admin, doctor, lab-tech, shared)
│   │   ├── pages/         # Role-based page views
│   │   ├── context/       # Auth context provider
│   │   ├── hooks/         # Custom React hooks
│   │   ├── api/           # Axios API client
│   │   ├── constants/     # App-wide constants
│   │   ├── layouts/       # Dashboard layout
│   │   └── utils/         # Utility functions
│   └── ALPHA_THAL_DATA/   # Dataset download instructions
│
├── backend/           # FastAPI REST API
│   ├── main.py            # Application entry point
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic validation schemas
│   ├── database.py        # Database engine configuration
│   ├── auth_handler.py    # JWT authentication handler
│   └── routers/           # API route modules
│       ├── auth.py        # Authentication endpoints
│       ├── patients.py    # Patient management
│       ├── tests.py       # Lab test management
│       ├── predictions.py # ML prediction engine
│       ├── admin.py       # Admin operations
│       └── analytics.py   # Analytics & reporting
│
└── Brain/             # ML Inference Engine
    ├── config.py          # Model hyperparameters & paths
    ├── model.py           # Neural network architecture definitions
    ├── preprocessing.py   # Feature engineering & data preprocessing
    ├── inference.py       # Multi-model inference pipeline
    ├── models/            # Trained model weights (.pth, .pkl)
    └── parameters/        # Scalers, metadata, audit results
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **TailwindCSS 3** | Utility-first CSS |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **React Hook Form + Zod** | Form handling & validation |
| **Lucide React** | Icon library |
| **React Hot Toast** | Notifications |
| **React Dropzone** | File upload |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **SQLAlchemy 2** | ORM |
| **Alembic** | Database migrations |
| **Pydantic v2** | Data validation |
| **python-jose** | JWT tokens |
| **Passlib (bcrypt)** | Password hashing |

### Machine Learning (Brain)
| Model | Type |
|---|---|
| **Hybrid CNN-Transformer** | Deep Learning (PyTorch) |
| **1-D CNN** | Deep Learning (PyTorch) |
| **Transformer** | Deep Learning (PyTorch) |
| **SVM** | Classical ML (scikit-learn) |
| **Random Forest** | Classical ML (scikit-learn) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.10
- **pip** (Python package manager)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/thelked-main.git
cd thelked-main
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --reload --port 5000
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 👥 User Roles

ThalCare supports three distinct user roles with role-based access control:

| Role | Capabilities |
|---|---|
| **Doctor** | Dashboard, patient management, view predictions & analytics, order tests |
| **Lab Technician** | Dashboard, patient registration, test entry, file upload, manage lab tests |
| **Admin** | Dashboard, user management, audit logs, system configuration |

---

## 🔌 API Endpoints

| Module | Base Path | Description |
|---|---|---|
| **Auth** | `/api/v1/auth` | Login, registration, token refresh |
| **Patients** | `/api/v1/patients` | CRUD operations for patient records |
| **Tests** | `/api/v1/tests` | Lab test management |
| **Predictions** | `/api/v1/predictions` | ML model inference |
| **Admin** | `/api/v1/admin` | User management, audit logs |
| **Analytics** | `/api/v1/analytics` | Reporting & statistics |
| **Health** | `/api/v1/health` | System health check |

---

## 🧪 ML Pipeline

The prediction engine uses a **Chaos Protocol** training strategy for robustness:

1. **Gaussian Noise Injection** (σ = 0.60) across all numerical features
2. **Feature Dropout** (10%) on select columns (`rdw`, `hba2`, `Mentzer_Index`)
3. **Biological Mimicry** — Extra noise on `hb` and `rbc` to blur Infection vs Iron Deficiency boundaries
4. **Label Noise** (12%) — Random label swaps between confusing classes

Predictions are generated through **confidence-weighted ensemble voting** across all 5 models, followed by a **heuristic guard layer** for clinical validation.

---

## 📁 Datasets

The system was trained on multiple publicly available hematological datasets. See [`frontend/ALPHA_THAL_DATA/download_instructions.md`](frontend/ALPHA_THAL_DATA/download_instructions.md) for download links and details.

---

## 🔒 Environment Variables

Copy the example environment file and configure:

```bash
cp frontend/.env.example frontend/.env
```

Key variables:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api/v1` |
| `VITE_APP_ENV` | Environment mode | `development` |
| `VITE_ENABLE_ML_PREDICTIONS` | Enable ML engine | `true` |
| `VITE_MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` |

---

## 📄 License

This project is developed as a Final Year Project (FYP). All rights reserved.

---

## 🤝 Contributing

This is a personal academic project. For inquiries, please contact the project owner.
]]>
