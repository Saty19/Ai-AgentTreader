# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Trade EMA platform in various environments, from local development to production deployment. The system supports multiple deployment strategies including traditional server deployment, containerized deployment with Docker, and cloud deployment.

## Prerequisites

### System Requirements

#### Minimum Hardware Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 50 GB available space
- **Network**: Stable internet connection (1 Mbps minimum)

#### Recommended Hardware Requirements
- **CPU**: 4+ cores, 3.0 GHz
- **RAM**: 8 GB or more
- **Storage**: 100 GB SSD
- **Network**: High-speed internet (10 Mbps or better)

#### Production Hardware Requirements
- **CPU**: 8+ cores, 3.5 GHz
- **RAM**: 16 GB or more
- **Storage**: 500 GB SSD with backup
- **Network**: Dedicated high-speed connection

### Software Dependencies

#### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **MySQL**: Version 8.0 or higher
- **Git**: Version 2.0 or higher

#### Optional Software
- **Docker**: Version 20.0+ (for containerized deployment)
- **Docker Compose**: Version 2.0+
- **PM2**: Process manager for production
- **Nginx**: Reverse proxy and load balancer

## Environment Setup

### Development Environment

#### 1. Clone Repository
```bash
# Clone the repository
git clone <repository-url>
cd "Trade ema"

# Verify project structure
ls -la
# Should show: backend/ frontend/ docs/
```

#### 2. Database Setup
```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server mysql-client

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation

# Create database
mysql -u root -p
CREATE DATABASE trade_ema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trade_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON trade_ema.* TO 'trade_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Environment Configuration
```bash
# Create environment file in project root
touch .env

# Edit .env file
nano .env
```

**Environment Variables**:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=trade_user
DB_PASSWORD=secure_password
DB_NAME=trade_ema

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Trading Configuration
SIMULATION_ENABLED=true
SIMULATION_INTERVAL=1000

# Binance API (Optional - for live data)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

#### 4. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migrations (automatic on first start)
npm run dev
```

#### 5. Frontend Setup
```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 6. Verify Installation
```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend
# Navigate to http://localhost:5173 in browser
```

### Production Environment

#### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git build-essential

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Production Database Setup
```bash
# Install MySQL for production
sudo apt install -y mysql-server

# Configure MySQL for production
sudo mysql_secure_installation

# Create production database
mysql -u root -p
CREATE DATABASE trade_ema_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trade_prod'@'localhost' IDENTIFIED BY 'very_secure_production_password';
GRANT ALL PRIVILEGES ON trade_ema_prod.* TO 'trade_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Application Deployment
```bash
# Create application user
sudo adduser --system --group tradeema

# Create application directory
sudo mkdir -p /opt/tradeema
sudo chown tradeema:tradeema /opt/tradeema

# Clone and setup application
sudo -u tradeema git clone <repository-url> /opt/tradeema
cd /opt/tradeema

# Install dependencies
sudo -u tradeema npm install --prefix backend
sudo -u tradeema npm install --prefix frontend

# Build applications
sudo -u tradeema npm run build --prefix backend
sudo -u tradeema npm run build --prefix frontend
```

#### 4. Production Environment Configuration
```bash
# Create production environment file
sudo -u tradeema vim /opt/tradeema/.env
```

**Production Environment Variables**:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=trade_prod
DB_PASSWORD=very_secure_production_password
DB_NAME=trade_ema_prod

# Server Configuration
PORT=8000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Authentication
JWT_SECRET=extremely_secure_jwt_secret_for_production

# SSL Configuration
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key

# Trading Configuration
SIMULATION_ENABLED=false
BINANCE_API_KEY=your_production_binance_api_key
BINANCE_API_SECRET=your_production_binance_api_secret

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/tradeema/app.log
```

#### 5. Process Management with PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
sudo -u tradeema vim /opt/tradeema/ecosystem.config.js
```

