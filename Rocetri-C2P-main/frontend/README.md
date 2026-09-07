# Rocetri C2P

A React-based front-end prototype for a C2P workflow system used to manage project jobs, review extracted CAED data, plan manufacturing operations, and generate production-ready reports.

This project focuses on the complete user journey and interaction flow rather than backend infrastructure. The current implementation demonstrates how a job moves through a digital engineering workflow in the browser, from dashboard selection to project versioning, validation, planning, and final report generation.

## What has been implemented so far

The app currently models a realistic engineering workflow in the frontend:

- Dashboard for browsing and tracking multiple jobs
- Project detail screen with version management and sidebar navigation
- CAED workflow area for uploaded design references
- Extraction & Validation page with AI-style parameter review
- Process Planning page for operation sequencing and export
- Report generation section with simulated generation and status tracking

## Technical architecture

The project is built as a Vite React application, with the UI split into reusable page and section components.

### Core app flow

The routing is defined in [frontend-react/src/App.jsx](frontend-react/src/App.jsx):

- `/` => Dashboard
- `/project` => Project workflow screen

The central orchestration happens in [frontend-react/src/pages/Project.jsx](frontend-react/src/pages/Project.jsx), which manages the active workflow state such as:

- `activePage` (`caed`, `extraction`, `planning`, `report`)
- `activeVersion`
- `versions`
- `sidebarExpanded`
- `autoGenerateReport`

This parent state pattern allows child workflow sections to coordinate actions and move the user forward through the process.

### Component structure

The application is organized around a modular UI architecture:

- [frontend-react/src/pages](frontend-react/src/pages) contains the major screens
- [frontend-react/src/components](frontend-react/src/components) contains shared components like navbar, job cards, sidebar, and floating timestamp UI
- [frontend-react/src/sections](frontend-react/src/sections) contains the main functional workflow stages
- [frontend-react/src/styles](frontend-react/src/styles) contains custom styling for the overall experience

## Feature breakdown

### Dashboard

Implemented in [frontend-react/src/pages/Dashboard.jsx](frontend-react/src/pages/Dashboard.jsx).

Features include:

- static job list cards for different engineering projects
- top navigation bar and page shell
- routing to project-specific screens using query params
- actions like Search and New Job as UI placeholders

### Job/project detail and versioning

Implemented in [frontend-react/src/pages/Project.jsx](frontend-react/src/pages/Project.jsx) and [frontend-react/src/components/Sidebar.jsx](frontend-react/src/components/Sidebar.jsx).

Features include:

- collapsible sidebar
- version dropdown and version creation flow
- dynamic page switching between workflow stages
- project metadata carried through URL params
- floating date/time status indicator

### CAED section

Implemented in [frontend-react/src/sections/CaedSection.jsx](frontend-react/src/sections/CaedSection.jsx).

This section acts as the document intake workflow, with a visual placeholder for a CAED image and a structured engineering review layout.

### Extraction & Validation

Implemented in [frontend-react/src/sections/ExtractionSection.jsx](frontend-react/src/sections/ExtractionSection.jsx).

This section models the review process for extracted engineering values:

- parameter table with extracted dimensions and values
- editable cells using `contentEditable`
- validation status badges and checked verification state
- AI-style assistant chat panel
- confidence levels and low-confidence highlighting

The logic reflects a human-in-the-loop workflow where values are reviewed before proceeding to planning.

### Process Planning

Implemented in [frontend-react/src/sections/PlanningSection.jsx](frontend-react/src/sections/PlanningSection.jsx).

This is the operational planning layer:

- add, delete, and clear rows
- editable operation metadata
- drag-and-drop ordering using native HTML5 drag events
- CSV export of the plan via `Blob` + object URL generation
- AI assistant guidance panel
- transition to report generation on demand

### Report generation

Implemented in [frontend-react/src/sections/ReportSection.jsx](frontend-react/src/sections/ReportSection.jsx).

This component simulates the reporting phase:

- create report entries with a generating state
- update status to final after a short simulated delay
- rename reports inline
- download report outputs as text files
- delete generated reports
- auto-generate report when triggered by the planning step

## State and interaction model

The project is built around front-end state-driven UX rather than API-driven data flow. The current technical pattern is:

- static mock data stored in arrays and objects
- React state used for dynamic user interactions
- URL query parameters used to pass job metadata
- local event handlers to transition between workflow stages
- lightweight simulated async behavior using `setTimeout`

This is enough to model realistic workflows, but it does not yet include any backend persistence or external service integration.

## Tech stack

- React 19
- Vite 8
- React Router DOM
- JavaScript (ES modules)
- Custom CSS styling for a dashboard and workflow interface

## Repository structure

```text
Rocetri-C2P-main/
├── frontend-react/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── pages/
│       ├── sections/
│       └── styles/
├── architecture-a2-1788724506388.pdf
├── .gitignore
└── README.md
```

## Current implementation status

This repository is a front-end prototype and not yet a full production product. It does not include:

- backend APIs
- authentication or user management
- database persistence
- real CAED file upload processing
- AI inference or ML extraction engine
- production deployment configuration
- secure storage or authorization flows

The project is best understood as a workflow demonstration and UX prototype for an engineering document-processing platform.

## Getting started

### Prerequisites

- Node.js 18 or later
- npm

### Install dependencies

```bash
cd frontend-react
npm install
```

### Run locally

```bash
npm run dev
```

Open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Available scripts

```bash
npm run dev      # start development server
npm run build    # build production bundle
npm run preview  # preview production build locally
npm run lint     # run project linting
```

## Typical workflow in the app

1. Open the Dashboard
2. Select a job card
3. Navigate to the project workspace
4. Review extracted CAED values and validate them
5. Move into process planning
6. Define manufacturing steps and reorder them as needed
7. Generate and download the final report

## Planned next steps

- connect frontend to a real backend API
- implement CAED file upload and parsing
- add project persistence with a database
- integrate real AI/ML extraction logic
- add authentication and role-based access
- generate PDF/Word exports instead of mock report text files
- replace mock data with real project data models

## License

This project does not currently include a license file. If it is intended for public distribution, a suitable open-source license should be added before release.
