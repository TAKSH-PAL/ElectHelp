# DTU Course Recommendation System - Full Stack Setup

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### 1. Environment Setup
```bash
# Copy the environment file
cp .env.example .env

# Edit .env and add your Gemini API key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Start the Application
```bash
# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Initialize Data
```bash
# Run data migration to populate MongoDB
docker exec course_backend npm run migrate
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 🛠️ Local Development Setup

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start MongoDB (make sure MongoDB is running locally)
# Or use Docker: docker run -d -p 27017:27017 mongo:6.0

# Start backend in development mode
npm run dev

# Run data migration
npm run migrate
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get specific course
- `GET /api/courses/popular` - Get popular courses
- `GET /api/courses/trap` - Get trap courses

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review (auth required)

### AI Features
- `POST /api/ai/summary` - Generate course summary

## 🗄️ Database Schema

### Course Model
- Basic info: name, type, courseId
- Statistics: avgRating, chillScore, totalReviews
- Flags: isTrapCourse, hasNoExam, isPopular
- Teachers: name, rating, reviewCount

### Review Model
- User reference and course reference
- Ratings: overall, teaching, content, difficulty
- Review content and study information
- Moderation and engagement metrics

### User Model
- Authentication: username, email, password
- Profile: firstName, lastName, branch, year
- Activity: reviewsSubmitted, coursesViewed
- Preferences: studyStyle, goalType

## 🌟 Features

### Core Features
- **Course Search & Filtering**: Search by name, type, teacher
- **Advanced Sorting**: By rating, chill score, review count
- **Detailed Course Pages**: Complete statistics and reviews
- **User Authentication**: JWT-based secure authentication
- **Responsive Design**: Mobile-first Tailwind CSS

### AI-Powered Features
- **Course Summaries**: AI-generated summaries using Gemini
- **Study Plans**: Personalized recommendations
- **Smart Recommendations**: Based on user preferences

### Real-time Features
- **Live Updates**: Socket.IO for real-time data
- **Instant Search**: Debounced search with suggestions
- **Dynamic Filtering**: Client-side filtering for speed

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/course_recommendation
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Development Commands

### Backend
```bash
npm start          # Production start
npm run dev        # Development with nodemon
npm run migrate    # Run data migration
npm test          # Run tests
```

### Frontend
```bash
npm start         # Development server
npm run build     # Production build
npm test          # Run tests
```

### Docker
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs backend       # View backend logs
docker-compose exec backend sh    # Access backend container
```

## 🚀 Production Deployment

1. **Environment Variables**: Set production values
2. **Database**: Use MongoDB Atlas or managed MongoDB
3. **API Keys**: Secure your Gemini API key
4. **Domain Setup**: Configure CORS for your domain
5. **SSL**: Use HTTPS in production

## 🤝 API Usage Examples

### Get Courses with Filters
```javascript
GET /api/courses?search=NCC&goal=no_exam&sortBy=rating&page=1&limit=10
```

### Create a Review
```javascript
POST /api/reviews
{
  "course": "courseObjectId",
  "teacher": { "name": "Teacher Name" },
  "rating": { "overall": 9 },
  "review": { "content": "Great course!" },
  "wouldRecommend": true
}
```

### Generate AI Summary
```javascript
POST /api/ai/summary
{
  "reviews": ["Review 1", "Review 2"],
  "courseName": "Course Name"
}
```

This full-stack setup provides a modern, scalable architecture for the DTU Course Recommendation System with React frontend, Node.js/Express backend, MongoDB database, and AI integration.
