# Supabase Authentication System

A comprehensive Express.js authentication system using Supabase's built-in `auth.users` table with code-based password reset functionality. This project demonstrates best practices for secure user authentication, token management, and password recovery.

## 🎯 Features

✅ **User Registration & Authentication**

- Email/password registration with validation
- Secure login with JWT tokens
- HTTP-only cookie storage (prevents XSS attacks)
- Session refresh token management

✅ **Token Management**

- 15-minute access token expiration
- 7-day refresh token rotation
- Secure cookie handling with SameSite policy

✅ **User Profiles**

- Get current user profile from `auth.users`
- Update user metadata (name, phone, avatar_url)
- Delete user account

✅ **Code-Based Password Reset**

- 6-digit numeric reset codes
- 15-minute code expiration
- Rate limiting (max 5 failed attempts)
- Email notification with code delivery
- One-time use enforcement

✅ **Middleware & Authorization**

- JWT token verification
- Role-based access control (RBAC)
- Optional authentication
- Guest-only protection

✅ **Database**

- Sequelize ORM with migrations
- PostgreSQL database (Supabase)
- Password reset codes table with indexes
- Automatic schema version control

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v16+ (v22+ recommended)
- **npm** or **pnpm** (v8+)
- **PostgreSQL** (local or via Supabase)
- **Git**

### Required Accounts

1. **Supabase Project** - Create at https://supabase.com
   - Get your project URL and API keys
   - Configure auth settings

2. **Email Service** (for password reset codes)
   - Gmail, SendGrid, or custom SMTP
   - Optional for development (codes returned in API)

---

## 🚀 Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/supabase-auth.git
cd supabase-auth
```

### 2. Install Dependencies

```bash
pnpm install
# or: npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://user:password@host:5432/postgres

# Database (for Sequelize)
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_HOST=localhost
DB_PORT=5432

# Application
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Email Service (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

### 4. Get Supabase Credentials

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Run Database Migration

```bash
NODE_ENV=development npx sequelize-cli db:migrate
```

This creates the `password_reset_codes` table in your database.

### 6. Start the Server

```bash
pnpm dev
```

Server will run on `http://localhost:5000`

---

## 📚 Complete Setup Guide

### Environment Configuration

#### Development Setup

```bash
# For local PostgreSQL
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_database
```

#### Supabase Setup

Get your database connection info:

1. Open Supabase Console → Your Project
2. Go to **Settings → Database**
3. Look for "Connection String" or similar

```bash
# Example for Supabase
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
```

#### Email Configuration

**Gmail (Recommended for Development):**

1. Enable 2-Factor Authentication on your Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password to `EMAIL_PASS`

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=noreply@yourapp.com
```

**SendGrid (Recommended for Production):**

1. Create account at https://sendgrid.com
2. Generate API key in Settings → API Keys
3. Set `EMAIL_PASS` to the API key

```bash
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=SG.your-api-key
EMAIL_FROM=noreply@yourapp.com
```

**Custom SMTP:**

```bash
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
```

---

## 📁 Project Structure

```
supabase-auth/
├── config/
│   └── config.js                 # Database configuration
├── controllers/
│   └── auth.controller.js         # Request handlers (9 endpoints)
├── migrations/
│   ├── 20260324125820-create-password-reset-codes.js
│   └── 20260324-create-password-reset-codes.sql (deprecated)
├── models/
│   ├── index.js                   # Sequelize model loader
│   └── PasswordResetCode.js        # Password reset code model
├── routes/
│   └── auth.routes.js             # Route definitions
├── services/
│   ├── auth.service.js            # Supabase auth operations
│   └── email.service.js           # Email sending
├── middleware/
│   └── auth.middleware.js         # JWT verification & RBAC
├── seeders/                       # Database seeders
├── .env.example                   # Environment template
├── .env                           # Environment variables (create from example)
├── package.json                   # Dependencies
├── server.js                      # Express app entry point
├── README.md                      # This file
├── AUTH_SETUP.md                  # Detailed auth guide
├── PASSWORD_RESET.md              # Password reset documentation
└── CODE_RESET_QUICKSTART.md       # Quick testing guide
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint             | Description                 | Auth Required            |
| ------ | -------------------- | --------------------------- | ------------------------ |
| POST   | `/api/auth/register` | Create new user account     | No                       |
| POST   | `/api/auth/login`    | Login with email & password | No                       |
| POST   | `/api/auth/logout`   | Logout and clear tokens     | No                       |
| POST   | `/api/auth/refresh`  | Get new access token        | No (needs refresh token) |

### Password Reset

| Method | Endpoint                    | Description              | Auth Required |
| ------ | --------------------------- | ------------------------ | ------------- |
| POST   | `/api/auth/forgot-password` | Request reset code       | No            |
| POST   | `/api/auth/reset-password`  | Reset password with code | No            |

### User Profile

| Method | Endpoint            | Description              | Auth Required |
| ------ | ------------------- | ------------------------ | ------------- |
| GET    | `/api/auth/me`      | Get current user profile | Yes           |
| PATCH  | `/api/auth/profile` | Update user metadata     | Yes           |
| DELETE | `/api/auth/account` | Delete user account      | Yes           |

---

## 🧪 Testing the API

### Using Postman

1. **Import Collection:**
   - Open Postman
   - Click "Import" → "File"
   - Select `postman_collection.json`

2. **Create Environment:**
   - New Environment
   - Add variable: `base_url` = `http://localhost:5000`
   - Save

3. **Test Endpoints:**
   - Start with Register to create test user
   - Login to get tokens
   - Test protected endpoints (me, profile)
   - Test password reset (forgot-password → reset-password)

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Profile (requires access token from login):**

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Request Password Reset:**

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Reset Password (in development, code is returned in forgot-password response):**

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "newPassword": "NewPass456!"
  }'
