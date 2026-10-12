# Estodus SecureLift API Server

A robust Node.js API server built with Express.js, featuring job queuing, email services, and a modern development workflow.

## 🚀 Features

- **Express.js Server** - Fast, unopinionated web framework
- **Job Queue Management** - BullMQ with Redis for background job processing
- **Email Services** - Nodemailer integration with queue-based email sending
- **Database Support** - PostgreSQL with Knex.js migrations
- **Queue Monitoring** - Bull Board UI for monitoring job queues
- **Environment Validation** - Joi-based configuration validation
- **Development Tools** - ESLint, Husky, and conventional commits
- **Docker Support** - Ready-to-use Docker Compose setup

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EstodusServer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your database and Redis credentials.

## 🐳 Docker Setup

For quick development setup with Docker:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port `5445`
- Redis on port `6370`

## ⚙️ Configuration

The application uses environment variables for configuration. 

For a complete list of required and optional variables, see the `.env.example` file in the project root. This file is always kept up-to-date with the latest configuration options.

Copy the example file and configure it with your values:
```bash
cp .env.example .env
```

## 🚦 Running the Application

### Development Mode
```bash
npm run start-dev
```
Starts the server with hot-reload using tsx.

### Production Mode
```bash
npm start
```

## 📊 Database Management

The application uses Knex.js for database migrations and seeding.

### Migration Commands
```bash
# Create a new migration
npm run mg:make <migration-name>

# Run all pending migrations
npm run mg:latest

# Rollback the latest migration
npm run mg:rollback-latest

# Rollback all migrations
npm run mg:rollback

# List migration status
npm run mg:list
```

### Seeding
```bash
npm run seed
```

## 📧 Email Service

The application includes a queue-based email service:

- Emails are processed asynchronously using BullMQ
- Configured SMTP settings are required
- Queue monitoring available at `/admin/queues`

## 🔍 Queue Monitoring

Access the Bull Board UI to monitor job queues:
```
http://localhost:3000/admin/queues
```

## 🏗️ Project Structure

```
src/
├── app.js                 # Express app configuration
├── index.js               # Server entry point
├── config/
│   └── env.js            # Environment configuration
├── infra/
│   ├── database/         # Database setup and migrations
│   ├── email/           # Email service implementation
│   └── queue/           # Job queue configuration
└── modules/
    ├── notification/    # Notification modules
    └── router/          # Versioned Based API routes
```

## 🧪 Development

### Code Quality
- ESLint for code linting
- Husky for git hooks
- Conventional commits enforced
- Lint-staged for pre-commit checks

### Git Hooks
The project uses Husky for git hooks:
- Pre-commit: Runs ESLint on staged files
- Commit-msg: Validates commit message format

### Commit Message Convention

This project follows conventional commits format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi colons, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(auth): add JWT token validation
fix(email): resolve SMTP connection timeout
docs(readme): update installation instructions
refactor(queue): simplify job processor logic
test(notification): add email service unit tests
chore(deps): update express to v5.2.1
```

## 📝 API Endpoints

### Health Check
```
GET /
```
Returns a welcome message with service information.

### Queue Administration
```
GET /admin/queues
```
Bull Board UI for queue monitoring.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Follow the commit message convention
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Dependencies

### Core Dependencies
- **express** - Web framework
- **bullmq** - Job queue library
- **knex** - Query builder and migration tool
- **nodemailer** - Email sending library
- **joi** - Schema validation
- **ioredis** - Redis client
- **pg** - PostgreSQL client

### Development Dependencies
- **eslint** - Code linting
- **husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **@commitlint/cli** - Commit message validation
- **tsx** - TypeScript execution for JavaScript
