import express from 'express';
import initSqlJs from 'sql.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3001;
const rootDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(rootDir, '..', 'data');
const dbPath = process.env.DATABASE_PATH || join(dataDir, 'employees.db');
mkdirSync(dirname(dbPath), { recursive: true });

const fields = ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'department', 'jobTitle', 'employmentType', 'startDate', 'status'];
const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'department', 'jobTitle', 'startDate'];
const statuses = new Set(['Active', 'On leave', 'Inactive']);
const employmentTypes = new Set(['Full-time', 'Part-time', 'Contract', 'Intern']);

function normalizeEmployee(body = {}) {
  return Object.fromEntries(fields.map((field) => [field, typeof body[field] === 'string' ? body[field].trim() : '']));
}

function validateEmployee(employee) {
  const missing = requiredFields.filter((field) => !employee[field]);
  if (missing.length) return 'Please complete all required fields.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) return 'Enter a valid email address.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.startDate) || Number.isNaN(Date.parse(`${employee.startDate}T00:00:00`))) return 'Enter a valid start date.';
  if (employee.status && !statuses.has(employee.status)) return 'Choose a valid employment status.';
  if (employee.employmentType && !employmentTypes.has(employee.employmentType)) return 'Choose a valid employment type.';
  if (fields.some((field) => employee[field].length > 200)) return 'Each field must be 200 characters or fewer.';
  return null;
}

function rows(sql, params = []) {
  const statement = db.prepare(sql);
  statement.bind(params);
  const result = [];
  while (statement.step()) result.push(statement.getAsObject());
  statement.free();
  return result;
}

function persistDatabase() {
  writeFileSync(dbPath, Buffer.from(db.export()));
}

let db;

async function start() {
  const SQL = await initSqlJs({ locateFile: (file) => join(rootDir, '..', 'node_modules', 'sql.js', 'dist', file) });
  db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL UNIQUE,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL,
    jobTitle TEXT NOT NULL,
    employmentType TEXT NOT NULL DEFAULT 'Full-time',
    startDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'On leave', 'Inactive')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  persistDatabase();

  app.use(express.json({ limit: '32kb' }));

  app.get('/api/employees', (_req, res) => res.json(rows('SELECT * FROM employees ORDER BY lastName COLLATE NOCASE, firstName COLLATE NOCASE')));

  app.post('/api/employees', (req, res) => {
    const employee = normalizeEmployee(req.body);
    const error = validateEmployee(employee);
    if (error) return res.status(400).json({ error });
    employee.employmentType ||= 'Full-time';
    employee.status ||= 'Active';
    try {
      db.run(`INSERT INTO employees (employeeId, firstName, lastName, email, phone, department, jobTitle, employmentType, startDate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, fields.map((field) => employee[field]));
      const id = rows('SELECT last_insert_rowid() AS id')[0].id;
      persistDatabase();
      return res.status(201).json(rows('SELECT * FROM employees WHERE id = ?', [id])[0]);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'That employee ID or email is already in use.' });
      return res.status(500).json({ error: 'Could not save this employee.' });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1 || !rows('SELECT id FROM employees WHERE id = ?', [id]).length) return res.status(404).json({ error: 'Employee not found.' });
    const employee = normalizeEmployee(req.body);
    const error = validateEmployee(employee);
    if (error) return res.status(400).json({ error });
    employee.employmentType ||= 'Full-time';
    employee.status ||= 'Active';
    try {
      db.run(`UPDATE employees SET employeeId=?, firstName=?, lastName=?, email=?, phone=?, department=?, jobTitle=?, employmentType=?, startDate=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [...fields.map((field) => employee[field]), id]);
      persistDatabase();
      return res.json(rows('SELECT * FROM employees WHERE id = ?', [id])[0]);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'That employee ID or email is already in use.' });
      return res.status(500).json({ error: 'Could not update this employee.' });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(404).json({ error: 'Employee not found.' });
    db.run('DELETE FROM employees WHERE id = ?', [id]);
    if (!db.getRowsModified()) return res.status(404).json({ error: 'Employee not found.' });
    persistDatabase();
    return res.status(204).end();
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.listen(port, () => console.log(`Employee directory API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Could not start the employee directory API:', error);
  process.exitCode = 1;
});
