import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

// System prompts for different styles start
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

// System prompts for different styles end

// --- processImage: Initialize client inside handler ---
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
    // --- Initialize OpenAI client inside the handler ---
    console.log("[processImage] Handler started. Checking for environment variable..."); // Log start

    // --- Add VERY EXPLICIT LOGGING ---
    const keyToCheck = "openai_API_KEY";
    const keyExists = Object.prototype.hasOwnProperty.call(process.env, keyToCheck);
    const keyValue = process.env[keyToCheck];

    console.log(`[processImage] Checking for key: '${keyToCheck}'`);
    console.log(
      `[processImage] Does process.env have own property '${keyToCheck}'? : ${keyExists}`
    );
    console.log(
      `[processImage] Value retrieved for process.env['${keyToCheck}']: ${keyValue === undefined ? "undefined" : keyValue === null ? "null" : keyValue ? "'********'" : "'' (Empty String)"}`
    ); // Mask value if present
    // --- END EXPLICIT LOGGING ---

    const openaiApiKey = process.env.openai_API_KEY; // Use the exact name expected
    if (!openaiApiKey) {
      // Throw specific error if key is missing in environment
      console.error(
        `[processImage] ERROR: Environment variable '${keyToCheck}' not found or is empty in process.env! Throwing error.`
      ); // Log error before throw
      throw new Error(`OpenAI API Key (${keyToCheck}) is not set in Convex environment variables.`);
    }

    console.log("[processImage] API key found. Initializing OpenAI client..."); // Log success before init
    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.log("[processImage] OpenAI client initialized successfully.");
    // --- End client initialization ---

    try {
      // --- Generate Image ---
      const systemPrompt = SYSTEM_PROMPTS[args.style as keyof typeof SYSTEM_PROMPTS];
      const imageGenPrompt = `${systemPrompt} The image should include: ${args.prompt}`;
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        //model: "gpt-image-1",
        prompt: imageGenPrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrlFromOpenAI = imageResponse.data[0]?.url;
      if (!imageUrlFromOpenAI) {
        throw new Error("No image generated by OpenAI");
      }

      // --- Store Image ---
      const fetchedImage = await fetch(imageUrlFromOpenAI);
      const imageBlob = await fetchedImage.blob();
      const storageId = await ctx.storage.store(imageBlob);

      // --- Get Image URL ---
      const imageUrl = await ctx.storage.getUrl(storageId);
      if (!imageUrl) {
        throw new Error("Could not get image URL from storage");
      }

      // --- Save to DB (WITHOUT embedding) ---
      const galleryId: Id<"gallery"> = await ctx.runMutation(
        internal.gallery.internalSaveProcessedImage,
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
      clicks: 0,
    });
  },
});

// List gallery images with pagination
export const listGallery = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("gallery")
      .filter((q) => q.neq(q.field("isHidden"), true)) // Filter out hidden images
      .order("desc")
      .paginate(args.paginationOpts);
    return images;
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

// Add Author Info mutation
export const addAuthorInfo = mutation({
  args: {
    galleryId: v.id("gallery"),
    authorName: v.string(),
    authorSocialLink: v.optional(v.string()), // Social link is optional
    authorEmail: v.optional(v.string()), // Add optional email argument
  },
  handler: async (ctx, args) => {
    // Ensure gallery item exists
    const galleryItem = await ctx.db.get(args.galleryId);
    if (!galleryItem) {
      throw new Error("Gallery item not found to add author info");
    }

    // Optional: Could add a check here to prevent overwriting if needed,
    // but the current frontend logic prevents showing the form if data exists.

    await ctx.db.patch(args.galleryId, {
      authorName: args.authorName,
      // Ensure undefined is stored if the link is empty/null, not an empty string if desired
      authorSocialLink: args.authorSocialLink || undefined,
      authorEmail: args.authorEmail || undefined, // Save email or undefined
    });
    // Optionally return something, like success: true
  },
});

// --- Dashboard Queries ---

