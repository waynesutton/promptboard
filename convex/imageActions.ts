"use node";
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import { internal } from "./_generated/api";

// Re-define SYSTEM_PROMPTS here if it's used by processImage, or import if it's complex
// For simplicity, assuming it might be needed or co-located.
// If SYSTEM_PROMPTS is large and only used here, keep it here.
// If it's broadly used by gallery.ts queries/mutations too, consider a shared file or keeping it in gallery.ts and importing.
// Given processImage is the primary user of SYSTEM_PROMPTS for image generation, let's include a simplified version or assume it's passed/handled.
// For now, let's assume SYSTEM_PROMPTS might be specific to this action or handled internally.
// We will copy SYSTEM_PROMPTS from gallery.ts to here for now.

export const SYSTEM_PROMPTS = {
  "Studio Laika": "A stop-motion-inspired image in the style of Studio Laika (Coraline, Kubo).",
  "3dsoft":
    "A soft 3D illustration of the subject, isolated on a smooth, light beige background. The subject should have rounded, minimalistic shapes with subtle shading and soft ambient shadows, giving it a playful, clay-like or plasticine texture. Avoid photorealism—focus on a stylized, toy-like aesthetic. Use a soft isometric or slightly top-down perspective with smooth lighting and no harsh reflections. Render each object with realistic but simplified proportions, a matte finish, and a warm, inviting color palette. The overall tone should feel clean, calm, and tactile—suitable for product design icons, character scenes, or concept visuals.",
  Ghibli: "A Studio Ghibli-style watercolor image.",
  "80s Anime": "A 1980s anime style image.",
  "T206 Vintage": "A vintage T206 image style.",
  futuristic:
    "A futuristic trading card with a dark, moody neon aesthetic and soft sci-fi lighting, holographic materials, glowing edges, and subtle motion-blur reflections.",
  "b&w":
    "A high-contrast black and white image with dramatic shadows and a timeless, cinematic style.",
  "photorealistic portrait":
    "A hyper-realistic portrait featuring lifelike skin textures, natural lighting, and sharp focus, resembling a high-resolution photograph captured with a professional camera.",
  realism:
    "An image rendered in a realistic style, emphasizing accurate lighting, textures, and proportions to closely mimic real-life appearances.",
  "immersive photo-real":
    "A richly detailed, cinematic image that feels like a high-end photograph. Focuses on realism, motion, and depth, ideal for storytelling scenes like racing, biking, or travel photography.",
  "lifestyle realism":
    "A photorealistic image capturing candid everyday life—like families cooking, people laughing, or friends hanging out—lit naturally with warm tones and composed like a magazine editorial.",
  "thermal silhouette":
    "A digital thermal silhouette of a full-body human figure with no facial features or clothing. Uses a soft thermal gradient ({gradient_colors}) over a smooth shape, with a white glowing starburst in the chest ({intensity_center}). Brightness is focused on high heat zones ({high_heat_zones}), and the edges are blurred and gently liquified into a clean white background.",
  "knitted toy":
    "An image styled as a handcrafted knitted toy, featuring yarn textures, stitched details, and a soft, plush appearance.",
  sticker:
    "A vibrant, flat-design image with bold outlines and minimal shading, resembling a collectible sticker.",
  "low poly":
    "A minimalist 3D image composed of simple geometric shapes and flat shading, emulating a low-polygon aesthetic.",
  marvel:
    "A dynamic, comic book-style image with bold lines, dramatic poses, and vibrant colors, inspired by Marvel superheroes.",
  "retro anime":
    "An image capturing the essence of 1980s anime, with vintage color palettes, grainy textures, and nostalgic character designs.",
  "pop art":
    "A bold and colorful image featuring high contrast, Ben-Day dots, and stylized elements, reminiscent of pop art icons like Warhol and Lichtenstein.",
  "oil on canvas":
    "A richly textured image with visible brushstrokes and layered colors, emulating a traditional oil painting on canvas.",
  pixar:
    "A charming 3D animated image with expressive characters, soft lighting, and a whimsical atmosphere, characteristic of Pixar films.",
  caricature:
    "An exaggerated and humorous image emphasizing distinctive features, styled as a playful caricature illustration.",
  convex:
    "A clean, modern image inspired by the Convex brand. Utilize a minimalist layout with ample white space, incorporating Convex's primary colors—red (#EE342F), yellow (#F3B01C), and purple (#8D2676)—sparingly to highlight key elements. Employ the Kanit typeface for any textual content, reflecting the brand's emphasis on mathematics and programming. Integrate the Reuleaux triangle motif subtly within the design to echo the brand's logo symbolism. The overall aesthetic should convey fluency, responsiveness, and reliability, aligning with Convex's brand identity.",
  "ai founder":
    "Create a stylized 'AI FOUNDER MODE EDITION' anime-inspired trading card. Render a full-body anime-style character based on the uploaded photo with soft pastel tones, clean lighting, and a confident pose. Character should wear a black hoodie that says 'AI Founder Mode' and hold an iPhone or laptop. Add fun tech-themed elements like an AI logo, a framed prompt spec, sticky notes, color wheels, and a glasses-wearing alpaca. Use a beige frame, soft office background, and clean card composition. Top label: 'startup.ai // Startup Founder'. Top-right small text: 'OPEN SOURCE HUMAN | ML-TRAINED | CHEF-COOKING'. Bottom-right: full name. Subtitle: 'AI FOUNDER MODE EDITION'. Style the typography with the Kanit font and accent the layout with Convex brand colors (#EE342F, #F3B01C, #8D2676) and a Reuleaux triangle motif. Background should include faint text: 'We should use Convex'.",
  "VC Mode Edition":
    "A stylized conference badge-style portrait of a venture capitalist character. Render the subject in clean modern vector art with soft lighting and neutral backgrounds. Add subtle overlays like 'Fundraising Mode', coffee mugs, pitch decks, and MacBooks. Include small labels like 'seed stage only' and 'thesis-driven'. Use a tech-minimalist card layout with whitespace and Convex brand colors.",
  "Infra Bro Mode":
    "Create a trading card portrait of a stereotypical infrastructure engineer with dark-mode aesthetics. Use glowing terminal windows, ASCII art, Kubernetes logos, and ultra-detailed keyboards. Add text overlays like 'Self-hosted, obviously' and 'Latency Matters'. Style the background like a data center or neon-tinted co-working cave. Typography should feel tactical and custom-built.",
  "Founder Hacker Card":
    "A collectible image card of a hoodie-wearing hacker-founder in night-lit lighting. Character sits at a desk covered in snacks, open terminal tabs, and whiteboard sketches. Environment is gritty, but lit with ambient neon or monitor glow. Style the card with handwritten TODOs, bug lists, and a sticker-covered laptop. Blend anime grit with startup optimism. Add a badge: 'BUILD WEEKEND WINNER'.",
  "pixel art":
    "A single pixel art character in the style of a 16-bit RPG sprite, rendered at a larger scale with clear, high-resolution detail. Use soft shading, a warm muted color palette, and a 3/4 top-down perspective. The character should have realistic proportions (not chibi), with clean pixel clusters and light dithering for depth and texture. Generate one of the following: 1. A warrior in classic medieval armor with gold accents, or 2. A mage in a dark robe with glowing rune details, holding a wooden staff with a faint magical orb. No animation. No background—export as a transparent PNG or on a plain background. Maintain a strong silhouette and visual clarity, similar to character artwork from *Chained Echoes* or *Octopath Traveler*, but not limited to sprite sheet dimensions.",
};

