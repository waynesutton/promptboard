# File Structure

- `convex/`: Directory for Convex backend functions and schema.
  - `schema.ts`: Defines the database schema (gallery, comments tables).
  - `gallery.ts`: Contains Convex queries, mutations, and actions for gallery operations (image generation, listing, liking, commenting, dashboard data fetching).
  - `http.ts`: (Likely exists for Convex setup, handles HTTP actions if any).
  - `_generated/`: Auto-generated Convex files (API, server, dataModel).
- `src/`: Directory for frontend React code.
  - `main.tsx`: Entry point for the React application, sets up Convex provider.
  - `index.css`: Tailwind CSS directives and base styles.
  - `App.tsx`: Main application component, now handles routing between Home and Dashboard.
  - `Home.tsx`: Component for the main image gallery page (previously App.tsx content).
  - `Dashboard.tsx`: **NEW** Component for the dashboard page, displaying stats and data tables.
- `public/`: Static assets.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.
- `vite.config.ts`: Vite configuration.
- `features.md`: **NEW** Tracks application features.
- `prompts.md`: **NEW** Stores history of user prompts.
- `files.md`: **NEW** This file, lists codebase files and descriptions.
