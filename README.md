# Consultancy Service Web Portal

A comprehensive web-based platform that connects skilled service providers (plumbers, electricians, carpenters, tutors, etc.) with local clients seeking professional services.

## Recent Enhancements

We've recently implemented several key improvements to enhance user experience and functionality:

1. **Booking System Improvements**:
   - Fixed booking creation validation issues
   - Enhanced accept, reject, and cancel booking buttons with reason prompts
   - Improved navigation after booking actions

2. **Map Functionality**:
   - Enhanced worker location mapping with Leaflet.js
   - Improved map view toggle between list and map views
   - Better worker marker display with ratings

3. **UI/UX Improvements**:
   - Added toast notifications for user feedback
   - Enhanced form validation
   - Improved responsive design

## Features

### Client Features
- Secure registration and login with password reset
- Search and browse workers by category, location, rating, and budget
- View detailed worker profiles with reviews and availability
- Book services with date/time selection
- Manage bookings and view booking history
- Payment history and receipt generation
- Rate and review completed services
- Profile management
- Interactive map view to locate nearby workers

### Worker Features
- Worker registration with skill details and service areas
- Profile management with portfolio and certifications
- Availability schedule management
- Accept or reject service requests
- Booking history and earnings tracking
- View ratings and reviews
- Respond to client reviews
- Manage service skills and categories

### Admin Features
- Secure admin authentication
- User and worker management (approve, block, verify)
- Booking and service monitoring
- Payment and commission management
- Support ticket handling
- Reports and analytics dashboard
- System configuration

## Technology Stack

- **Frontend**: EJS templating, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Leaflet.js for maps
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Session-based with connect-mongo for session storage
- **APIs**: Google Maps API for location services, OpenStreetMap for map tiles
- **File Upload**: Multer for handling file uploads
- **Email**: Nodemailer for transactional emails
- **Validation**: express-validator for form validation

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd consultancy-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/consultancy_portal
     SESSION_SECRET=your-secret-key
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas cloud database

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
consultancy-portal/
├── config/              # Configuration files
│   ├── database.js
│   ├── auth.js
│   └── constants.js
├── controllers/         # Route controllers
│   ├── authController.js
│   ├── clientController.js
│   ├── workerController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── reviewController.js
│   └── adminController.js
├── models/             # Database models
│   ├── User.js
│   ├── Booking.js
│   ├── Review.js
│   ├── Payment.js
│   ├── Notification.js
│   ├── SupportTicket.js
│   ├── ServiceCategory.js
│   └── AdminUser.js
├── routes/             # Express routes
│   ├── authRoutes.js
│   ├── clientRoutes.js
│   ├── workerRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── reviewRoutes.js
│   ├── publicRoutes.js
│   └── adminRoutes.js
├── middleware/         # Custom middleware
│   ├── auth.js
│   ├── validation.js
│   ├── upload.js
│   └── errorHandler.js
├── services/           # Business logic services
│   ├── emailService.js
│   ├── notificationService.js
│   ├── paymentService.js
│   └── mapService.js
├── views/              # EJS templates
│   ├── layouts/
│   ├── partials/
│   ├── auth/
│   ├── client/
│   ├── worker/
│   └── admin/
├── public/             # Static files
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── server.js           # Application entry point
├── package.json
└── README.md
```

## Database Schema

The application uses MongoDB with the following main collections:

- **Users**: Stores client and worker information
- **Bookings**: Manages service booking requests
- **Reviews**: Stores ratings and reviews
- **Payments**: Tracks payment transactions
- **Notifications**: User notifications
- **SupportTickets**: Customer support tickets
- **ServiceCategories**: Service categories and types
- **AdminUsers**: Administrator accounts

## API Endpoints

### Authentication
- `GET /register` - Registration page
- `POST /register` - Create new account
- `GET /login` - Login page
- `POST /login` - User login
- `GET /logout` - User logout
- `GET /forgot-password` - Forgot password page
- `POST /forgot-password` - Send password reset email
- `GET /reset-password` - Reset password page
- `POST /reset-password` - Reset password

### Client Routes
- `GET /client/dashboard` - Client dashboard
- `GET /client/search` - Search workers with map/list view toggle
- `GET /client/worker/:id` - View worker profile
- `GET /client/bookings` - View bookings
- `GET /client/bookings/:id` - View booking details
- `GET /client/payments` - Payment history
- `GET /client/profile` - View profile
- `POST /client/profile` - Update profile

### Worker Routes
- `GET /worker/dashboard` - Worker dashboard
- `GET /worker/profile` - View profile
- `POST /worker/profile` - Update profile
- `GET /worker/requests` - Service requests
- `GET /worker/requests/:id` - View request details
- `GET /worker/earnings` - Earnings summary
- `GET /worker/reviews` - Reviews received
- `GET /worker/skills` - Manage skills
- `GET /worker/add-skills` - Add new skills

### Booking Routes
- `POST /bookings` - Create booking
- `GET /bookings/:id` - View booking details
- `POST /bookings/:id/accept` - Accept booking
- `POST /bookings/:id/reject` - Reject booking
- `PUT /bookings/:id/status` - Update status
- `POST /bookings/:id/cancel` - Cancel booking

### Payment Routes
- `POST /payments/process` - Process payment
- `GET /payments/:id` - View payment details
- `GET /payments/:id/receipt` - Generate receipt

### Review Routes
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `POST /reviews/:id/respond` - Worker response

### Admin Routes
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - User management
- `POST /admin/users/:id/verify` - Verify worker
- `POST /admin/users/:id/toggle-status` - Block/unblock user
- `GET /admin/bookings` - Booking management
- `GET /admin/payments` - Payment management
- `GET /admin/reports` - Reports and analytics

## Security Features

- Password hashing with bcrypt
- Session-based authentication with secure cookies
- CSRF protection
- Input validation and sanitization
- Role-based access control (RBAC)
- Secure file uploads
- Rate limiting
- Helmet.js for security headers
- XSS prevention

## Development

### Running in Development Mode
```bash
npm run dev
```
Uses nodemon for automatic server restart on file changes.

### Environment Variables
Make sure to set up all required environment variables in `.env` file before running the application.

## Recent Fixes and Improvements

### Booking System
- Fixed booking creation validation requiring service description minimum length
- Enhanced booking action buttons with proper error handling
- Added reason prompts for rejection and cancellation actions
- Improved navigation after booking actions

### Map Functionality
- Enhanced worker location mapping with Leaflet.js
- Fixed map view toggle between list and map views
- Improved worker marker display with ratings and service information
- Added locate me and refresh buttons for better map interaction

### UI/UX Improvements
- Added toast notifications for all user actions
- Enhanced form validation with user-friendly error messages
- Improved responsive design for mobile devices
- Fixed JavaScript conflicts and duplicate code issues

## Future Enhancements

- Real-time chat/messaging system
- Video consultation features
- Mobile applications (iOS/Android)
- Multi-language support
- Advanced analytics with machine learning
- Push notifications
- Social media integration
- Advanced search with AI recommendations

## License

This project is created for educational purposes as part of a final year project.

## Support

For support, email support@consultancyportal.com or create an issue in the repository.

## Contributors

- Project developed as part of MSc/MCA/BSc IT final year project

---

**Note**: This is a complete project implementation based on the planning document. Make sure to configure all environment variables and set up MongoDB before running the application.