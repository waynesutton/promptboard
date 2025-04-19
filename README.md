# 1 Million Prompts | Track and generate AI images with OpenAI DALL·E 3 on Convex, Cooked with Chef

## About

1 Million Prompts is an AI image generator built on Convex, Convex Chef, and OpenAI DALL·E 3 where every prompt counts toward a shared goal: generating one million images.
Create and share AI art, track progress in real-time, and explore a living gallery of prompts from the community.
It's not just an app—it's a global race to one million

## Features

- **Style Selection**: Choose from multiple artistic styles:

  - Studio Laika (stop-motion inspired)
  - 3D Soft (Pixar-style)
  - Ghibli (watercolor style)
  - 80s Anime
  - T206 Vintage
  - Futuristic
  - B&W

- **Image Generation**:

  - Enter custom prompts
  - Select artistic styles
  - Generate images with DALL-E 3
  - Real-time loading indicator with cooking-themed words

- **Gallery Management**:
  - View generated images in a responsive 20-column grid
  - Click to view larger versions
  - Add likes to favorite images
  - Add and view comments
  - Copy image links
  - Track total images generated

## Tech Stack

- Frontend: React + Vite
- Backend: Convex
- Styling: TailwindCSS
- AI: OpenAI DALL-E 3
- Language: TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Add OpenAI API key to Convex environment
4. Start development server: `npm run dev`

## Environment Setup

Add your OpenAI API key to Convex:

1. Open Convex dashboard
2. Go to Settings
3. Add `OPENAI_API_KEY` environment variable

## Usage

1. Enter a prompt
2. Select a style
3. Generate AI image
4. View in gallery
5. Interact with likes and comments

## Contributing

Feel free to submit issues and enhancement requests.

## Project Structure

```
.
├── convex/               # Convex backend functions and schema
│   ├── _generated/       # Auto-generated Convex files
│   ├── auth.config.ts    # Authentication configuration
│   ├── auth.ts           # Authentication helper functions
│   ├── functions.ts      # General utility functions (if any)
│   ├── gallery.ts        # Core image generation and gallery logic
│   ├── http.ts           # HTTP endpoints (if any)
│   └── schema.ts         # Database schema definition
├── public/               # Static assets (e.g., images, fonts)
├── src/                  # Frontend source code
│   ├── components/       # Reusable React components
│   │   └── ui/           # UI library components (e.g., Shadcn)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions for the frontend
│   ├── App.tsx           # Main application component with routing
│   ├── Dashboard.tsx     # Dashboard page component
│   ├── Home.tsx          # Home page component
│   ├── SignInForm.tsx    # Sign-in form component
│   ├── SignOutButton.tsx # Sign-out button component
│   ├── index.css         # Global styles
│   └── main.tsx          # Application entry point
├── .env.local            # Local environment variables (Gitignored)
├── .gitignore            # Specifies intentionally untracked files
├── README.md             # Project documentation (this file)
├── bun.lockb             # Bun lockfile
├── index.html            # Main HTML entry point for Vite
├── package.json          # Project metadata and dependencies
├── postcss.config.cjs    # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # Base TypeScript configuration
├── tsconfig.app.json     # TypeScript configuration for the app
├── tsconfig.node.json    # TypeScript configuration for Node contexts
└── vite.config.ts        # Vite configuration
```

## Understanding Convex

Learn more about the concepts and best practices behind Convex:

- [Convex Overview](https://docs.convex.dev/understanding/)
- [Development Workflow](https://docs.convex.dev/understanding/workflow)
- [Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [TypeScript Best Practices](https://docs.convex.dev/understanding/best-practices/typescript)
- [Environment Variables](https://docs.convex.dev/production/environment-variables)
- [AI Code Generation](https://docs.convex.dev/ai)

## Hosting

For more detailed instructions, visit the [Convex deployment guide](https://docs.convex.dev/production/hosting/).

## 📝 License

This project is open source and available under the MIT License.

## Credits

Built with [Chef](https://convex.link/1millchefs)

# promptboard
