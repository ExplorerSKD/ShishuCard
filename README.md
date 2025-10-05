# 🩺 Digital Vaccination Portal

> A comprehensive digital platform for managing childhood vaccinations with role-based access for Parents, Doctors, and Administrators.

![Vaccination Portal](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-darkgreen)

## 🎯 Overview

The Digital Vaccination Portal is a modern, secure, and user-friendly platform designed to streamline the vaccination process for children. It provides comprehensive vaccination tracking, automated scheduling, and professional certificate generation with role-based access control.

## ✨ Key Features

### 👨‍👩‍👧‍👦 For Parents
- **Child Registration**: Easy registration with auto-generated vaccination schedules
- **Vaccination Tracking**: Real-time status updates with color-coded indicators
- **Request System**: Submit vaccination completion requests to doctors
- **AI Advice**: Personalized vaccination guidance (placeholder ready)
- **Digital Certificates**: Generate professional vaccination certificates
- **Comprehensive Dashboard**: Overview of all children and vaccination progress

### 👩‍⚕️ For Doctors
- **Approval System**: Review and approve/reject vaccination requests
- **Patient Search**: Search and view children's vaccination histories
- **Dashboard Analytics**: Real-time statistics and pending requests
- **Medical Records**: Complete vaccination tracking and approval management

### 👨‍💼 For Administrators
- **User Management**: Approve doctor registrations and manage users
- **System Analytics**: Comprehensive dashboard with real-time statistics
- **Doctor Verification**: Review and approve healthcare professional accounts
- **System Monitoring**: Track platform usage and vaccination trends

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **QR Code** - Certificate verification

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0.0
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vaccination_Portal-main
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/vaccination_portal
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   PORT=3000
   ```

4. **Initialize Database**
   ```bash
   cd backend
   
   # Create admin user
   node scripts/createAdmin.js
   
   # Create test doctor accounts
   node scripts/createTestDoctor.js
   
   # Create sample data (optional)
   node scripts/createTestRequests.js
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd backend
   node server.js
   
   # Terminal 2: Start frontend development server
   cd ..
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3000

## 👤 Default User Accounts

### Admin Account
- **Email**: `admin@vaccination-portal.com`
- **Password**: `admin123`
- **Access**: Full system administration

### Test Doctor Account
- **Email**: `doctor@test.com`
- **Password**: `doctor123`
- **Status**: Pre-approved for testing

### Pending Doctor Account
- **Email**: `doctor.pending@test.com`
- **Password**: `doctor123`
- **Status**: Requires admin approval

## 🗂️ Project Structure

```
vaccination-portal/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ParentDashboard.jsx   # Parent interface
│   │   ├── DoctorDashboard.jsx   # Doctor interface
│   │   ├── AdminDashboard.jsx    # Admin interface
│   │   ├── ChildPage.jsx         # Child details & vaccination
│   │   ├── VaccinationCertificate.jsx # Certificate generation
│   │   └── ...
│   ├── context/                  # React contexts
│   ├── services/                 # API services
│   └── utils/                    # Utility functions
├── backend/                      # Backend source code
│   ├── controllers/              # Route controllers
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── middlewares/              # Custom middlewares
│   ├── scripts/                  # Database setup scripts
│   └── server.js                 # Server entry point
├── public/                       # Static files
└── docs/                         # Documentation
```

## 🎨 Vaccination Schedule

The system includes a comprehensive vaccination schedule based on national immunization guidelines:

| Age | Vaccines |
|-----|----------|
| **Birth** | BCG, Hepatitis B (1st), OPV (Birth) |
| **6 Weeks** | DTP (1st), Hib (1st), Rotavirus (1st), PCV (1st), IPV (1st) |
| **10 Weeks** | DTP (2nd), Hib (2nd), Rotavirus (2nd), PCV (2nd) |
| **14 Weeks** | DTP (3rd), Hib (3rd), Rotavirus (3rd), PCV (3rd), IPV (2nd) |
| **9 Months** | MMR (1st), Typhoid |
| **12 Months** | Hepatitis A (1st), Varicella (1st) |
| **15 Months** | MMR (2nd), DTP Booster |

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Granular permissions for different user types
- **Password Hashing** - bcrypt for secure password storage
- **Input Validation** - Comprehensive data validation
- **Rate Limiting** - Protection against brute force attacks
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Various security headers

## 📱 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
```

### Parent Endpoints
```http
GET  /api/children          # Get parent's children
POST /api/children          # Add new child
POST /api/vaccination/request-completion  # Request vaccine completion
```

### Doctor Endpoints
```http
GET  /api/vaccination/pending-requests    # Get pending requests
PUT  /api/vaccination/approve/:id         # Approve vaccination
PUT  /api/vaccination/reject/:id          # Reject vaccination
GET  /api/vaccination/search              # Search children
```

### Admin Endpoints
```http
GET  /api/admin/dashboard/stats           # System statistics
GET  /api/admin/doctors/pending          # Pending doctor approvals
PUT  /api/admin/doctors/:id/approve      # Approve doctor
PUT  /api/admin/doctors/:id/reject       # Reject doctor
```

## 🎨 Color-Coded Status System

- 🟢 **Completed** - Vaccination administered and verified
- 🔵 **Upcoming** - Vaccine due in future or today
- 🔴 **Overdue** - Vaccine past due date (requires immediate attention)
- 🟡 **Pending Approval** - Request submitted, awaiting doctor review

## 📋 Certificate Generation

The system generates professional vaccination certificates including:
- **Official Header** with institutional branding
- **Child Information** (name, DOB, age, gender)
- **Parent Details** and contact information
- **Vaccination Table** with complete history
- **QR Code** for digital verification
- **Official Disclaimers** and legal statements
- **Print/Download** capabilities

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run frontend tests
npm run test:frontend
```

### Test Data
Use the provided scripts to generate test data:
```bash
cd backend
node scripts/createTestRequests.js  # Creates sample vaccination requests
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
cd backend
npm start
```

### Environment Variables (Production)
```env
NODE_ENV=production
MONGO_URI=mongodb://your-production-db
JWT_SECRET=your-strong-jwt-secret
SESSION_SECRET=your-strong-session-secret
PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📖 Documentation

- [System Architecture](SYSTEM_DOCUMENTATION.md)
- [Feature Implementation](FEATURES_IMPLEMENTED.md)
- [Doctor Dashboard Fixes](DOCTOR_FIXES.md)
- [Certificate Generation](VACCINATION_CERTIFICATE.md)
- [Testing Guide](TESTING_GUIDE.md)

## 🐛 Known Issues

- LLM integration is placeholder-ready for AI advice and certificate generation
- Real-time notifications system can be enhanced
- Mobile responsiveness can be improved for some components

## 🛣️ Roadmap

- [ ] **AI Integration** - Implement LLM-powered vaccination advice
- [ ] **Mobile App** - React Native companion app
- [ ] **SMS Notifications** - Automated vaccination reminders
- [ ] **Multi-language** - Support for multiple languages
- [ ] **Government Integration** - Connect with national health systems
- [ ] **Advanced Analytics** - Enhanced reporting and insights
- [ ] **Telemedicine** - Video consultation features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

Developed with ❤️ for better child healthcare management.

## 🆘 Support

For support, please contact:
- **Email**: support@vaccination-portal.com
- **Documentation**: See docs/ folder
- **Issues**: GitHub Issues section

---

**Made with ❤️ to protect every child's future through better vaccination management.**

