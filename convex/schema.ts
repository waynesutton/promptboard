import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  gallery: defineTable({
    storageId: v.id("_storage"),
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
