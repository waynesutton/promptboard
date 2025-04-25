import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Define the expected dimension for OpenAI's text-embedding-ada-002 model
const OPENAI_EMBEDDING_DIMENSION = 1536;

export default defineSchema({
  ...authTables,
  gallery: defineTable({
    storageId: v.id("_storage"),
    style: v.string(),
    prompt: v.string(),
    embedding: v.optional(v.array(v.float64())),
    aiResponse: v.optional(v.string()),
    likes: v.number(),
    commentCount: v.optional(v.number()),
    clicks: v.optional(v.number()),
    authorName: v.optional(v.string()),
    authorSocialLink: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
  })
    .index("by_creationTime_desc", ["prompt"])
    .index("by_likes", ["likes"])
    .index("by_comment_count", ["commentCount"])
    .searchIndex("search_all", {
      searchField: "prompt",
      filterFields: ["authorName"],
    }),
  comments: defineTable({
    galleryId: v.id("gallery"),
    userName: v.string(),
    text: v.string(),
  })
    .index("by_gallery", ["galleryId"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["galleryId"],
    }),
  siteConfig: defineTable({
    configKey: v.string(),
    value: v.string(),
  }).index("by_key", ["configKey"]),
});
