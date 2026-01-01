# SFC Frontend

Modern web application for SFC Gym & Fitness Center built with Next.js 15, React 19, and TypeScript.

## Features

- **Authentication**: Email/password signup with OTP verification, JWT tokens, "Remember Me" functionality
- **User Onboarding**: Multi-step wizard for fitness profile setup
- **Programs**: Browse, enroll, and track progress in fitness programs
- **Workout Player**: Side-by-side YouTube video player with workout details
- **Admin Panel**: Dashboard with stats, program/workout management, user management
- **Responsive Design**: Desktop-first with mobile support
- **Dark Theme**: Modern dark purple aesthetic with smooth animations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Lucide React
- **YouTube**: react-youtube

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup, etc.)
│   ├── (main)/            # Main app pages (dashboard, programs, etc.)
│   ├── admin/             # Admin panel pages
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Layout components (Navbar, Footer)
│   ├── programs/          # Program-related components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── api.ts             # API client and types
│   └── utils.ts           # Utility functions
└── store/
    └── auth.ts            # Authentication state (Zustand)
```

## Pages

### Public
- `/` - Landing page
- `/programs` - Browse programs
- `/programs/:id` - Program details
- `/login` - User login
- `/signup` - User registration
- `/verify-otp` - OTP verification
- `/forgot-password` - Password reset

### Authenticated
- `/dashboard` - User dashboard
- `/onboarding` - Profile setup wizard
- `/profile` - User profile management
- `/programs/:id/workout/:workoutId` - Workout player

### Admin
- `/admin/login` - Admin login
- `/admin` - Admin dashboard
- `/admin/programs` - Program management
- `/admin/programs/new` - Create program
- `/admin/programs/:id` - Edit program
- `/admin/users` - User management

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Docker

The frontend can be built and run as a Docker container:

```bash
# Build image
docker build -t sfc-frontend .

# Run container
docker run -p 3000:3000 sfc-frontend
```

Or use Docker Compose from the root directory:

```bash
cd ..
docker compose up --build
```

## Design System

### Colors
- **Primary**: Purple gradient (`#9333ea` to `#a855f7`)
- **Accent**: Cyan (`#06b6d4`), Gold (`#f59e0b`), Emerald (`#10b981`), Rose (`#f43f5e`)
- **Dark**: Dark slate palette (`#020617` to `#f8fafc`)

### Typography
- **Display Font**: Space Grotesk
- **Body Font**: Outfit

### Components
- Glass morphism effects
- Gradient borders
- Smooth animations (Framer Motion)
- Custom scrollbars

