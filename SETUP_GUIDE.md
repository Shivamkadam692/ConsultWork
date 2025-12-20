# Setup Guide - Consultancy Service Web Portal

This guide will help you set up and run the Consultancy Service Web Portal on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud) - [Sign up](https://www.mongodb.com/cloud/atlas)
3. **Git** - [Download](https://git-scm.com/)
4. **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

## Step-by-Step Setup

### 1. Clone or Extract the Project

If you have the project files, navigate to the project directory:
```bash
cd consultancy-portal
```

### 2. Install Dependencies

Install all required npm packages:
```bash
npm install
```

This will install all dependencies listed in `package.json`.

### 3. Set Up MongoDB

#### Option A: Local MongoDB

1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```

2. MongoDB will run on `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the connection string in `.env` file

### 4. Configure Environment Variables

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and update the following:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/consultancy_portal
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consultancy_portal

   # Session Secret (generate a random string)
   SESSION_SECRET=your-super-secret-session-key-change-this

   # JWT Secret (generate a random string)
   JWT_SECRET=your-jwt-secret-key-change-this

   # Email Configuration (for password reset and notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@consultancyportal.com

   # Google Maps API (optional, for location features)
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key

   # Application URL
   APP_URL=http://localhost:3000
   ```

   **Important Notes:**
   - Generate secure random strings for `SESSION_SECRET` and `JWT_SECRET`
   - For Gmail, you need to create an "App Password" in your Google Account settings
   - Google Maps API key is optional but recommended for location features

### 5. Create Uploads Directory

Ensure the uploads directory exists:
```bash
mkdir -p public/uploads
```

### 6. Start the Application

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

### 7. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Creating Initial Data

### Create an Admin User

You can create an admin user directly in MongoDB or use a script. Here's a sample script:

Create `scripts/createAdmin.js`:

```javascript
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const admin = new AdminUser({
      email: 'admin@consultancyportal.com',
      password: 'Admin@123', // Change this!
      firstName: 'Admin',
      lastName: 'User',
      role: 'super-admin',
      isActive: true
    });
    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

Run it:
```bash
node scripts/createAdmin.js
```

### Create Service Categories

You can add service categories through the admin panel or directly in MongoDB.

## Testing the Application

### 1. Test Registration

1. Go to `http://localhost:3000/register`
2. Register as a Client
3. Check your email for verification link (if email is configured)

### 2. Test Worker Registration

1. Register as a Worker
2. Complete worker profile with skills and rates
3. Admin needs to verify the worker account

### 3. Test Booking Flow

1. Login as Client
2. Search for workers
3. View worker profile
4. Create a booking request
5. Login as Worker
6. Accept the booking request
7. Complete the service
8. Process payment
9. Leave a review

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Or stop the process using port 3000

3. **Email Not Sending**
   - Verify email credentials in `.env`
   - For Gmail, use App Password (not regular password)
   - Check email service provider settings

4. **Module Not Found Errors**
   - Run `npm install` again
   - Delete `node_modules` and `package-lock.json`, then reinstall

5. **Session Issues**
   - Clear browser cookies
   - Check `SESSION_SECRET` in `.env`

## Development Tips

1. **Use Nodemon**: Already configured in `package.json` for auto-reload
2. **Check Logs**: Console logs will show errors and debug information
3. **Database GUI**: Use MongoDB Compass to view and manage data
4. **API Testing**: Use Postman or Thunder Client for API testing

## Next Steps

1. Configure email service for production
2. Set up Google Maps API for location features
3. Integrate payment gateway (Stripe, PayPal, Razorpay)
4. Set up SSL/HTTPS for production
5. Configure environment for production deployment

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a production MongoDB instance
3. Set up proper SSL certificates
4. Configure reverse proxy (Nginx)
5. Use PM2 for process management
6. Set up proper logging and monitoring
7. Configure backup strategy for database

## Support

If you encounter any issues, check:
- Console logs for error messages
- MongoDB connection status
- Environment variables configuration
- Network and firewall settings

---

**Note**: This is a development setup. For production, additional security measures and optimizations are required.

