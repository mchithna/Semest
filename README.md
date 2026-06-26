# Semest - UniScore Track

Semest is a web application for university students to calculate, persist, and visualize their weighted GPA / Z-score performance across semesters and degrees.

## Features

- **Live Calculator:** Enter modules with credit values and letter grades; the weighted score recomputes in real time.
- **Multiple Degrees:** Manage different academic programs simultaneously.
- **Semester Persistence:** Save semesters and view cumulative performance.
- **Dashboard:** Visualize GPA trends over time with interactive charts.
- **Community Templates (Presets):** Create reusable degree templates and share them via a unique 6-character code. Others can clone your template and just fill in their grades!

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend & Auth:** Supabase (PostgreSQL, Auth, RLS)
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Charts:** Recharts

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mchithna/Semest.git
   cd Semest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Deployment (Vercel)

This project is configured for seamless deployment to Vercel. 

1. Push your code to GitHub.
2. Import the project in your Vercel dashboard.
3. Make sure the **Framework Preset** is set to `Vite`.
4. Add the following **Environment Variables** in the Vercel deployment settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy! The included `vercel.json` ensures that SPA client-side routing works correctly when users refresh the page.

## Database Setup

All database tables and Row Level Security (RLS) policies are defined in `supabase/schema.sql`. Run this file in your Supabase SQL Editor to set up the backend structure.
