# ContractAI - Intelligent Contract Negotiator

![Project Status](https://img.shields.io/badge/status-MVP-blue)
![License](https://img.shields.io/badge/license-Portfolio-green)

**ContractAI** is a specialized tool for automated legal contract analysis. It ingests PDF/DOCX documents, extracts clause-level data, and uses local LLMs (Llama 3 via Ollama) to assess risks, check for compliance, and suggest protective rewrites.

> **Disclaimer**: This is a technical portfolio project by **[Anthony Max](http://anthonymax.com/)**. It demonstrates architecture and AI integration skills. **It offers no legal guarantees.**

## 🏗 System Architecture

The project is built as a distributed system with a strict separation of concerns (Clean Architecture).

### Backend (`/backend`)
A high-performance **FastAPI** service responsible for document processing and LLM orchestration.
- **Runtime**: Python 3.10+
- **API**: FastAPI (Async/Await)
- **AI Integration**: Custom Gateway using `OpenAI` SDK to communicate with **Ollama** (Llama 3).
- **Document Parsing**:
  - `PyMuPDF` (Fitz) for PDF extraction.
  - `python-docx` for Word documents.
  - *Note: `faiss-cpu` & `LangChain` are installed for future RAG capabilities.*
- **Architecture**: Domain-Driven Design (DDD) layers (`domain`, `application`, `infrastructure`, `presentation`).

### Frontend (`/frontend`)
A modern, reactive UI built for speed and accessibility.
- **Framework**: Next.js (App Router)
- **State/UI**: React 19, Tailwind CSS, Shadcn/UI.
- **Client Features**:
  - `html2canvas` + `jspdf` for client-side report generation.
  - Framer Motion for micro-interactions.
  - Responsive glassmorphism design.

## 🚀 Quick Start

### Prerequisites
1.  **Docker & Docker Compose** (Recommended)
2.  **Ollama** installed on host machine (`ollama serve`).
3.  Pull model: `ollama run llama3`.

### Option 1: Docker (Recommended)
The project is configured with a unified environment.

1.  **Configure Environment**
    ```bash
    cp .env.example .env
    # Edit .env if needed (default works for local Ollama)
    ```

2.  **Run Application**
    ```bash
    docker-compose up --build
    ```
    The app will be available at **http://localhost:3000**.

### Option 2: Manual Setup

#### 1. Backend Service
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Server (using root .env if supported, otherwise configure local variables)
export $(cat ../.env | xargs) && uvicorn src.presentation.api.main:app --reload --port 8000
```

#### 2. Frontend Application
```bash
cd frontend

# Install dependencies
npm install

# Run Development Server
npm run dev
```

The app will be available at **http://localhost:3000**.

## 🔌 API Endpoints

- `POST /api/upload`: Upload PDF/DOCX files. Returns parsed text and metadata.
- `POST /api/analyze`: Trigger LLM analysis on specific contract ID.
- `GET /health`: Service health check.

## 🛠 Project Structure

```bash
.
├── backend
│   ├── src
│   │   ├── application    # Use cases (ParseDocument, AnalyzeContract)
│   │   ├── domain         # Entities (Clause, Contract), Interfaces
│   │   ├── infrastructure # Parsers (PyMuPDF), LLM Gateway (Ollama)
│   │   └── presentation   # API Routes & Main entry point
│   └── requirements.txt
└── frontend
    └── src/app            # Next.js Pages (Home, Analysis, Terms, Privacy)
    └── src/components     # Reusable UI (Analysis View, Upload Area)
```

## 🔒 Security & Privacy

- **Local Processing**: By default, this system connects to a local Ollama instance. No data leaves your machine if configured locally.
- **No Persistence**: The MVP uses in-memory or temporary storage for the session.

## 👨‍💻 Author

**Anthony Max**
*AI Product Builder | Full Stack Engineer*

- [Website](http://anthonymax.com/)
- [GitHub](https://github.com/anthonydaros)
