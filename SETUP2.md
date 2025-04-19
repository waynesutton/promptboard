````markdown
# 1 Million Prompts - Detailed Setup Guide

## App Overview

A web application that generates AI-powered images using OpenAI DALL-E 3 with custom style transformations.

## Tech Stack

- Frontend: React + Vite
- Backend: Convex
- Styling: TailwindCSS
- AI: OpenAI DALL-E 3
- Language: TypeScript

## Color Palette

- Background: #F3F4F6
- Text Colors:
  - Primary: #0F0F0F
  - Secondary: #6B7280
  - Body: #3B3B3B
- Button Colors:
  - Primary: #EB2E2A (Generate button)
  - White: #FFFFFF
- Modal Overlay: rgba(0, 0, 0, 0.6)
- Convex Logo Colors:
  - Yellow: #F3B01C
  - Purple: #8D2676
  - Red: #EE342F

## Fonts

- Primary Font: Chakra Petch (Light 300)
  - Header: 32px
  - Counter: 18px
- System Font: Inter
  - Regular text: 14px
  - Input text: 14px

## Layout Structure

1. **Header**

   - Title "1 million prompts" (left)
   - Image counter (right)
   - Padding: 24px horizontal, 16px vertical

2. **Main Content**

   - Input row:
     - Text input (flex-grow)
     - Style dropdown (fixed width)
     - Generate button (fixed width)
   - Gallery grid:
     - 20 columns
     - No gaps
     - Square images

3. **Modals**

   - Loading Modal:
     - Centered Convex logo animation
     - Cycling cooking words
   - Image Modal:
     - 400x400px image
     - Like, comment, copy buttons
   - Comment Modal:
     - Comment list (scrollable)
     - Name input
     - Comment input
     - Submit button

4. **Footer**
   - "Cooked on Chef" text
   - Chef logo (height: 32px)

## Key Features

### 1. Image Generation

```typescript
// System Prompts
export const SYSTEM_PROMPTS = {
  "Studio Laika": "A stop-motion-inspired image in the style of Studio Laika (Coraline, Kubo).",
  "3dsoft": "A Pixar-style 3D animated image.",
  Ghibli: "A Studio Ghibli-style watercolor image.",
  "80s Anime": "A 1980s anime style image.",
  "T206 Vintage": "A vintage T206 image style.",
  futuristic:
    "A futuristic image with a dark, moody neon aesthetic and soft sci-fi lighting, holographic materials, glowing edges, and subtle motion-blur reflections.",
  "b&w":
    "A high-contrast black and white image with dramatic shadows and a timeless, cinematic style.",
};
```
````

### 2. Loading Animation

```typescript
// Cooking Words Array
const cookingWords = ["baking", "boiling", "grilling", "roasting", "frying", "sauteing", "steaming", "broiling", "chopping", "mixing", "whisking", "stirring", "blending", "measuring", "seasoning", "marinating", "preheating", "peeling", "slicing", "dicing", "mincing", "simmering", "poaching", "glazing", "caramelizing", "reducing", "kneading", "folding", "greasing", "sifting", "cracking", "spreading", "layering", "toasting", "skewering", "drizzling", "serving", "plating", "garnishing", "flipping", "tossing", "braising", "grating", "infusing", "chilling", "reheating", "pureeing", "melting", "searing", "rubbing"];

// Convex Logo SVG
<svg className="w-16 h-16 text-white animate-spin mx-auto" viewBox="0 0 10870 10946">
  <path d="M6868.76 8627.42C8487.29 8450.74 10013.2 7603.18 10853.3 6188.51C10455.5 9687.49 6562.35 11899.1 3384.6 10541.2C3091.79 10416.4 2839.74 10208.9 2666.77 9942.01C1952.64 8839.93 1717.89 7437.62 2055.19 6165.03C3018.89 7799.62 4978.42 8801.63 6868.76 8627.42Z" fill="#F3B01C"/>
  <path d="M1995.82 5138.31C1339.76 6628.34 1311.35 8372.89 2115.67 9808.56C-714.901 7715.6 -684.013 3236.85 2081.07 1164.89C2336.83 973.381 2640.76 859.713 2959.53 842.416C4270.41 774.462 5602.3 1272.38 6536.35 2200.25C4638.6 2218.78 2790.26 3413.53 1995.82 5138.31Z" fill="#8D2676"/>
  <path d="M7451.92 2658.62C6494.39 1346.5 4995.71 453.219 3353.71 426.038C6527.75 -989.865 10432 1305.73 10857 4699.69C10896.5 5014.75 10844.6 5335.98 10702.6 5620.15C10109.5 6803.78 9009.91 7721.77 7724.97 8061.53C8666.43 6345.4 8550.29 4248.73 7451.92 2658.62Z" fill="#EE342F"/>
</svg>
```

## Backend Structure (Convex)

### Schema

```typescript
export default defineSchema({
  ...authTables,
  gallery: defineTable({
    imageUrl: v.string(),
    style: v.string(),
    prompt: v.string(),
    aiResponse: v.string(),
    likes: v.number(),
  }),
  comments: defineTable({
    galleryId: v.id("gallery"),
    userName: v.string(),
    text: v.string(),
  }).index("by_gallery", ["galleryId"]),
});
```

### Required Environment Variables

```
OPENAI_API_KEY=your_openai_api_key
```

## Frontend Components

### 1. Main App Structure

```typescript
function App() {
  // States
  const [selectedStyle, setSelectedStyle] = useState("Studio Laika");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);

  // Queries & Actions
  const listGallery = useQuery(api.gallery.listGallery) || [];
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const generateImage = useAction(api.gallery.processImage);
  const addComment = useMutation(api.gallery.addComment);
  const addLike = useMutation(api.gallery.addLike);
}
```

### 2. Tailwind Classes

- Container: `min-h-screen bg-[#F3F4F6] flex flex-col`
- Header: `flex items-center justify-between px-6 py-4`
- Title: `font-['Chakra_Petch'] font-light text-[32px] text-[#0F0F0F]`
- Input: `flex-1 px-4 py-2 bg-white rounded-lg shadow-sm`
- Button: `px-6 py-2 bg-[#EB2E2A] text-white rounded-lg`
- Gallery Grid: `grid grid-cols-20 gap-0`
- Modal Overlay: `fixed inset-0 bg-black/60 flex items-center justify-center`

## Setup Steps

1. **Create Project**

   ```bash
   npm create vite@latest my-app -- --template react-ts
   cd my-app
   ```

2. **Install Dependencies**

   ```bash
   npm install convex openai react tailwindcss
   ```

3. **Initialize Convex**

   ```bash
   npx convex init
   ```

4. **Configure Environment**

   - Add OpenAI API key to Convex environment variables
   - Set up Convex deployment

5. **Copy Files**

   - Create `gallery.ts` in convex/
   - Create `App.tsx` in src/
   - Update `schema.ts` in convex/

6. **Start Development**
   ```bash
   npm run dev
   npx convex dev
   ```

## Deployment

1. Deploy Convex functions:

   ```bash
   npx convex deploy
   ```

2. Deploy frontend:
   - Push to GitHub
   - Connect to Vercel/Netlify
   - Add environment variables
   - Deploy

## Common Issues

1. Image generation errors:
   - Check OpenAI API key
   - Verify prompt format
2. Gallery display issues:
   - Check Convex schema
   - Verify query functions
3. Loading state:
   - Ensure proper state management
   - Check async function handling

## Support

For more help:

- Convex Discord: https://discord.com/invite/q5K2VHvBcD
- OpenAI Docs: https://platform.openai.com/docs
- Chef Docs: https://convex.link/1millchefs

```

```
