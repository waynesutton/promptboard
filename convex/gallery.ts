import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
  internalAction, // Added internalAction import if processImage uses it
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import { internal } from "./_generated/api"; // Import internal API
import { paginationOptsValidator } from "convex/server"; // Import pagination validator

// System prompts for different styles
export const SYSTEM_PROMPTS = {
  "Studio Laika": "A stop-motion-inspired image in the style of Studio Laika (Coraline, Kubo).",
  "3dsoft": "A Pixar-style 3D animated image.",
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
};

// Process image using openai
export const processImage = action({
  args: {
    prompt: v.string(),
    style: v.string(),
  },
  returns: v.object({
    storageId: v.id("_storage"),
    galleryId: v.id("gallery"),
    imageUrl: v.string(),
    aiResponse: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.openai_API_KEY,
      });

      const systemPrompt = SYSTEM_PROMPTS[args.style as keyof typeof SYSTEM_PROMPTS];
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${systemPrompt} The image should include: ${args.prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      });

      const imageUrlFromopenai = response.data[0]?.url;
      if (!imageUrlFromopenai) {
        throw new Error("No image generated by openai");
      }

      // Upload the generated image to Convex storage
      const imageResponse = await fetch(imageUrlFromopenai);
      const imageBlob = await imageResponse.blob();
      const storageId = await ctx.storage.store(imageBlob);

      // Get the URL for the stored image
      const imageUrl = await ctx.storage.getUrl(storageId);
      if (!imageUrl) {
        throw new Error("Could not get image URL from storage");
      }

      // Save the image details to the gallery table via an internal mutation
      const galleryId: Id<"gallery"> = await ctx.runMutation(
        internal.gallery.internalSaveProcessedImage,
        {
          storageId,
          style: args.style,
          prompt: args.prompt,
          aiResponse: "Image generated successfully!", // Or use revised_prompt if available
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
      // Propagate a more specific error or handle it as needed
      if (error instanceof Error) {
        throw new Error(`Failed to process image: ${error.message}`);
      } else {
        throw new Error("Failed to process image due to an unknown error");
      }
    }
  },
});

// Internal mutation to save processed image details to the gallery
export const internalSaveProcessedImage = internalMutation({
  args: {
    storageId: v.id("_storage"),
    style: v.string(),
    prompt: v.string(),
    aiResponse: v.optional(v.string()),
  },
  returns: v.id("gallery"),
  handler: async (ctx, args): Promise<Id<"gallery">> => {
    return await ctx.db.insert("gallery", {
      storageId: args.storageId,
      style: args.style,
      prompt: args.prompt,
      aiResponse: args.aiResponse ?? "",
      likes: 0,
      commentCount: 0,
      clicks: 0, // Initialize clicks to 0
    });
  },
});

// List gallery images with pagination
export const listGallery = query({
  args: { paginationOpts: paginationOptsValidator }, // Revert: Keep paginationOpts required
  handler: async (ctx, args) => {
    // Return paginated results
    const images = await ctx.db.query("gallery").order("desc").paginate(args.paginationOpts); // Use paginate()
    return images;
    // No need to fetch URLs here anymore
  },
});

// Get gallery count
export const getGalleryCount = query({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db.query("gallery").collect();
    return count.length;
  },
});

// Get image from storage
export const getImage = query({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const imageUrl = await ctx.storage.getUrl(args.imageId);
    return { imageUrl };
  },
});

// Get comments for an image
export const getComments = query({
  args: { galleryId: v.id("gallery") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
      .collect();
  },
});

// Add a comment
export const addComment = mutation({
  args: {
    galleryId: v.id("gallery"),
    userName: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch the gallery item to increment comment count
    const galleryItem = await ctx.db.get(args.galleryId);
    if (!galleryItem) {
      throw new Error("Gallery item not found to add comment");
    }
    // Increment comment count
    await ctx.db.patch(args.galleryId, {
      commentCount: (galleryItem.commentCount || 0) + 1,
    });
    // Insert the comment
    return await ctx.db.insert("comments", {
      galleryId: args.galleryId,
      userName: args.userName,
      text: args.text,
    });
  },
});

// Add a like
export const addLike = mutation({
  args: { galleryId: v.id("gallery") },
  handler: async (ctx, args) => {
    const gallery = await ctx.db.get(args.galleryId);
    if (!gallery) throw new Error("Gallery not found");

    return await ctx.db.patch(args.galleryId, {
      likes: (gallery.likes || 0) + 1,
    });
  },
});

/**
 * Increment the click count for a specific image.
 */
export const incrementImageClicks = mutation({
  args: {
    imageId: v.id("gallery"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      console.error(`Image not found: ${args.imageId}`);
      // Consider throwing an error for better client feedback
      // throw new Error(`Image not found: ${args.imageId}`);
      return; // Return early if image doesn't exist
    }
    // Use patch to update the clicks field, ensuring atomicity
    // Initialize clicks to 0 if it's null/undefined before incrementing
    await ctx.db.patch(args.imageId, { clicks: (image.clicks ?? 0) + 1 });
  },
});

// --- Dashboard Queries ---

// Get last 20 prompts
export const getLast20Prompts = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("gallery")
      .order("desc") // Order by _creationTime descending (default index)
      .take(20);
    // Map to include clicks
    return prompts.map((p) => ({
      ...p, // Spread existing fields
      clicks: p.clicks ?? 0, // Ensure clicks is returned, default to 0 if null/undefined
    }));
  },
});

// Get last 20 styles used
export const getLast20Styles = query({
  args: {},
  handler: async (ctx) => {
    const styles = await ctx.db
      .query("gallery")
      .order("desc") // Order by _creationTime descending
      .take(20);
    // Map to include clicks
    return styles.map((s) => ({
      ...s,
      clicks: s.clicks ?? 0,
    }));
  },
});

// Get all prompts (Limited to 100 for performance, consider pagination later)
export const getAllPrompts = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("gallery")
      .order("desc") // Order by _creationTime descending
      .take(100); // Limit for performance
    // Map to include clicks
    return prompts.map((p) => ({
      ...p,
      clicks: p.clicks ?? 0,
    }));
  },
});

// Get 20 most liked images
export const getMostLikedImages = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db
      .query("gallery")
      .withIndex("by_likes", (q) => q) // Use the likes index
      .order("desc") // Order by likes descending
      .take(20);
    // Map to include clicks
    return images.map((img) => ({
      ...img,
      clicks: img.clicks ?? 0,
    }));
  },
});

// Get 20 most commented images
export const getMostCommentedImages = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db
      .query("gallery")
      // Make sure index name matches schema: by_comment_count
      .withIndex("by_comment_count", (q) => q)
      .order("desc") // Order by commentCount descending
      .take(20);
    // Map to include clicks
    return images.map((img) => ({
      ...img,
      clicks: img.clicks ?? 0,
    }));
  },
});
