# Setup Guide for Trading Card Generator

This guide walks you through setting up and deploying the Trading Card Generator app created with Chef.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- An OpenAI API key
- A Convex account (free at [convex.dev](https://dashboard.convex.dev))
- Git installed (optional but recommended)

## Local Development Setup

### 1. Download and Extract

1. Download your app from Chef
2. Extract the ZIP file to your preferred location
3. Open the folder in your IDE (VS Code, Cursor, etc.)

### 2. Install Dependencies

Open a terminal in your project directory and run:

```bash
npm install
```

### 3. Set Up Convex

1. Install the Convex CLI globally:
```bash
npm install -g convex
```

2. Log in to Convex:
```bash
npx convex login
```

3. Initialize Convex in your project:
```bash
npx convex init
```

This will:
- Create a new Convex project
- Add your project URL to `.env.local`
- Set up necessary Convex configurations

### 4. Configure Environment Variables

1. Open the Convex dashboard at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Go to "Settings" (gear icon)
4. Click on "Environment Variables"
5. Add your OpenAI API key:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

### 5. Start Development Server

1. Start the Convex development server:
```bash
npx convex dev
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## Deployment

### 1. Prepare for Production

1. Create a production branch (optional but recommended):
```bash
git init
git add .
git commit -m "Initial commit"
git branch production
git checkout production
```

2. Update your Convex deployment:
```bash
npx convex deploy
```

### 2. Deploy Frontend

You have several options for deploying the frontend:

#### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_CONVEX_URL`: Your Convex deployment URL (from `.env.local`)
5. Deploy

#### Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your repository
4. Add environment variables:
   - `VITE_CONVEX_URL`: Your Convex deployment URL
5. Set build command: `npm run build`
6. Set publish directory: `dist`
7. Deploy

#### Option 3: Manual Deploy

1. Build your app:
```bash
npm run build
```

2. Deploy the `dist` folder to your preferred hosting service

### 3. Verify Deployment

1. Open your deployed URL
2. Test all functionality:
   - Image upload
   - Style selection
   - Gallery features
   - OpenAI integration

### 4. Common Issues

- If images don't load, check your OpenAI API key in Convex environment variables
- If the app shows a blank screen, verify your Convex URL is correctly set
- If gallery doesn't update, ensure Convex functions are properly deployed

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Vite Documentation](https://vitejs.dev)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Convex logs in the dashboard
3. Verify all environment variables are set
4. Ensure all dependencies are installed

For more help, visit the [Convex Discord](https://discord.com/invite/q5K2VHvBcD)
