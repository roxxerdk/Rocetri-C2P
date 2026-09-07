# Rocetri C2P

## Computer-Aided Engineering to Production (C2P) Workflow Platform

Rocetri C2P is a full-stack engineering workflow platform designed to support the journey from **Computer-Aided Engineering Data (CAED)** to **production planning and reporting**.

The platform brings together a React-based frontend and a NestJS backend to manage projects, engineering data, validation, process planning, workflow execution, job tracking, AI-assisted operations, and report generation.

The repository is organized into two major applications:

* **Frontend** — User interface and workflow interaction
* **Backend** — APIs, business logic, database, workflow orchestration, engineering processing, and AI integrations

---

# 1. Project Overview

The objective of Rocetri C2P is to provide a structured digital workflow for transforming engineering information into production-ready planning information.

The high-level workflow is:

```text
Project Creation
      ↓
Project / Version Management
      ↓
CAED Data Intake
      ↓
Engineering Data Extraction
      ↓
Validation & Verification
      ↓
Process Planning
      ↓
Manufacturing Workflow
      ↓
Report Generation
```

The system is designed so that engineering and manufacturing information can move through a controlled sequence rather than being handled through disconnected manual processes.

---

# 2. High-Level System Architecture

Rocetri C2P follows a full-stack architecture:

```text
                    ┌─────────────────────────┐
                    │        User              │
                    │     Web Browser          │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       FRONTEND           │
                    │   React + Vite           │
                    │                          │
                    │ • Dashboard              │
                    │ • Project Management     │
                    │ • CAED Workflow          │
                    │ • Validation             │
                    │ • Process Planning       │
                    │ • Reports                │
                    └────────────┬────────────┘
                                 │
                           HTTP / REST API
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        BACKEND           │
                    │   NestJS + TypeScript    │
                    │                          │
                    │ • Projects               │
                    │ • Jobs                   │
                    │ • Engineering            │
                    │ • Validation             │
                    │ • Planning               │
                    │ • Workflow               │
                    │ • Reports                │
                    │ • AI Integration         │
                    └───────┬─────────┬───────┘
                            │         │
                 ┌──────────┘         └──────────┐
                 ▼                               ▼
        ┌─────────────────┐             ┌─────────────────┐
        │    MongoDB      │             │   AI Providers  │
        │   + Mongoose    │             │ Gemini / Qwen   │
        └─────────────────┘             └─────────────────┘
```

---

# 3. Frontend

## 3.1 Frontend Purpose

The frontend provides the user-facing interface through which users interact with the C2P workflow.

It is implemented using:

* React
* Vite
* JavaScript / ES Modules
* React Router DOM
* Custom CSS

The frontend currently represents the C2P workflow through an interactive prototype and is structured to support integration with the backend services.

---

# 4. Frontend Workflow

The frontend is organized around the following workflow:

### Dashboard

The dashboard acts as the starting point of the application.

It provides:

* Project/job overview
* Navigation
* Job cards
* Project access
* Workflow entry points

---

### Project and Version Management

After selecting a project, users can work with project versions.

The project workflow supports:

* Project identification
* Version selection
* Project metadata
* Navigation between workflow stages
* Version-aware workflow interaction

The frontend maintains active project/version information through React state and URL information.

---

### CAED Workflow

The CAED section represents the engineering-data intake stage.

The intended purpose is to bring engineering information into the C2P workflow before extraction and validation.

The current frontend contains the workflow interface and placeholders required for further integration with real CAED processing services.

---

### Extraction and Validation

This stage focuses on reviewing engineering parameters extracted from engineering data.

The interface provides:

* Parameter tables
* Editable values
* Validation indicators
* Confidence information
* Low-confidence indicators
* AI-style assistant interaction

The goal is to allow users to review engineering information before it moves into production planning.

---

### Process Planning

Process Planning converts validated engineering information into manufacturing-oriented planning information.

The interface supports:

* Adding planning rows
* Removing rows
* Clearing planning data
* Editing metadata
* Reordering planning operations
* Drag-and-drop interaction
* CSV export
* Assistant interaction
* Transition toward report generation

---

### Report Generation

The report stage represents the final output of the workflow.

The frontend currently provides:

* Report generation interface
* Generation status
* Report naming
* Download functionality
* Delete functionality
* Auto-generation option

The current implementation simulates report generation and is structured for integration with real backend report-generation services.

---

# 5. Frontend Architecture

The frontend uses React component-based architecture.

The application separates:

```text
Pages
   ↓
Components
   ↓
Workflow Sections
   ↓
Styling / UI
```

React state is used to control:

* Active workflow page
* Active project version
* Version list
* Sidebar state
* Report generation behavior
* User interactions

Routing is handled through React Router.

The current prototype also uses URL query parameters and local React state to represent workflow context.

---

# 6. Frontend Data Flow

The current frontend is primarily a prototype.

Therefore, much of the data is currently represented through:

* Mock objects
* Mock arrays
* React state
* Event handlers
* Simulated asynchronous operations
* URL parameters

The frontend does **not yet depend completely on the backend for persistence**.

