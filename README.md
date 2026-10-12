# ThalCare: Alpha Thalassemia Anomaly Detection System

ThalCare is a clinical decision support system designed to detect and differentiate Alpha Thalassemia conditions from overlapping hematological disorders using routine Complete Blood Count (CBC) parameters and hemoglobin electrophoresis data.

Screening for Alpha Thalassemia (including Alpha Trait and Silent Carrier states) frequently presents diagnostic difficulties due to borderline indices that overlap with Iron Deficiency Anemia and non-specific infections. ThalCare processes standard laboratory panels, calculates derived clinical indices, and classifies patient profiles across five diagnostic categories using an ensemble of deep learning and classical machine learning models coupled with a heuristic verification layer.

## Overview

The system classifies patient hematological profiles into five distinct categories:

- Alpha Trait
- Silent Carrier
- Iron Deficiency
- Infection / Other
- Normal

Predictions are generated through a multi-model ensemble pipeline followed by clinical rule-based checks to ensure biological plausibility before results are presented to clinicians.

## Key Features

- Multi-Model Ensemble: Combines predictions from five distinct model architectures (Hybrid CNN-Transformer, 1D CNN, Transformer, Support Vector Machine, and Random Forest) using probability and confidence-weighted voting.
- Automatic Index Derivation: Calculates clinically recognized diagnostic indices (Mentzer Index and Srivastava Index) directly from submitted laboratory values.
- Heuristic Guard Layer: Applies rule-based hematological constraints to model outputs to prevent biologically inconsistent classifications.
- Role-Based Access Control: Dedicated interfaces and workflows tailored for Doctors, Laboratory Technicians, and System Administrators.
- Audit Logging: Tracks test submissions, prediction history, and administrative activity within the application.

## Technologies Used

### Machine Learning and Data Processing
- PyTorch: Neural network architectures (Hybrid CNN-Transformer, 1D CNN, Transformer)
- scikit-learn: Support Vector Machine and Random Forest classifiers
- joblib: Model serialization and feature scaler management
- NumPy and Pandas: Numerical operations and data handling

### Backend
- FastAPI: Asynchronous REST API framework
- Uvicorn: ASGI server implementation
- SQLAlchemy 2.0: Object-relational mapping
- Pydantic v2: Request validation and data serialization
- SQLite: Relational database engine
- python-jose and Passlib: JWT authentication and password hashing

### Frontend
- React 18: Single-page application framework
- Vite: Build tool and development server
- Tailwind CSS: Application styling and layout
- React Router v6: Client-side routing
- Axios: HTTP client for API communication
- Recharts: Diagnostic data visualization
- React Hook Form and Zod: Form state management and schema validation
- Lucide React: Icon components

## Project Structure

```
.
├── Brain/
│   ├── config.py               # Hyperparameters, label mappings, and directory paths
│   ├── model.py                # PyTorch architectures (CNN1D, Transformer, Hybrid)
│   ├── preprocessing.py        # Feature scaling and preprocessing pipelines
│   ├── inference.py            # DiagnosticEngine class and ensemble voting logic
│   ├── models/                 # Serialized model weights (.pth, .pkl)
│   └── parameters/             # Feature scalers and configuration artifacts
├── backend/
│   ├── main.py                 # FastAPI application entry point and middleware
│   ├── database.py             # Database engine and session configuration
│   ├── models.py               # SQLAlchemy database models
│   ├── schemas.py              # Pydantic request and response schemas
│   ├── auth_handler.py         # JWT authentication logic
│   ├── requirements.txt        # Backend Python dependencies
│   ├── start_backend.bat       # Startup script for Windows
│   └── routers/
│       ├── auth.py             # User authentication and token management
│       ├── patients.py         # Patient record management
│       ├── tests.py            # Laboratory test submissions
│       ├── predictions.py      # Diagnostic prediction endpoints
│       ├── analytics.py        # System reporting and diagnostics metrics
│       └── admin.py            # User administration and audit logs
├── frontend/
│   ├── index.html              # HTML document template
│   ├── package.json            # Node.js dependencies and scripts
│   ├── vite.config.js          # Vite build configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── start_frontend.bat      # Startup script for Windows
│   ├── src/
│   │   ├── App.jsx             # Main router and route definitions
│   │   ├── main.jsx            # React root component mounting
│   │   ├── api/                # API client configuration and endpoints
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Application state and authentication context
│   │   ├── layouts/            # Dashboard layout components
│   │   ├── pages/              # Role-specific page views
│   │   └── utils/              # Client-side utility functions
│   └── ALPHA_THAL_DATA/        # Dataset sources and download instructions
├── .gitignore                  # Git exclusion rules
└── README.md                   # Project documentation
```

## How It Works

1. Laboratory Parameter Input: The system accepts fifteen standard Complete Blood Count and hemoglobin electrophoresis values: Sex, Hemoglobin (Hb), Red Blood Cell count (RBC), Packed Cell Volume (PCV), Mean Corpuscular Volume (MCV), Mean Corpuscular Hemoglobin (MCH), Mean Corpuscular Hemoglobin Concentration (MCHC), Red Cell Distribution Width (RDW), White Blood Cell count (WBC), Neutrophils, Lymphocytes, Platelet count (PLT), HbA, HbA2, and HbF.
2. Index Computation: Two diagnostic ratios are derived automatically:
   - Mentzer Index = MCV / RBC
   - Srivastava Index = MCH / RBC
3. Feature Scaling: The complete 17-feature vector is scaled using the inference scaler (`inference_scaler.joblib`).
4. Ensemble Inference:
   - Deep learning models (Hybrid CNN-Transformer, 1D CNN, Transformer) and classical classifiers (SVM, Random Forest) compute probability distributions across the five target classes.
   - Predictions are synthesized using confidence-weighted ensemble voting.
5. Heuristic Validation: The predicted classification is evaluated against established hematological guidelines to verify that indices match expected clinical patterns.

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

### Clone Repository

```bash
git clone https://github.com/abdullahse2211/thelked-main.git
cd thelked-main
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd ../frontend
npm install
```

## Configuration

### Frontend Configuration

Copy the example environment file and adjust if necessary:

```bash
cd frontend
cp .env.example .env
```

Default environment variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=ThalCare
```

### Database

The SQLite database (`thalcare.db`) is automatically initialized and migrated on the first run of the backend service.

## How to Run

### Start the Backend

From the `backend` directory with the virtual environment activated:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The interactive API documentation is accessible at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

The web application will be accessible at: http://localhost:5173

### Windows Batch Scripts

Convenience scripts are provided to run each service directly on Windows:
- Backend: `backend/start_backend.bat`
- Frontend: `frontend/start_frontend.bat`
