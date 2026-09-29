# People — Employee directory

A responsive employee enrollment and directory app with a React interface, Express API, and local SQLite database.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local Vite address shown in the terminal (usually `http://localhost:5173`).

The API runs on port 3001. The SQLite database is created automatically at `data/employees.db` when the server starts. Employee records persist across restarts. Use `npm run build` to create a production frontend build; `npm start` starts the API server.

## Employee fields

Employee ID, first and last name, work email, phone, department, job title, employment type, start date, and status. Employee ID and email must be unique. Records can be searched, filtered, added, edited, and deleted.

## API

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/health`

This starter is intended for local/internal use. Add authentication, authorization, HTTPS, backups, and deployment-specific secrets before exposing employee data to a network or the public internet.
