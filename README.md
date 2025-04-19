# 1 Million Prompts

A web application that generates AI-powered images using OpenAI's DALL-E 3 model with custom style transformations.

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

## License

MIT

## Credits

Built with [Chef](https://chef.convex.dev)
# promptboard
