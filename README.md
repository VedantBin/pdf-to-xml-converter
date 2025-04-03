# PDF to XML Converter

A robust web application for converting PDF documents to XML format with advanced features for document transformation management.

![PDF to XML Converter](./client/public/app-screenshot.svg)

## ✨ Main Functionality

The PDF to XML Converter is designed to provide seamless document transformation with a focus on usability and reliability.

### 🔍 Core Features

1. **PDF to XML Conversion**
   - Upload any PDF document and instantly transform it to structured XML format
   - Preserves document structure and content relationships
   - Handles complex PDF layouts with nested elements

2. **User Management System**
   - Secure registration and login with email validation
   - Password security with minimum requirements (6+ chars, symbols, mixed case)
   - JWT-based authentication with HTTP-only cookies for maximum security

3. **Conversion History Dashboard**
   - Complete history of all your conversion activities
   - Advanced filtering and sorting capabilities
   - Detailed view of conversion results with export options

4. **Responsive UI Experience**
   - Optimized layouts for desktop, tablet, and mobile devices
   - Smooth transitions between different screen sizes
   - Thoughtfully designed for maximum usability

5. **Theme Customization**
   - Built-in dark and light themes with custom color palettes
   - Automatic theme detection based on system preferences
   - Smooth theme transitions with fade effects

6. **Intelligent Storage System**
   - MongoDB integration for persistent data storage
   - Smart fallback to in-memory storage when database is unavailable
   - Automatic data migration when MongoDB connection is restored

## 📋 Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas account)

## 🔧 Installation

1. Clone this repository
   ```bash
   git clone https://github.com/VedantBin/pdf-to-xml-converter.git
   cd pdf-to-xml-converter
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Install dependencies
   ```bash
   # Install server and client dependencies
   npm install bcryptjs jsonwebtoken cookie-parser mongodb mongoose dotenv pdf-parse xml-js
   
   # If not already installed, install UI/component libraries
   npm install @radix-ui/react-* clsx tailwind-merge
   
   # Install development dependencies
   npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cookie-parser @types/multer @types/pdf-parse
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5000`

## 🏗️ Project Structure

```
├── client/                 # Frontend code
│   ├── public/             # Static assets
│   └── src/                # React components and logic
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       ├── pages/          # Page components
│       └── types/          # TypeScript type definitions
├── server/                 # Backend code
│   ├── db/                 # Database connections
│   ├── storage.ts          # Storage interfaces
│   ├── storage-manager.ts  # Storage implementation manager
│   ├── routes.ts           # API endpoints
│   └── auth.ts             # Authentication logic
└── shared/                 # Shared code between client and server
    └── schema.ts           # Data schemas and types
```

## 💾 Database Configuration

The application supports both in-memory storage (for development) and MongoDB (for production):

### MongoDB Configuration
1. Create a MongoDB Atlas account or set up a local MongoDB instance
2. Add your MongoDB connection string to the `.env` file as `MONGODB_URI`
3. The application will automatically connect to MongoDB and handle migration

#### Setting Up MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (the free tier is sufficient)
3. In the Security tab, create a database user with read/write permissions
4. In the Network Access tab, add your IP address or allow access from anywhere for development
5. Click "Connect" on your cluster, select "Connect your application"
6. Copy the connection string and replace `<password>` with your database user's password
7. Add this connection string to your `.env` file as `MONGODB_URI`

#### Storage Failover System
The application includes an automatic storage failover system:
- The system will attempt to connect to MongoDB on startup
- If MongoDB is unavailable, it will automatically use in-memory storage
- It periodically checks MongoDB connection status (every 30 seconds)
- When MongoDB becomes available, it automatically switches to MongoDB storage
- Any data created during the MongoDB outage will be migrated to MongoDB when connection is restored

## 🔐 Authentication System

The application implements a secure authentication system with the following features:

### User Registration Requirements
- Email validation with proper format checking
- Password requirements:
  - Minimum 6 characters
  - Must contain at least one symbol
  - Must contain at least one lowercase letter
  - Must contain at least one uppercase letter

### Security Features
- JWT (JSON Web Token) based authentication
- Secure password hashing with bcrypt
- Protected routes that require authentication
- Automatic token refresh
- Session management with secure HTTP-only cookies

### Authentication Flow
1. User registers with email and password
2. Password is validated against security requirements
3. Password is hashed before storage in the database
4. On login, credentials are verified and a JWT token is issued
5. Token is stored in an HTTP-only cookie for security
6. Protected API routes validate the token before allowing access

## 🚀 API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/register` | POST | Create a new user account | No |
| `/api/login` | POST | Log in to an existing account | No |
| `/api/logout` | POST | Log out of the current session | Yes |
| `/api/user` | GET | Get the current user's information | Yes |
| `/api/convert` | POST | Convert a PDF file to XML | Yes |
| `/api/conversions` | GET | Get a list of the user's conversions | Yes |
| `/api/conversions/:id` | GET | Get a specific conversion | Yes |
| `/api/conversions/:id` | DELETE | Delete a specific conversion | Yes |

