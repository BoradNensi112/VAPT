const { Client } = require('pg');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { initialVulnerabilities, initialAnalysts } = require('./seedData');
require('dotenv').config();

async function ensureDatabaseExists() {
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await adminClient.connect();
    const dbName = process.env.DB_NAME || 'vapt_db';
    const checkRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkRes.rows.length === 0) {
      console.log(`[DB] Database '${dbName}' not found. Creating database automatically...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB] Database '${dbName}' created successfully!`);
    }
  } catch (err) {
    // Suppress if offline / managed
  } finally {
    try {
      await adminClient.end();
    } catch (_) {}
  }
}

async function initializeDatabase() {
  try {
    await db.checkPgConnection();
    await ensureDatabaseExists();

    console.log('[DB] Checking schema and seeding initial datasets...');

    // 1. Create Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Security Analyst',
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS analysts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(100) DEFAULT 'General',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_name VARCHAR(200) NOT NULL,
        target_url VARCHAR(500) NOT NULL,
        security_analysts VARCHAR(255) NOT NULL,
        project_managers VARCHAR(255) NOT NULL,
        ciso_name VARCHAR(255) NOT NULL,
        remarks TEXT DEFAULT '1. Functional Bugs are attached to in the Findings folder Under !',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        vulnerability_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        steps_to_reproduce TEXT NOT NULL,
        remediation TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        reference VARCHAR(500),
        owasp_category VARCHAR(100) NOT NULL,
        cwe_number VARCHAR(50) NOT NULL,
        cwe_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS findings (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        vulnerability_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        steps_to_reproduce TEXT NOT NULL,
        remediation TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        reference VARCHAR(500),
        owasp_category VARCHAR(100) NOT NULL,
        cwe_number VARCHAR(50) NOT NULL,
        cwe_url VARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Seed Admin
    const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin@123', salt);
      await db.query(
        "INSERT INTO users (name, username, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)",
        ['BISAG-N Administrator', 'admin', 'admin@bisag.gov.in', hash, 'Admin', 'Active']
      );
      console.log('✅ [DB] Super Admin seeded: admin / Admin@123 (Role: Admin)');
    }

    // 3. Seed Analysts
    const analystCheck = await db.query("SELECT * FROM analysts");
    if (!analystCheck.rows || analystCheck.rows.length === 0) {
      for (const a of initialAnalysts) {
        await db.query(
          "INSERT INTO analysts (name, department, is_active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING",
          [a.name, a.department]
        );
      }
      console.log(`✅ [DB] Seeded ${initialAnalysts.length} Security Analysts.`);
    }

    // 4. Seed KB
    const kbCheck = await db.query("SELECT * FROM knowledge_base");
    if (!kbCheck.rows || kbCheck.rows.length === 0) {
      for (const item of initialVulnerabilities) {
        await db.query(
          `INSERT INTO knowledge_base (vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.vulnerability_name, item.description, item.steps_to_reproduce, item.remediation, item.severity, item.reference, item.owasp_category, item.cwe_number, item.cwe_url]
        );
      }
      console.log(`✅ [DB] Seeded ${initialVulnerabilities.length} standard OWASP Top 10 vulnerabilities into Knowledge Base.`);
    }

    console.log('🎉 [DB] Initialization complete! System is fully operational.');
  } catch (err) {
    console.error('[DB Setup Error]:', err.message);
  }
}

module.exports = { initializeDatabase };
