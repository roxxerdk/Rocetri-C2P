# C2P Backend

NestJS backend for the C2P workflow platform. This service provides project management, workflow orchestration, engineering extraction/verification, planning, job tracking, and reporting APIs backed by MongoDB.

## Overview

This backend is built with:

- NestJS 11
- TypeScript
- MongoDB via Mongoose
- @nestjs/config for environment configuration
- Global validation and CORS enabled
- AI integrations for Gemini and Qwen providers

The application runs with a global API prefix of `/api` and listens on port `3000` by default unless overridden by environment variables.

## Project Structure

```text
backend/
├── src/
│   ├── ai/                 # AI provider abstraction and integrations
│   ├── config/             # environment and app config
│   ├── database/           # MongoDB connection setup
│   ├── engineering/        # extraction, verification, corrections
│   ├── jobs/               # async job lifecycle tracking
│   ├── planning/           # plan generation and chat workflows
│   ├── projects/           # project CRUD and stage management
│   ├── reports/            # report generation and retrieval
│   ├── shared/             # shared DTOs, filters, enums, interfaces
│   ├── validation/         # schema/business validation
│   ├── workflow/           # workflow state transitions
│   ├── app.module.ts       # main Nest application module
│   ├── main.ts             # bootstrap and application setup
│   └── ...
├── .env.example            # recommended local env template (create manually)
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ or newer
- npm 9+
- MongoDB running locally or reachable via a MongoDB connection string
- API keys for the LLM providers you plan to use

## Installation

From the backend directory:

```bash
cd backend
npm install
```

## Environment Variables

The app loads environment variables through `@nestjs/config` using the configuration file in `src/config/configuration.ts`.

Create a `.env` file in the `backend` directory with the following values:

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

### Variable Reference

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | Port the NestJS app listens on |
| `NODE_ENV` | No | `development` | Application environment |
| `MONGODB_URI` | No | `mongodb://localhost:27017/c2p` | MongoDB connection string |
| `GEMINI_API_KEY` | No | empty string | API key for Gemini AI provider |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model to use |
| `QWEN_API_KEY` | No | empty string | API key for Qwen AI provider |
| `QWEN_MODEL` | No | `qwen-plus` | Qwen model to use |
| `QWEN_BASE_URL` | No | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | Qwen-compatible API base URL |

> If these variables are not set, the app falls back to sensible defaults, but production environments should set them explicitly.

## Running the App

### Development mode

```bash
npm run start:dev
```

This starts the NestJS app in watch mode with hot reloading.

### Debug mode

```bash
npm run start:debug
```

This starts the app in watch mode with Node inspector enabled.

### Production build

```bash
npm run build
```

### Production start

```bash
npm run start:prod
```

This runs the compiled app from `dist/main`.

### Standard start

```bash
npm run start
```

This starts the Nest app without watch mode.

## Build and Runtime Notes

The app bootstraps in `src/main.ts` with:

- CORS enabled
- global route prefix `/api`
- `ValidationPipe` enabled with `whitelist` and `transform`
- custom HTTP exception filter

By default, the service listens on the value in `PORT` or `3000`.

## Tests

The current `package.json` does not define a `test` script. There is no configured automated test runner in the project as it stands.

If you add a testing setup later, the usual NestJS flow would be:

```bash
npm run test
```

or

```bash
npx jest
```

At present, the repository should be treated as a backend service with build/run configuration, but without a built-in test command.

## API Base URL

Once the server is running, the app is exposed under the global prefix:

```text
http://localhost:3000/api
```

If you override `PORT`, replace `3000` with your custom port.

## Common Development Workflow

```bash
cd backend
npm install
cp .env.example .env   # if you create a local template file
npm run start:dev
```

## Notes

- MongoDB must be available before the app starts successfully.
- AI features may fail gracefully or log errors if the corresponding API keys are not configured.
- The app is designed around a project workflow with distinct stages and asynchronous jobs, so a running database is essential for normal operation.