**PM2 Configuration**:
```javascript
module.exports = {
  apps: [{
    name: 'tradeema-backend',
    script: './backend/dist/server.js',
    cwd: '/opt/tradeema',
    env: {
      NODE_ENV: 'production'
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1000M',
    error_file: '/var/log/tradeema/backend-error.log',
    out_file: '/var/log/tradeema/backend-out.log',
    log_file: '/var/log/tradeema/backend.log',
    time: true
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/tradeema
sudo chown tradeema:tradeema /var/log/tradeema

# Start application with PM2
sudo -u tradeema pm2 start /opt/tradeema/ecosystem.config.js

# Save PM2 configuration
sudo -u tradeema pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u tradeema --hp /home/tradeema
```

#### 6. Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo vim /etc/nginx/sites-available/tradeema
```

**Nginx Configuration**:
```nginx
upstream tradeema_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Static Files (Frontend)
    root /opt/tradeema/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API Routes
    location /api {
        proxy_pass http://tradeema_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://tradeema_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tradeema /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Docker Deployment

### 1. Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S tradeema && \
    adduser -S tradeema -u 1001

WORKDIR /app
COPY --from=builder --chown=tradeema:tradeema /app/dist ./dist
COPY --from=builder --chown=tradeema:tradeema /app/node_modules ./node_modules
COPY --from=builder --chown=tradeema:tradeema /app/package.json ./package.json

USER tradeema

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/server.js"]
```

### 2. Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: tradeema-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: trade_ema
      MYSQL_USER: trade_user
      MYSQL_PASSWORD: secure_password
      MYSQL_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tradeema-backend
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_USER: trade_user
      DB_PASSWORD: secure_password
      DB_NAME: trade_ema
      PORT: 3000
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      SIMULATION_ENABLED: ${SIMULATION_ENABLED:-true}
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tradeema-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: tradeema-nginx
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
      - frontend

volumes:
  mysql_data:
    driver: local
```

### 4. Deploy with Docker Compose
```bash
# Create environment file for Docker
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "SIMULATION_ENABLED=true" >> .env

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale backend service
docker-compose up -d --scale backend=3

# Stop services
docker-compose down
```

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (t3.medium or larger recommended)
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Follow production deployment steps above
```

#### 2. RDS Database Setup
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
    --db-instance-identifier tradeema-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --master-username admin \
    --master-user-password securepassword \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxxx

# Update environment variables
DB_HOST=tradeema-db.xxxxxxxxx.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=securepassword
```

#### 3. Application Load Balancer
```bash
# Create target group
aws elbv2 create-target-group \
    --name tradeema-targets \
    --protocol HTTP \
    --port 8000 \
    --vpc-id vpc-xxxxxxxxx

# Create load balancer
aws elbv2 create-load-balancer \
    --name tradeema-lb \
    --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
    --security-groups sg-xxxxxxxxx
```

### Digital Ocean Deployment

#### 1. Droplet Setup
```bash
# Create droplet via CLI or web interface
# Choose Ubuntu 22.04, 2GB RAM minimum

# Connect and setup
ssh root@your-droplet-ip

# Follow production deployment steps
```

#### 2. Managed Database
```bash
# Create managed MySQL database via DO control panel
# Update connection string in environment
```

### Google Cloud Platform

#### 1. Compute Engine
```bash
# Create VM instance
gcloud compute instances create tradeema-server \
    --image-family ubuntu-2004-lts \
    --image-project ubuntu-os-cloud \
    --machine-type e2-medium \
    --zone us-central1-a

# Connect to instance
gcloud compute ssh tradeema-server
```

#### 2. Cloud SQL
```bash
# Create Cloud SQL instance
gcloud sql instances create tradeema-db \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create trade_ema --instance=tradeema-db
```

## Security Hardening

### 1. SSL/TLS Configuration
```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# For Docker deployment, also allow:
sudo ufw allow 3306  # MySQL
sudo ufw allow 3000  # Backend API
```

### 3. Security Headers
```nginx
# Add to Nginx configuration
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

### 4. Database Security
```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

FLUSH PRIVILEGES;
```

## Monitoring and Logging

### 1. Application Monitoring
```bash
# Install and configure PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Setup system monitoring
sudo apt install -y htop iotop

# Application health checks
curl -f http://localhost:8000/health || exit 1
```

### 2. Log Management
```bash
# Setup log rotation
sudo vim /etc/logrotate.d/tradeema

# Configuration:
/var/log/tradeema/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 tradeema tradeema
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Database Monitoring
```sql
-- Performance monitoring queries
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
SELECT * FROM performance_schema.events_waits_summary_global_by_event_name;
```

## Backup and Disaster Recovery

### 1. Database Backup
```bash
# Create backup script
sudo vim /opt/tradeema/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="trade_ema_prod"

mkdir -p $BACKUP_DIR

# Full database backup
mysqldump -u trade_prod -p$DB_PASSWORD --single-transaction --routines --triggers $DB_NAME > $BACKUP_DIR/tradeema_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/tradeema_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "tradeema_*.sql.gz" -type f -mtime +30 -delete

echo "Backup completed: tradeema_$DATE.sql.gz"
```

```bash
# Make executable and schedule
sudo chmod +x /opt/tradeema/scripts/backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/tradeema/scripts/backup.sh
```

### 2. File System Backup
```bash
# Application backup
rsync -avz --exclude=node_modules /opt/tradeema/ /backup/tradeema/

# Configuration backup
tar -czf /backup/config_$(date +%Y%m%d).tar.gz /etc/nginx/sites-enabled /opt/tradeema/.env
```

### 3. Disaster Recovery Plan
```bash
# Recovery script
sudo vim /opt/tradeema/scripts/restore.sh
```

```bash
#!/bin/bash
# Restore from backup
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop application
pm2 stop all

# Restore database
gunzip -c $BACKUP_FILE | mysql -u trade_prod -p$DB_PASSWORD trade_ema_prod

# Start application
pm2 start all

echo "Restore completed from $BACKUP_FILE"
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u trade_user -p trade_ema

# Check user privileges
mysql -u root -p
SELECT User, Host FROM mysql.user;
SHOW GRANTS FOR 'trade_user'@'localhost';
```

#### 2. Node.js Application Issues
```bash
# Check application logs
pm2 logs tradeema-backend

# Check process status
pm2 status

# Restart application
pm2 restart tradeema-backend

# Check port usage
netstat -tlnp | grep :8000
```

#### 3. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

#### 4. SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Optimize database
OPTIMIZE TABLE trades, signals, stats;

-- Analyze tables
ANALYZE TABLE trades, signals, stats;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

#### 2. Application Optimization
```bash
# Monitor memory usage
free -h
top -p $(pgrep node)

# Optimize PM2 configuration
pm2 start ecosystem.config.js --env production

# Enable Node.js clustering
# Update ecosystem.config.js:
instances: 'max',
exec_mode: 'cluster'
```

#### 3. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt list --upgradable

# Check disk space
df -h

# Review application logs
pm2 logs --lines 100

# Check database performance
mysql -u root -p -e "SHOW PROCESSLIST; SHOW ENGINE INNODB STATUS;"
```

#### Monthly Tasks
```bash
# Update Node.js dependencies
npm audit
npm update

# Database maintenance
mysql -u root -p -e "OPTIMIZE TABLE trades, signals, stats;"

# Clean up old logs
sudo logrotate -f /etc/logrotate.d/tradeema

# Review security updates
sudo apt list --upgradable | grep -i security
```

#### Quarterly Tasks
```bash
# Full system update
sudo apt upgrade

# Review and update SSL certificates
sudo certbot renew

# Performance review and optimization
# Review monitoring data and optimize based on usage patterns

# Security audit
# Review access logs, update passwords, review user access
```

This comprehensive deployment guide provides everything needed to successfully deploy the Trade EMA platform from development to production environments.