export const processImage = action({
  args: {
    prompt: v.string(),
    style: v.string(),
    turnstileToken: v.string(),
  },
  returns: v.object({
    storageId: v.id("_storage"),
    galleryId: v.id("gallery"),
    imageUrl: v.string(),
    aiResponse: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log("[processImage] Handler started. Checking for environment variable...");

    const secretKey = (ctx as any).env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error(
        "[processImage] ERROR: Cloudflare Turnstile Secret Key is not set in Convex environment variables."
      );
      throw new Error(
        "Turnstile configuration error. The site administrator needs to configure this."
      );
    }

    const verificationUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", args.turnstileToken);

    let verificationResult;
    try {
      const response = await fetch(verificationUrl, {
        method: "POST",
        body: formData,
      });
      verificationResult = await response.json();
      if (!response.ok) {
        console.error(
          `[processImage] Turnstile verification HTTP error: ${response.status}`,
          verificationResult
        );
        throw new Error(`Turnstile verification failed with status: ${response.status}`);
      }
    } catch (networkError) {
      console.error("[processImage] Network error while verifying Turnstile token:", networkError);
      throw new Error("Could not verify Turnstile token due to network issues.");
    }

    if (!verificationResult.success) {
      console.error(
        "[processImage] Cloudflare Turnstile verification failed:",
        verificationResult["error-codes"]
      );
      throw new Error(
        `Turnstile verification failed: ${verificationResult["error-codes"]?.join(", ") || "Unknown error"}. Please try submitting again.`
      );
    }

    console.log(
      "[processImage] Turnstile token verified successfully. Proceeding with image generation."
    );

    const keyToCheck = "openai_API_KEY";
    const keyExists = Object.prototype.hasOwnProperty.call(process.env, keyToCheck);
    const keyValue = process.env[keyToCheck];

    console.log(`[processImage] Checking for key: '${keyToCheck}'`);
    console.log(
      `[processImage] Does process.env have own property '${keyToCheck}'? : ${keyExists}`
    );
    console.log(
      `[processImage] Value retrieved for process.env['${keyToCheck}']: ${keyValue === undefined ? "undefined" : keyValue === null ? "null" : keyValue ? "'********'" : "'' (Empty String)"}`
    );

    const openaiApiKey = process.env.openai_API_KEY;
    if (!openaiApiKey) {
      console.error(
        `[processImage] ERROR: Environment variable '${keyToCheck}' not found or is empty in process.env! Throwing error.`
      );
      throw new Error(`OpenAI API Key (${keyToCheck}) is not set in Convex environment variables.`);
    }

    console.log("[processImage] API key found. Initializing OpenAI client...");
    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.log("[processImage] OpenAI client initialized successfully.");

    try {
      const systemPrompt = SYSTEM_PROMPTS[args.style as keyof typeof SYSTEM_PROMPTS];
      const imageGenPrompt = `${systemPrompt} The image should include: ${args.prompt}`;
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imageGenPrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrlFromOpenAI = imageResponse.data[0]?.url;
      if (!imageUrlFromOpenAI) {
        throw new Error("No image generated by OpenAI");
      }

      const fetchedImage = await fetch(imageUrlFromOpenAI);
      const imageBlob = await fetchedImage.blob();
      const storageId = await ctx.storage.store(imageBlob);

      const imageUrl = await ctx.storage.getUrl(storageId);
      if (!imageUrl) {
        throw new Error("Could not get image URL from storage");
      }

      // Call the internalMutation that now resides in gallery.ts or another appropriate file.
      // We need to ensure the api object is correctly generated for this path.
      // Assuming internalSaveProcessedImage remains in gallery.ts and is correctly exported.
      const galleryId: Id<"gallery"> = await ctx.runMutation(
        internal.gallery.internalSaveProcessedImage, // Adjust if internalSaveProcessedImage moves
        {
          storageId,
          style: args.style,
          prompt: args.prompt,
          aiResponse: "Image generated successfully!",
        }
      );

      return {
        storageId,
        galleryId,
        imageUrl,
        aiResponse: "Image generated successfully!",
      };
    } catch (error) {
      console.error("Error processing image:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to process image: ${error.message}`);
      } else {
        throw new Error("Failed to process image due to an unknown error");
      }
    }
  },
});
