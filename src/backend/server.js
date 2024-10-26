import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory path to src/backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration using .env values
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'deniz',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'investments',
  password: process.env.POSTGRES_PASSWORD || '1227',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Log database connection parameters (exclude password for security)
console.log('Database configuration:', {
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  port: process.env.DB_PORT
});


// Whitelist of allowed table names for security
const ALLOWED_TABLES = ['investments', 'investments_fake'];
const DEFAULT_TABLE = 'investments_fake';

// GET investments from specified table
app.get('/api/investments/:tableName?', async (req, res) => {
  const tableName = req.params.tableName || DEFAULT_TABLE;

  // Security check: only allow whitelisted table names
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    // Fixed query syntax - using template literals with proper escaping
    const query = `SELECT * FROM ${tableName} ORDER BY investment_id`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/api/investments/:tableName', async (req, res) => {
  const { tableName } = req.params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const {
      name,
      provider,
      investment_type,
      investment_name,
      amount,
      currency,
      unit,
      notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ${tableName} 
       (name, provider, investment_type, investment_name, amount, currency, unit, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, provider, investment_type, investment_name, amount, currency, unit, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/investments/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const {
      name,
      provider,
      investment_type,
      investment_name,
      amount,
      currency,
      unit,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE ${tableName} 
       SET name = $1, provider = $2, investment_type = $3, investment_name = $4, 
           amount = $5, currency = $6, unit = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE investment_id = $9
       RETURNING *`,
      [name, provider, investment_type, investment_name, amount, currency, unit, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/investments/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE investment_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});