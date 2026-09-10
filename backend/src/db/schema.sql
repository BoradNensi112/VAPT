-- Users table
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

-- Analysts table (Dynamic team members)
CREATE TABLE IF NOT EXISTS analysts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(100) DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
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

-- Knowledge Base table
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

-- Findings table (associated with projects)
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

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