// Get last 100 prompts
export const getLast20Prompts = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("gallery")
      .filter((q) => q.neq(q.field("isHidden"), true)) // Filter out hidden images
      .order("desc")
      .take(100);
    return prompts.map((p) => ({ ...p, clicks: p.clicks ?? 0 }));
  },
});

// Get last 100 styles used
export const getLast20Styles = query({
  args: {},
  handler: async (ctx) => {
    const styles = await ctx.db
      .query("gallery")
      .filter((q) => q.neq(q.field("isHidden"), true)) // Filter out hidden images
      .order("desc")
      .take(100);
    return styles.map((s) => ({ ...s, clicks: s.clicks ?? 0 }));
  },
});

// Get all prompts (Limited to 100 for performance, consider pagination later)
export const getAllPrompts = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("gallery")
      .filter((q) => q.neq(q.field("isHidden"), true)) // Filter out hidden images
      .order("desc")
      .take(100);
    return prompts.map((p) => ({ ...p, clicks: p.clicks ?? 0 }));
  },
});

// Get 100 most liked images
export const getMostLikedImages = query({
  args: {},
  handler: async (ctx) => {
    // To filter by isHidden and use the by_likes index efficiently,
    // we might need a composite index if performance is critical,
    // or accept that filtering happens after index retrieval for now.
    const images = await ctx.db
      .query("gallery")
      .withIndex("by_likes") // Use the likes index
      // .filter((q) => q.neq(q.field("isHidden"), true)) // This filter runs post-index scan
      .order("desc")
      .take(200); // Take more to allow for filtering, then slice

    const visibleImages = images.filter((img) => img.isHidden !== true).slice(0, 100);

    return visibleImages.map((img) => ({ ...img, clicks: img.clicks ?? 0 }));
  },
});

// Get 100 most commented images
export const getMostCommentedImages = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db
      .query("gallery")
      .withIndex("by_comment_count")
      // .filter((q) => q.neq(q.field("isHidden"), true)) // This filter runs post-index scan
      .order("desc")
      .take(200); // Take more to allow for filtering, then slice

    const visibleImages = images.filter((img) => img.isHidden !== true).slice(0, 100);

    return visibleImages.map((img) => ({ ...img, clicks: img.clicks ?? 0 }));
  },
});

// --- NEW: Full-Text Search Query ---
export const searchCombined = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args): Promise<Doc<"gallery">[]> => {
    const cleanedQuery = args.searchQuery.trim();
    if (!cleanedQuery) {
      return [];
    }

    // 1. Search gallery table (prompt and authorName)
    const galleryResults = await ctx.db
      .query("gallery")
      .withSearchIndex(
        "search_all",
        (q) =>
          // Search both prompt and authorName fields if authorName is included in searchField
          // Or just search prompt if authorName is only a filterField
          q.search("prompt", cleanedQuery)
        // Potential improvement: Combine with authorName search if desired
        // q.search("prompt", cleanedQuery).eq("authorName", cleanedQuery) // Example if also filtering
      )
      .take(20); // Limit initial gallery results

    // 2. Search comments table (text)
    const commentResults = await ctx.db
      .query("comments")
      .withSearchIndex("search_text", (q) => q.search("text", cleanedQuery))
      .collect(); // Collect all comment matches initially

    // 3. Get unique gallery IDs from both searches
    const galleryIdsFromPrompts = new Set(galleryResults.map((doc) => doc._id));
    const galleryIdsFromComments = new Set(commentResults.map((doc) => doc.galleryId));

    const allMatchingGalleryIds = new Set([...galleryIdsFromPrompts, ...galleryIdsFromComments]);

    if (allMatchingGalleryIds.size === 0) {
      return [];
    }

    // 4. Fetch the full gallery documents for the unique IDs
    // Use Promise.all for potentially better performance fetching multiple documents
    const galleryDocs = await Promise.all(
      Array.from(allMatchingGalleryIds).map((id) => ctx.db.get(id))
    );

    // Filter out nulls (if any gallery item was deleted) and return
    return galleryDocs.filter((doc): doc is Doc<"gallery"> => doc !== null);
  },
});

