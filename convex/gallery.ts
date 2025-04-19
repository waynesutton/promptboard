import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

// System prompts for different styles
export const SYSTEM_PROMPTS = {
  "Studio Laika": "A stop-motion-inspired image in the style of Studio Laika (Coraline, Kubo).",
  "3dsoft": "A Pixar-style 3D animated image.",
  "Ghibli": "A Studio Ghibli-style watercolor image.",
  "80s Anime": "A 1980s anime style image.",
  "T206 Vintage": "A vintage T206 image style.",
  "futuristic": "A futuristic image with a dark, moody neon aesthetic and soft sci-fi lighting, holographic materials, glowing edges, and subtle motion-blur reflections.",
  "b&w": "A high-contrast black and white image with dramatic shadows and a timeless, cinematic style."
};

// Process image using OpenAI
export const processImage = action({
  args: {
    prompt: v.string(),
    style: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
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

      if (!response.data[0]?.url) {
        throw new Error("No image generated");
      }

      // Upload the generated image to Convex storage
      const imageResponse = await fetch(response.data[0].url);
      const imageBlob = await imageResponse.blob();
      const storageId = await ctx.storage.store(imageBlob);

      return {
        storageId,
        aiResponse: "Image generated successfully!"
      };
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error("Failed to process image");
    }
  },
});

// Save processed image to gallery
export const saveProcessedImage = mutation({
  args: {
    storageId: v.id("_storage"),
    style: v.string(),
    prompt: v.string(),
    aiResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gallery", {
      storageId: args.storageId,
      style: args.style,
      prompt: args.prompt,
      aiResponse: args.aiResponse ?? "",
      likes: 0,
    });
  },
});

// List gallery images
export const listGallery = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.query("gallery").order("desc").collect();
    return Promise.all(
      images.map(async (img) => ({
        ...img,
        imageUrl: await ctx.storage.getUrl(img.storageId),
      }))
    );
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
    return await ctx.db.insert("comments", args);
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
