-- Migration: 002_strategy_builder_tables.sql
-- Create tables for the Strategy Builder feature
-- This migration adds comprehensive support for visual strategy building

-- =====================================================
-- Visual Strategies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS visual_strategies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  strategy_definition JSON NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  user_id VARCHAR(36) NOT NULL,
  version INT DEFAULT 1,
  status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') DEFAULT 'DRAFT',
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_is_public (is_public),
  INDEX idx_created_at (created_at),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Strategy Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS strategy_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('TECHNICAL', 'SCALPING', 'SWING', 'ARBITRAGE', 'MEAN_REVERSION', 'MOMENTUM', 'CUSTOM') NOT NULL,
  difficulty ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') DEFAULT 'INTERMEDIATE',
  strategy_definition JSON NOT NULL,
  preview_image VARCHAR(500),
  documentation TEXT,
  tags JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_created_by (created_by),
  INDEX idx_rating (rating_average),
  INDEX idx_featured (is_featured),
  FULLTEXT idx_template_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Custom Blocks Table
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_blocks (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  block_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  input_schema JSON NOT NULL,
  output_schema JSON NOT NULL,
  implementation_code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_block_type (block_type),
  INDEX idx_is_public (is_public),
  FULLTEXT idx_block_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Strategy Backtests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS strategy_backtests (
  id VARCHAR(36) PRIMARY KEY,
  strategy_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255),
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_capital DECIMAL(15,2) NOT NULL,
  commission DECIMAL(5,4) NOT NULL,
  status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
  progress DECIMAL(5,2) DEFAULT 0.00,
  results JSON,
  error_message TEXT,
  execution_time INT, -- in milliseconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_strategy_id (strategy_id),
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (strategy_id) REFERENCES visual_strategies(id) ON DELETE cascade
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Strategy Deployments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS strategy_deployments (
  id VARCHAR(36) PRIMARY KEY,
  strategy_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  deployment_name VARCHAR(255),
  status ENUM('RUNNING', 'STOPPED', 'PAUSED', 'ERROR') DEFAULT 'RUNNING',
  config JSON,
  paper_trading BOOLEAN DEFAULT TRUE,
  max_position_size DECIMAL(15,2),
  stop_loss_percent DECIMAL(5,2),
  take_profit_percent DECIMAL(5,2),
  last_signal_at TIMESTAMP NULL,
  deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stopped_at TIMESTAMP NULL,
  
  INDEX idx_strategy_id (strategy_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_deployed_at (deployed_at),
  
  FOREIGN KEY (strategy_id) REFERENCES visual_strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Strategy Sharing Table
-- =====================================================
CREATE TABLE IF NOT EXISTS strategy_shares (
  id VARCHAR(36) PRIMARY KEY,
  strategy_id VARCHAR(36) NOT NULL,
  share_token VARCHAR(255) NOT NULL UNIQUE,
  created_by VARCHAR(36) NOT NULL,
  access_count INT DEFAULT 0,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_strategy_id (strategy_id),
  INDEX idx_created_by (created_by),
  INDEX idx_expires_at (expires_at),
  
  FOREIGN KEY (strategy_id) REFERENCES visual_strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Template Ratings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS template_ratings (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_template (template_id, user_id),
  INDEX idx_template_id (template_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  
  FOREIGN KEY (template_id) REFERENCES strategy_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Strategy Analytics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS strategy_analytics (
  id VARCHAR(36) PRIMARY KEY,
  strategy_id VARCHAR(36) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,6),
  metric_data JSON,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_strategy_metric (strategy_id, metric_name),
  INDEX idx_recorded_at (recorded_at),
  
  FOREIGN KEY (strategy_id) REFERENCES visual_strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Block Usage Statistics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS block_usage_stats (
  id VARCHAR(36) PRIMARY KEY,
  block_type VARCHAR(100) NOT NULL,
  block_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(36),
  strategy_id VARCHAR(36),
  usage_count INT DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_block_type (block_type),
  INDEX idx_user_id (user_id),
  INDEX idx_strategy_id (strategy_id),
  INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Default Strategy Templates
-- =====================================================
INSERT INTO strategy_templates (
  id, 
  name, 
  description, 
  category, 
  difficulty, 
  strategy_definition, 
  documentation,
  tags,
  is_featured,
  created_by
) VALUES

-- Simple Moving Average Crossover
(
  UUID(),
  'Simple Moving Average Crossover',
  'A basic strategy using SMA crossover signals for buy/sell decisions',
  'TECHNICAL',
  'BEGINNER',
  JSON_OBJECT(
    'version', 1,
    'blocks', JSON_ARRAY(
      JSON_OBJECT('id', 'input1', 'type', 'market_data', 'position', JSON_OBJECT('x', 100, 'y', 100)),
      JSON_OBJECT('id', 'sma1', 'type', 'sma', 'position', JSON_OBJECT('x', 300, 'y', 80), 'properties', JSON_OBJECT('period', 20)),
      JSON_OBJECT('id', 'sma2', 'type', 'sma', 'position', JSON_OBJECT('x', 300, 'y', 150), 'properties', JSON_OBJECT('period', 50)),
      JSON_OBJECT('id', 'compare1', 'type', 'greater_than', 'position', JSON_OBJECT('x', 500, 'y', 100)),
      JSON_OBJECT('id', 'buy1', 'type', 'buy_order', 'position', JSON_OBJECT('x', 700, 'y', 80)),
      JSON_OBJECT('id', 'sell1', 'type', 'sell_order', 'position', JSON_OBJECT('x', 700, 'y', 150))
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'sma1', 'toPort', 'input'),
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'sma2', 'toPort', 'input'),
      JSON_OBJECT('from', 'sma1', 'fromPort', 'output', 'to', 'compare1', 'toPort', 'a'),
      JSON_OBJECT('from', 'sma2', 'fromPort', 'output', 'to', 'compare1', 'toPort', 'b'),
      JSON_OBJECT('from', 'compare1', 'fromPort', 'true', 'to', 'buy1', 'toPort', 'trigger'),
      JSON_OBJECT('from', 'compare1', 'fromPort', 'false', 'to', 'sell1', 'toPort', 'trigger')
    )
  ),
  'This template demonstrates a simple moving average crossover strategy. When the short-term SMA crosses above the long-term SMA, it generates a buy signal. When it crosses below, it generates a sell signal.',
  JSON_ARRAY('sma', 'crossover', 'beginner', 'trend'),
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),

-- RSI Mean Reversion
(
  UUID(),
  'RSI Mean Reversion',
  'Buy oversold and sell overbought conditions using RSI indicator',
  'MEAN_REVERSION',
  'INTERMEDIATE',
  JSON_OBJECT(
    'version', 1,
    'blocks', JSON_ARRAY(
      JSON_OBJECT('id', 'input1', 'type', 'market_data', 'position', JSON_OBJECT('x', 100, 'y', 100)),
      JSON_OBJECT('id', 'rsi1', 'type', 'rsi', 'position', JSON_OBJECT('x', 300, 'y', 100), 'properties', JSON_OBJECT('period', 14)),
      JSON_OBJECT('id', 'oversold', 'type', 'less_than', 'position', JSON_OBJECT('x', 500, 'y', 80), 'properties', JSON_OBJECT('value', 30)),
      JSON_OBJECT('id', 'overbought', 'type', 'greater_than', 'position', JSON_OBJECT('x', 500, 'y', 150), 'properties', JSON_OBJECT('value', 70)),
      JSON_OBJECT('id', 'buy1', 'type', 'buy_order', 'position', JSON_OBJECT('x', 700, 'y', 80)),
      JSON_OBJECT('id', 'sell1', 'type', 'sell_order', 'position', JSON_OBJECT('x', 700, 'y', 150))
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'rsi1', 'toPort', 'input'),
      JSON_OBJECT('from', 'rsi1', 'fromPort', 'output', 'to', 'oversold', 'toPort', 'a'),
      JSON_OBJECT('from', 'rsi1', 'fromPort', 'output', 'to', 'overbought', 'toPort', 'a'),
      JSON_OBJECT('from', 'oversold', 'fromPort', 'true', 'to', 'buy1', 'toPort', 'trigger'),
      JSON_OBJECT('from', 'overbought', 'fromPort', 'true', 'to', 'sell1', 'toPort', 'trigger')
    )
  ),
  'A mean reversion strategy that uses RSI to identify oversold and overbought conditions. Buys when RSI is below 30 and sells when above 70.',
  JSON_ARRAY('rsi', 'mean-reversion', 'oscillator', 'intermediate'),
  TRUE,
  '00000000-0000-0000-0000-000000000000'
),

-- Bollinger Bands Breakout
(
  UUID(),
  'Bollinger Bands Breakout',
  'Trade breakouts above and below Bollinger Bands',
  'MOMENTUM',
  'INTERMEDIATE',
  JSON_OBJECT(
    'version', 1,
    'blocks', JSON_ARRAY(
      JSON_OBJECT('id', 'input1', 'type', 'market_data', 'position', JSON_OBJECT('x', 100, 'y', 150)),
      JSON_OBJECT('id', 'bb1', 'type', 'bollinger_bands', 'position', JSON_OBJECT('x', 300, 'y', 150), 'properties', JSON_OBJECT('period', 20, 'deviation', 2)),
      JSON_OBJECT('id', 'upper_break', 'type', 'greater_than', 'position', JSON_OBJECT('x', 500, 'y', 80)),
      JSON_OBJECT('id', 'lower_break', 'type', 'less_than', 'position', JSON_OBJECT('x', 500, 'y', 200)),
      JSON_OBJECT('id', 'buy1', 'type', 'buy_order', 'position', JSON_OBJECT('x', 700, 'y', 80)),
      JSON_OBJECT('id', 'sell1', 'type', 'sell_order', 'position', JSON_OBJECT('x', 700, 'y', 200))
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'bb1', 'toPort', 'input'),
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'upper_break', 'toPort', 'a'),
      JSON_OBJECT('from', 'input1', 'fromPort', 'close', 'to', 'lower_break', 'toPort', 'a'),
      JSON_OBJECT('from', 'bb1', 'fromPort', 'upper', 'to', 'upper_break', 'toPort', 'b'),
      JSON_OBJECT('from', 'bb1', 'fromPort', 'lower', 'to', 'lower_break', 'toPort', 'b'),
      JSON_OBJECT('from', 'upper_break', 'fromPort', 'true', 'to', 'buy1', 'toPort', 'trigger'),
      JSON_OBJECT('from', 'lower_break', 'fromPort', 'true', 'to', 'sell1', 'toPort', 'trigger')
    )
  ),
  'A momentum strategy that trades breakouts above the upper Bollinger Band (buy) and below the lower Bollinger Band (sell).',
  JSON_ARRAY('bollinger-bands', 'breakout', 'momentum', 'volatility'),
  FALSE,
  '00000000-0000-0000-0000-000000000000'
);

-- =====================================================
-- Update existing users table to support strategy builder permissions
-- =====================================================
-- Add columns only if they don't exist using dynamic SQL

SET @dbname = DATABASE();

SET @tablename = 'users';
SET @columnname = 'can_create_templates';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN can_create_templates BOOLEAN DEFAULT FALSE'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'max_strategies';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN max_strategies INT DEFAULT 50'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'max_custom_blocks';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN max_custom_blocks INT DEFAULT 20'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- Create indexes for better performance
-- =====================================================
-- Indexes creation - with existence checks to prevent duplicate key errors

-- Check and create idx_visual_strategies_user_public
SET @dbname = DATABASE();
SET @tablename = 'visual_strategies';
SET @indexname = 'idx_visual_strategies_user_public';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_visual_strategies_user_public ON visual_strategies(user_id, is_public)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and create idx_strategy_backtests_date_range
SET @tablename = 'strategy_backtests';
SET @indexname = 'idx_strategy_backtests_date_range';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_strategy_backtests_date_range ON strategy_backtests(start_date, end_date)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and create idx_strategy_deployments_user_status
SET @tablename = 'strategy_deployments';
SET @indexname = 'idx_strategy_deployments_user_status';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_strategy_deployments_user_status ON strategy_deployments(user_id, status)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- NOTE: Triggers, Views, and Stored Procedures Disabled
-- =====================================================
-- The following database objects require DELIMITER which is not supported 
-- in programmatic SQL execution via mysql2 library.
-- To add these manually, connect to MySQL and run the commented SQL below:
--
-- /* TRIGGERS */
-- DELIMITER $$
-- CREATE TRIGGER update_template_usage_count ...
-- CREATE TRIGGER update_block_usage_stats ...
-- CREATE TRIGGER update_template_rating_average ...
-- CREATE TRIGGER update_template_rating_average_on_update ...
-- DELIMITER ;
--
-- /* VIEWS */
-- CREATE OR REPLACE VIEW public_strategies AS ...
-- CREATE OR REPLACE VIEW strategy_performance_summary AS ...
--
-- /* STORED PROCEDURES */
-- DELIMITER $$
-- CREATE PROCEDURE GetUserStrategySummary(IN user_id_param VARCHAR(36)) ...
-- CREATE PROCEDURE CleanupOldBacktests(IN days_old INT) ...
-- DELIMITER ;
--
-- These are nice-to-have optimizations but not required for core functionality.