```

---

## 🔧 Running Commands

### Development

```bash
# Start development server with hot reload
pnpm dev

# Run ESLint (if configured)
pnpm lint

# Check for errors
pnpm check
```

### Database

```bash
# Run migrations
NODE_ENV=development npx sequelize-cli db:migrate

# Undo last migration
NODE_ENV=development npx sequelize-cli db:migrate:undo

# Create new migration
npx sequelize-cli migration:generate --name migration-name

# View migration status
npx sequelize-cli db:migrate:status
```

### Production

```bash
# Install dependencies
pnpm install --prod

# Run migrations on production
NODE_ENV=production npx sequelize-cli db:migrate

# Start server
NODE_ENV=production node server.js
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (set `secure: true` in cookie options)
- [ ] Configure CORS properly (limit to your domain)
- [ ] Set strong `SUPABASE_SERVICE_ROLE_KEY` - keep it secret!
- [ ] Enable email verification for registration
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up monitoring for failed reset attempts
- [ ] Use environment variables from `.env`, never commit them
- [ ] Configure CORS to allow only your frontend domain
- [ ] Enable HSTS headers
- [ ] Set up logging and monitoring
- [ ] Test password requirements meet your security policy
- [ ] Configure refresh token rotation
- [ ] Set up database backups

---

## 🐛 Troubleshooting

### Database Connection Error

**Error:** `relation "password_reset_codes" does not exist`

**Solution:**

```bash
# Run migrations
NODE_ENV=development npx sequelize-cli db:migrate

# Check migration status
npx sequelize-cli db:migrate:status
```

### Supabase Credentials Not Found

**Error:** `Missing Supabase credentials...`

**Solution:**

1. Copy `.env.example` to `.env`
2. Fill in actual Supabase credentials
3. Restart server

### Email Not Sending

**Solution:**

1. Check email service configuration in `.env`
2. For Gmail: verify app password is correct
3. For SendGrid: verify API key is valid
4. Check server logs for errors

### Reset Code Expired Immediately

**Error:** `Reset code has expired`

**Solution:**

- Make sure database migration was applied: `npx sequelize-cli db:migrate`
- Verify server and database use the same timezone
- Use code immediately after generation

### "Cannot find module" Error

**Solution:**

```bash
# Clear dependencies and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 🧑‍💻 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit relevant files in `services/`, `controllers/`, `routes/`, etc.

### 3. Test Changes

```bash
# Test with Postman collection
# Or use cURL examples above
```

### 4. Run Migrations (if needed)

```bash
NODE_ENV=development npx sequelize-cli db:migrate
```

### 5. Commit and Push

```bash
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Push to GitHub and create PR against `master` branch

---

## 📦 Dependencies

Key packages used in this project:

- **express** (5.x) - Web framework
- **@supabase/supabase-js** (2.x) - Supabase client
- **sequelize** (6.x) - ORM for database
- **pg** - PostgreSQL adapter
- **dotenv** - Environment variable management
- **cookie-parser** - Cookie parsing middleware
- **cors** - CORS middleware
- **nodemailer** - Email sending

---

## 🚀 Deployment

### Deploy to Vercel / Railway / Heroku

1. **Set environment variables** in platform dashboard
2. **Run migrations** (before or after deploy)
3. **Test endpoints** after deployment
4. **Monitor logs** for errors

### Example for Railway:

```bash
# Push to GitHub
git push origin master

# Railway auto-deploys on GitHub push
# Configure environment variables in Railway dashboard
# Run migrations via Railway CLI:
railway run npx sequelize-cli db:migrate
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test your changes
4. Submit a pull request

---

## 📞 Support

For issues and questions:

- Check [Troubleshooting](#troubleshooting) section
- Review documentation files
- Open a GitHub issue with details

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [JWT Best Practices](https://auth0.com/blog/about-auth0/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/)

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes and version history.

---

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