## 🔄 Storage Management

The application includes a sophisticated storage management system that:

1. Automatically detects MongoDB availability
2. Gracefully falls back to in-memory storage when MongoDB is unavailable
3. Periodically checks MongoDB connection status and switches storage implementations as needed
4. Migrates data from in-memory to MongoDB when connection is established

## 🧩 Key Components

The application is built with a modular architecture with several key components:

### Core Functionality

1. **PDF Conversion Engine**
   - Located in `server/routes.ts`
   - Uses pdf-parse to extract text and document structure
   - Converts PDF content to structured XML format
   - Preserves document hierarchy and metadata

2. **Authentication System**
   - Located in `server/auth.ts`
   - JWT-based authentication with secure token handling
   - Robust password hashing using bcrypt
   - Protected routes middleware

3. **Storage Abstraction**
   - Located in `server/storage.ts` and `server/storage-manager.ts`
   - Interface-based design with multiple implementations
   - Seamless switching between storage providers
   - Automatic failover and recovery

### User Interface

1. **Conversion Interface**
   - Drag-and-drop file upload functionality
   - Real-time conversion progress indicator
   - Syntax-highlighted XML output display
   - One-click download of conversion results

2. **History Dashboard**
   - Advanced filtering and sorting capabilities
   - Detailed conversion metadata display
   - Paginated results for improved performance
   - Quick access to past conversions

## 🎨 Themes

The application supports both light and dark themes:

- **Dark Mode**: Rich purple palette (#2E073F, #7A1CAC, #AD49E1, #EBD3F8)
- **Light Mode**: Soft pastel palette (#8F87F1, #C68EFD, #E9A5F1, #FED2E2)

## 🔍 Advanced Filtering

The application provides comprehensive filtering capabilities for the conversion history:

### Search Filters
- **Text Search**: Find conversions by filename or content
- **Date Range**: Filter conversions by conversion date (from/to)
- **File Size**: Filter by file size range (min/max)

### Sorting Options
- **Sort by Date**: Newest to oldest or oldest to newest
- **Sort by Filename**: Alphabetical (A-Z or Z-A)
- **Sort by Size**: Largest to smallest or smallest to largest

### Pagination
- Control the number of items per page
- Navigate through pages of conversion history
- See total count of matching conversions

## 📱 Responsive Design

The UI adapts to different screen sizes:

- **Desktop**: Three-column layout with Upload, Output, and History sections
- **Mobile**: Single-column layout with tabbed navigation

## 🧰 Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: MongoDB with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Processing**: pdf-parse
- **XML Processing**: xml-js

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any problems or have any questions, please open an issue on the [GitHub repository](https://github.com/VedantBin/pdf-to-xml-converter/issues).