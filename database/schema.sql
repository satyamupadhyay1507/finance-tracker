-- creating the database first
-- CREATE DATABASE IF NOT EXISTS finance_tracker;
-- USE finance_tracker;

-- users table to store login info
-- role can be admin, user or read-only
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'read-only') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- categories like food, salary etc
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'misc',
  type ENUM('income', 'expense', 'both') DEFAULT 'both'
);

-- main transactions table
-- foreign key connects to users and categories table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category_id INT NOT NULL,
  description VARCHAR(255),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- adding indexes for faster search
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- inserting default categories
INSERT INTO categories (name, icon, type) VALUES
  ('Food', 'food', 'expense'),
  ('Transport', 'transport', 'expense'),
  ('Entertainment', 'entertainment', 'expense'),
  ('Shopping', 'shopping', 'expense'),
  ('Bills', 'bills', 'expense'),
  ('Health', 'health', 'expense'),
  ('Education', 'education', 'expense'),
  ('Salary', 'salary', 'income'),
  ('Freelance', 'freelance', 'income'),
  ('Investment', 'investment', 'income'),
  ('Other', 'other', 'both');