The intended future architecture is:

```text
User Action
     ↓
React UI
     ↓
API Request
     ↓
NestJS Backend
     ↓
Business Logic
     ↓
MongoDB / AI Services
     ↓
API Response
     ↓
React UI Update
```

---

# 7. Backend

## 7.1 Backend Purpose

The backend is responsible for providing the server-side infrastructure required by the C2P platform.

It is built using:

* NestJS 11
* TypeScript
* MongoDB
* Mongoose
* NestJS Config
* Validation mechanisms
* AI integrations

The backend provides the foundation for:

* Project management
* Job management
* Engineering processing
* Validation
* Process planning
* Workflow orchestration
* Reporting
* AI-assisted functionality

---

# 8. Backend Architecture

The backend follows a modular NestJS architecture.

Major modules include:

```text
backend/
│
├── src/
│   ├── ai/
│   ├── config/
│   ├── database/
│   ├── engineering/
│   ├── jobs/
│   ├── planning/
│   ├── projects/
│   ├── reports/
│   ├── shared/
│   ├── validation/
│   ├── workflow/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── package.json
├── package-lock.json
├── nest-cli.json
└── tsconfig.json
```

Each module is intended to isolate a specific area of responsibility.

---

# 9. Backend Modules

## AI

The AI module provides the foundation for integrating Large Language Model services into the C2P workflow.

The backend currently supports configuration for:

* Google Gemini
* Qwen

AI services can be used as part of future engineering-data interpretation, assistance, validation, and planning workflows.

---

## Configuration

The configuration module centralizes environment-based configuration.

Important configuration values include:

* Server port
* Runtime environment
* MongoDB connection
* Gemini configuration
* Qwen configuration

Environment variables are used so that sensitive credentials and deployment-specific settings are not hard-coded into the application.

---

## Database

The database layer is based on:

**MongoDB + Mongoose**

MongoDB is intended to provide persistent storage for application data.

Mongoose provides schema-based interaction between the NestJS application and MongoDB.

---

## Engineering

The engineering module is responsible for engineering-related processing.

It forms part of the pipeline between engineering data intake and downstream validation/planning.

---

## Jobs

The jobs module manages job-related backend functionality.

A job represents a unit of work within the C2P workflow.

This provides the foundation for tracking and managing processing activities.

---

## Projects

The projects module manages project-level functionality.

Projects form the primary organizational unit around which versions, engineering data, planning, and reports can be associated.

---

## Planning

The planning module supports manufacturing/process planning.

Its purpose is to represent the production planning stage after engineering information has been reviewed and validated.

---

## Reports

The reports module is responsible for backend report-related functionality.

It provides the foundation for moving report generation from the current frontend prototype toward server-side report generation and persistence.

---

## Validation

The validation module supports verification of incoming and processed information.

Validation is important because engineering data must be checked before it becomes part of the production planning workflow.

---

## Workflow

The workflow module provides orchestration across the different stages of the C2P process.

The intended workflow can be represented as:

```text
Project
   ↓
Job
   ↓
Engineering Data
   ↓
Extraction
   ↓
Validation
   ↓
Planning
   ↓
Report
```

---

## Shared

The shared module contains functionality intended to be reused across backend modules.

This helps prevent duplication and provides common infrastructure for the application.

---

# 10. Backend Request Processing

The backend uses a standard NestJS request lifecycle.

Conceptually:

```text
Frontend Request
       ↓
     Router
       ↓
   Controller
       ↓
     Service
       ↓
Business Logic
       ↓
Database / AI / Other Services
       ↓
   Response
       ↓
Frontend
```

The backend uses a global `/api` prefix.

The default development API address is:

```text
http://localhost:3000/api
```

---

# 11. Validation and Error Handling

The backend uses NestJS validation mechanisms to validate incoming request data.

The application is configured with a global `ValidationPipe`.

The configuration includes:

* Whitelisting
* Transformation of request values
* Structured validation

A custom HTTP exception filter is also part of the runtime configuration to provide centralized error handling.

---

# 12. AI Integration

AI is an important part of the planned C2P workflow.

The backend provides configuration for multiple AI providers:

### Google Gemini

Configuration includes:

```text
GEMINI_API_KEY
GEMINI_MODEL
```

### Qwen

Configuration includes:

```text
QWEN_API_KEY
QWEN_MODEL
QWEN_BASE_URL
```

The architecture allows AI functionality to be incorporated into areas such as:

* Engineering data interpretation
* Data assistance
* Validation assistance
* Planning assistance
* Workflow support

AI credentials must be stored in environment variables and should never be committed to Git.

---

# 13. Frontend ↔ Backend Integration

The intended full-stack communication model is:

```text
                  ROCETRI C2P

        ┌─────────────────────────┐
        │       React Frontend    │
        │                         │
        │ Dashboard               │
        │ Projects                │
        │ CAED                    │
        │ Validation              │
        │ Planning                │
        │ Reports                 │
        └────────────┬────────────┘
                     │
                  REST API
                     │
                     ▼
        ┌─────────────────────────┐
        │      NestJS Backend     │
        │                         │
        │ Controllers             │
        │ Services                │
        │ Workflow                │
        │ Validation              │
        │ Engineering             │
        │ Planning                │
        │ Reports                 │
        └───────┬─────────┬───────┘
                │         │
                ▼         ▼
            MongoDB      AI
```

