
# DaphOS — Staff Scheduler

A React app for managing hospital staff schedules. Add employees, assign shifts, and track weekly schedules. Built for the DaphOS coding challenge.

![Preview](readme-assets/Screenshot.png)
## Quick Start

Make sure you have Node.js installed, then:

```bash
# Clone and setup
git clone https://github.com/yvanlo/DaphOsChallenge
cd daphos-challenge
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 to view the app.

## What's Inside

- **Employees**: Add and manage staff members
- **Shifts**: Assign work schedules with different shift types
- **Local Storage**: Data saves automatically in your browser
- **Clean UI**: Simple interface built with React and CSS

## Main Features

- View all employees and their details
- Create and edit staff profiles  
- Assign shifts (Day, Night, On-Call)
- Automatic schedule rules (On-Call shifts affect next day schedules)
- Mobile-friendly design

## Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Check code quality
```

## Project Structure

```
src/
├── assets/         # pictures
├── components/     # React components
├── hooks/          # Custom hooks for data
└── styles/         # CSS files
```

The app stores everything locally in your browser - no backend needed.

## About the Code

The schedule logic handles shift rules automatically. For example, when someone works an On-Call shift, the next day's schedule adjusts accordingly. All data persists in localStorage.

Built with React, Vite, and modern CSS.