// --- MODERATION ACTIONS (NEW) ---

// Helper to check for authenticated user (admin/moderator)
const ensureAuthenticated = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated to perform this action.");
  }
  // You might want to check identity.subject for specific user IDs
  // or query a 'moderators' table if you have role-based access.
  // For now, any authenticated user can perform these actions.
  return identity;
};

export const deleteImage = mutation({
  args: { galleryId: v.id("gallery") },
  handler: async (ctx, args) => {
    await ensureAuthenticated(ctx);

    const image = await ctx.db.get(args.galleryId);
    if (!image) {
      throw new Error("Image not found");
    }

    // Delete the file from storage
    await ctx.storage.delete(image.storageId);

    // Delete comments associated with the image
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
      .collect();
    await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)));

    // Delete the gallery document
    await ctx.db.delete(args.galleryId);
    return { success: true };
  },
});

export const toggleHideImage = mutation({
  args: { galleryId: v.id("gallery") },
  handler: async (ctx, args) => {
    await ensureAuthenticated(ctx);
    const image = await ctx.db.get(args.galleryId);
    if (!image) {
      throw new Error("Image not found");
    }
    await ctx.db.patch(args.galleryId, { isHidden: !image.isHidden });
    return { success: true, isHidden: !image.isHidden };
  },
});

export const toggleHighlightImage = mutation({
  args: { galleryId: v.id("gallery") },
  handler: async (ctx, args) => {
    await ensureAuthenticated(ctx);
    const image = await ctx.db.get(args.galleryId);
    if (!image) {
      throw new Error("Image not found");
    }
    await ctx.db.patch(args.galleryId, { isHighlighted: !image.isHighlighted });
    return { success: true, isHighlighted: !image.isHighlighted };
  },
});

// --- END MODERATION ACTIONS ---

// --- NEW: Public Full-Text Search Query (filters hidden items) ---
export const publicSearchCombined = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args): Promise<Doc<"gallery">[]> => {
    const cleanedQuery = args.searchQuery.trim();
    if (!cleanedQuery) {
      return [];
    }

    // 1. Search gallery table (prompt and authorName), filtering hidden
    const galleryResults = await ctx.db
      .query("gallery")
      .filter((q) => q.neq(q.field("isHidden"), true)) // Filter hidden
      .withSearchIndex("search_all", (q) => q.search("prompt", cleanedQuery))
      .take(20);

    // 2. Search comments table (text)
    const commentResults = await ctx.db
      .query("comments")
      // We need to get galleryIds from comments, then filter those gallery items by isHidden
      .withSearchIndex("search_text", (q) => q.search("text", cleanedQuery))
      .collect();

    // Get gallery docs for comments and filter them
    const galleryIdsFromCommentsUnfiltered = new Set(commentResults.map((doc) => doc.galleryId));
    const galleryDocsFromComments = await Promise.all(
      Array.from(galleryIdsFromCommentsUnfiltered).map((id) => ctx.db.get(id))
    );
    const galleryIdsFromComments = new Set(
      galleryDocsFromComments.filter((doc) => doc && doc.isHidden !== true).map((doc) => doc!._id)
    );

    const galleryIdsFromPrompts = new Set(galleryResults.map((doc) => doc._id));

    const allMatchingGalleryIds = new Set([...galleryIdsFromPrompts, ...galleryIdsFromComments]);

    if (allMatchingGalleryIds.size === 0) {
      return [];
    }

    // Fetch the full gallery documents for the unique IDs
    // These should already be filtered for isHidden where applicable
    const finalGalleryDocs = await Promise.all(
      Array.from(allMatchingGalleryIds).map((id) => ctx.db.get(id))
    );

    return finalGalleryDocs.filter(
      (doc): doc is Doc<"gallery"> => doc !== null && doc.isHidden !== true
    );
  },
});