The frontend is responsible for presentation and user interaction.

The backend is responsible for:

* Business logic
* Persistence
* Processing
* Validation
* Workflow management
* AI service integration
* API responses

---

# 14. Repository Structure

The complete repository is organized as:

```text
Rocetri-C2P/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── README.md
│
├── backend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── README.md
│
├── .gitignore
└── README.md
```

### Important

The root `README.md` documents the **complete system**.

The individual:

```text
frontend/README.md
backend/README.md
```

remain separate documentation for their respective applications.

---

# 15. Prerequisites

Before running the complete system, install:

* Node.js 18 or later
* npm
* MongoDB
* Git

For backend AI functionality, configure the required provider API credentials.

---

# 16. Running the Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server normally runs on:

```text
http://localhost:5173
```

For a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

# 17. Running the Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure the required environment variables.

Then start the development server:

```bash
npm run start:dev
```

The backend normally runs on:

```text
http://localhost:3000
```

The API base path is:

```text
http://localhost:3000/api
```

---

# 18. Backend Environment Configuration

Example development configuration:

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/c2p

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

QWEN_API_KEY=your_qwen_api_key
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

**Do not commit real API keys or secrets to GitHub.**

Use environment files or deployment-specific secret management instead.

---

# 19. Backend Commands

Development:

```bash
npm run start:dev
```

Debug mode:

```bash
npm run start:debug
```

Build:

```bash
npm run build
```

Production:

```bash
npm run start:prod
```

Standard start:

```bash
npm run start
```

---

# 20. Current Project Status

Rocetri C2P is currently under active development.

The frontend contains a functional workflow-oriented prototype demonstrating the intended user experience.

The backend provides the modular NestJS foundation required for the complete application.

Some parts of the overall workflow are still being integrated.

Current development areas include:

* Frontend/backend API integration
* Persistent project data
* Real CAED data processing
* Engineering-data extraction
* Production-grade validation
* AI-assisted processing
* Database-backed workflow state
* Production report generation
* Authentication and authorization
* Deployment configuration

---

# 21. Current Prototype Limitations

The current frontend prototype should not be considered a fully production-ready system yet.

Some functionality is represented through:

* Mock data
* Simulated operations
* Local React state
* Placeholder interfaces
* Simulated report generation
* Prototype AI-style interactions

The complete production implementation will require connecting these interfaces to the backend APIs and persistent services.

---

# 22. Planned Future Development

Future development can include:

### Backend Integration

Connect every frontend workflow stage to the corresponding backend API.

### CAED Processing

Implement real engineering-file ingestion and extraction.

### AI Engineering Analysis

Use AI services to assist with engineering-data interpretation and verification.

### Database Persistence

Persist projects, versions, jobs, engineering parameters, planning operations, and reports.

### Authentication

Introduce secure user authentication.

### Role-Based Access Control

Support different roles and permissions for engineering, planning, management, and administrative users.

### Production Reporting

Generate complete production-ready reports in appropriate document formats.

### Deployment

Prepare the system for secure cloud/on-premise deployment.

### Monitoring

Introduce application logging, monitoring, error tracking, and operational observability.

---

# 23. Development Philosophy

The project is structured around separation of responsibilities.

### Frontend

Responsible for:

* User interface
* Navigation
* Workflow visualization
* User interactions
* Data presentation

### Backend

Responsible for:

* APIs
* Business logic
* Workflow orchestration
* Validation
* Database interaction
* AI integration
* Report processing

### Database

Responsible for:

* Persistent application data
* Project information
* Workflow information
* Planning information
* Report-related data

### AI Layer

Responsible for intelligent assistance and future engineering-data processing capabilities.

This separation allows each part of the platform to evolve independently while maintaining a clear system architecture.

---

# 24. End-to-End C2P Vision

The long-term objective of Rocetri C2P is to establish a continuous digital workflow:

```text
ENGINEERING
     │
     ▼
CAED DATA
     │
     ▼
DATA EXTRACTION
     │
     ▼
VALIDATION
     │
     ▼
ENGINEERING VERIFICATION
     │
     ▼
PROCESS PLANNING
     │
     ▼
MANUFACTURING WORKFLOW
     │
     ▼
REPORT GENERATION
     │
     ▼
PRODUCTION
```

The platform aims to reduce disconnected manual steps and provide a structured path from engineering information to manufacturing-oriented output.

---

# 25. Documentation

Detailed application-specific documentation is available inside each application:

* `frontend/README.md` — Frontend-specific documentation
* `backend/README.md` — Backend-specific documentation
* `README.md` — Complete full-stack project documentation

---

# 26. License

No project license is currently specified in the repository.

---

## Rocetri C2P

**Computer-Aided Engineering to Production**

A full-stack platform connecting engineering data, validation, process planning, AI-assisted workflows, and production reporting.
