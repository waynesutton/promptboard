# Auto-Updating llms.txt with Convex Cron Jobs

This guide outlines the steps to create an `llms.txt` file for your Convex application that:

1.  Is served at the root path (`/llms.txt`).
2.  Can be optionally linked in the `<head>` of your HTML.
3.  Is automatically updated (e.g., daily or weekly) using a Convex Cron Job.
4.  Generates rules dynamically based on content stored in your Convex database (specifically, prompts from a `gallery` table in this example).

**Note on `llms.txt` Standards:** The concept of an `llms.txt` file is evolving. An emerging standard, often associated with `llmstxt.org`, proposes that `/llms.txt` should be a Markdown file providing a structured summary of your website's content, its purpose, and links to key pages to help Large Language Models (LLMs) understand and utilize your site effectively.

This guide primarily demonstrates a complementary approach: using the `/llms.txt` path to serve dynamically generated _crawler directives_ (e.g., `Allow:` and `Disallow:` rules) tailored for LLMs. This method, similar in function to `robots.txt`, leverages your Convex database to define which parts of your application LLMs should or shouldn't access based on your internal data and logic. While the content format differs from the Markdown summary approach, the goal is also to guide LLM interactions with your site, offering fine-grained control.

Later in this guide (see "Alternative" in Step 2), we will also discuss how to adapt this setup to generate a Markdown-based `llms.txt` file, aligning more closely with the `llmstxt.org` content recommendations.

## Overview

We will use the following Convex features:

- **Database:** To store the generated `llms.txt` content and the source data (gallery prompts).
- **Internal Mutation:** To contain the logic for generating the `llms.txt` content based on database data.
- **Cron Job:** To schedule the internal mutation to run periodically.
- **Internal Query:** To retrieve the latest `llms.txt` content from the database.
- **HTTP Endpoint:** To serve the `/llms.txt` file to clients (including LLM crawlers).

## Step 1: Database Schema Setup

We need a place to store the generated `llms.txt` content. A simple approach is to use a general configuration table.

1.  **Edit `convex/schema.ts`:**

    - Add a new table, for example, `siteConfig`.
    - Define fields to store a configuration key (like `"llmsTxtContent"`) and its string value.
    - Add an index on `configKey` for efficient lookup.

    ```typescript
    // convex/schema.ts
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export default defineSchema({
      // --- Your existing tables ---
      gallery: defineTable({
        storageId: v.id("_storage"),
        style: v.string(),
        prompt: v.string(),
        aiResponse: v.optional(v.string()),
        likes: v.number(),
        commentCount: v.optional(v.number()),
        authorName: v.optional(v.string()),
        authorSocialLink: v.optional(v.string()),
        // Add other fields as needed
      }).index("by_creation_time", ["_creationTime"]), // Example index, might be useful

      // ... other tables like users, comments etc. ...

      // --- Add this table ---
      siteConfig: defineTable({
        configKey: v.string(), // e.g., "llmsTxtContent"
        value: v.string(), // Stores the actual llms.txt content
      }).index("by_key", ["configKey"]), // Index for easy lookup
    });
    ```

2.  **Push Schema Changes:** Run `npx convex dev` or `npx convex deploy` to apply the schema changes.

## Step 2: Create the Update Logic (Internal Mutation)

This function will run periodically. It fetches data (e.g., gallery prompts), applies your custom logic to generate `llms.txt` content, and saves the result to the `siteConfig` table.

### Option 1: Generating Directives-Based `llms.txt` (robots.txt style)

This approach focuses on creating `Allow:` and `Disallow:` rules.

1.  **Create/Edit `convex/config.ts` (or a suitable file):**

    - Define an `internalMutation` named `updateLlmRules`.
    - Inside the `handler`:

      - Query the `gallery` table (use `.take()` or filters to manage performance).
      - Implement your logic to generate `Disallow:` or `Allow:` rules based on the prompts. **Crucially, adjust the path generation (e.g., `/image/${item._id}`) to match your site's URL structure for detail pages, if applicable.**
      - Construct the final `llms.txt` content string.
      - Query the `siteConfig` table to find if an entry for `"llmsTxtContent"` exists.
      - Use `ctx.db.patch` to update the existing entry or `ctx.db.insert` to create a new one.

      ```typescript
      // convex/config.ts
      import { internalMutation, internalQuery } from "./_generated/server";
      import { v } from "convex/values";
      import { Doc } from "./_generated/dataModel";

      export const updateLlmRules = internalMutation({
        args: {},
        handler: async (ctx) => {
          console.log("Running scheduled update for llms.txt (directives-based), processing prompts...");

          let llmsTxtContent = `User-agent: *
      ```

    Allow: / # Base allow rule
    Disallow: /admin # Base disallow rule

# Add other base rules here

`;

            try {
              const galleryItems: Doc<"gallery">[] = await ctx.db
                .query("gallery")
                .order("desc")
                .take(500); // Adjust limit as needed

              const disallowedPaths = new Set<string>();

              for (const item of galleryItems) {
                // --- YOUR CUSTOM LOGIC ---
                // Example: Disallow pages for prompts containing "secret"
                if (item.prompt.toLowerCase().includes("secret")) {
                  // IMPORTANT: Adjust this path format to match your app's routes!
                  const path = `/image/${item._id}`;
                  disallowedPaths.add(path);
                }
                // Add more rules based on your criteria
                // --- END CUSTOM LOGIC ---
              }

              if (disallowedPaths.size > 0) {
                llmsTxtContent += "\n# Dynamically disallowed based on prompts:\n";
                for (const path of disallowedPaths) {
                  llmsTxtContent += `Disallow: ${path}\n`;
                }
              } else {
                llmsTxtContent += "\n# No prompts triggered dynamic disallow rules.\n";
              }

            } catch (error) {
              console.error("Error processing gallery prompts for llms.txt:", error);
              llmsTxtContent += "\n# Warning: Error processing dynamic prompt rules\n";
            }

            llmsTxtContent += `\n# Updated: ${new Date().toISOString()}\n`;

            const configKey = "llmsTxtContent";
            const existing = await ctx.db
              .query("siteConfig")
              .withIndex("by_key", (q) => q.eq("configKey", configKey))
              .unique();

            if (existing) {
              await ctx.db.patch(existing._id, { value: llmsTxtContent });
              console.log(`Updated llms.txt content in DB (ID: ${existing._id})`);
            } else {
              await ctx.db.insert("siteConfig", { configKey, value: llmsTxtContent });
              console.log("Inserted initial llms.txt content into DB");
            }
          },
        });
        ```

### Alternative in Step 2: Generating a Markdown-based `llms.txt` (aligning with `llmstxt.org`)

If you wish to align more closely with the `llmstxt.org` standard, which recommends a Markdown file summarizing your site's content, you can adapt the `updateLlmRules` function. Instead of generating `Allow:/Disallow:` lines, it would generate a Markdown document.

1.  **Modify `convex/config.ts` - `updateLlmRules` (or create a new mutation e.g., `updateLlmMarkdown`):**

    The core idea is to build a Markdown string.

    ```typescript
    // convex/config.ts
    // Make sure to import Doc if you haven't already: import { Doc } from "./_generated/dataModel";

    export const updateLlmMarkdown = internalMutation({
      // Renamed for clarity, or adapt existing
      args: {},
      handler: async (ctx) => {
        console.log("Running scheduled update for Markdown llms.txt...");

        // --- Basic Site Info (Customize these) ---
        const siteName = "My Awesome Gallery"; // Replace with your site's name
        const siteBaseUrl = "https://www.example.com"; // Replace with your actual site URL
        const siteSummary =
          "A curated collection of AI-generated images, showcasing various styles and prompts.";
        const mainSections = [
          {
            title: "Homepage",
            url: "/",
            description: "The main landing page with featured content.",
          },
          {
            title: "All Images",
            url: "/gallery",
            description: "Browse all images in the gallery.",
          },
          // Add other important static pages or sections
        ];

        let llmsTxtMarkdown = `# ${siteName} llms.txt\n\n`;
        llmsTxtMarkdown += `> ${siteSummary}\n\n`;
        llmsTxtMarkdown += `This file provides a structured overview to help Large Language Models understand and interact with the ${siteName} website. All URLs are relative to ${siteBaseUrl} unless specified otherwise.\n\n`;

        llmsTxtMarkdown += `## Main Site Sections\n`;
        for (const section of mainSections) {
          llmsTxtMarkdown += `- [${section.title}](${siteBaseUrl}${section.url}): ${section.description}\n`;
        }
        llmsTxtMarkdown += `\n`;

        // --- Dynamic Content from Database (e.g., Gallery Items) ---
        try {
          const galleryItems: Doc<"gallery">[] = await ctx.db
            .query("gallery")
            // .filter(q => q.eq(q.field("isPublic"), true)) // Example: Only include public items
            .order("desc") // Or by relevance, popularity etc.
            .take(100); // Adjust limit; consider pagination or a "latest" section

          if (galleryItems.length > 0) {
            llmsTxtMarkdown += `## Recent Gallery Additions\n`;
            for (const item of galleryItems) {
              // IMPORTANT: Adjust this path format to match your app's routes for image detail pages!
              const itemPath = `/image/${item._id}`; // Assuming this is your URL structure
              const itemTitle =
                item.prompt.substring(0, 50) + (item.prompt.length > 50 ? "..." : ""); // Or a dedicated title field
              const itemDescription = `AI-generated image based on the prompt: "${item.prompt.substring(0, 100)}..." Style: ${item.style}.`; // Customize as needed

              llmsTxtMarkdown += `- [Image: ${itemTitle}](${siteBaseUrl}${itemPath}): ${itemDescription}\n`;
            }
          } else {
            llmsTxtMarkdown += "\n# No recent gallery items to list at this time.\n";
          }
        } catch (error) {
          console.error("Error processing gallery prompts for Markdown llms.txt:", error);
          llmsTxtMarkdown += "\n# Warning: Error processing dynamic gallery content.\n";
        }

        llmsTxtMarkdown += `\n# File updated: ${new Date().toISOString()}\n`;

        // --- Storing the content (this logic remains the same) ---
        const configKey = "llmsTxtMarkdownContent"; // Use a new key or reuse "llmsTxtContent"
        const existing = await ctx.db
          .query("siteConfig")
          .withIndex("by_key", (q) => q.eq("configKey", configKey))
          .unique();

        if (existing) {
          await ctx.db.patch(existing._id, { value: llmsTxtMarkdown });
          console.log(`Updated Markdown llms.txt content in DB (ID: ${existing._id})`);
        } else {
          await ctx.db.insert("siteConfig", { configKey, value: llmsTxtMarkdown });
          console.log("Inserted initial Markdown llms.txt content into DB");
        }
      },
    });
    ```

    **Further Considerations for Markdown Generation:**

    - **Content Selection:** Strategically decide what content is most valuable for an LLM to understand your site (key pages, categories, recent/popular items).
    - **URL Structure:** Ensure generated URLs are correct and absolute (or clearly relative to your `siteBaseUrl`).
    - **Descriptions:** Write concise, informative descriptions.
    - **`llms-full.txt`:** The `llmstxt.org` standard also mentions `llms-full.txt` for more exhaustive content. You could generate this as a separate entry in `siteConfig`.
    - **Path Generation:** Ensure `itemPath` accurately reflects your website's URL structure for individual items.

## Step 3: Create Query to Fetch Rules

This simple query is used by the HTTP endpoint to get the latest rules (or Markdown content) stored in the database.

1.  **Add to `convex/config.ts`:**

    ```typescript
    // convex/config.ts (continued)
    // Ensure internalQuery is imported: import { internalQuery } from "./_generated/server";

    export const getLlmContent = internalQuery({
      // Renamed for generality
      args: {
        // Optional: Add an arg to specify if you want directives or markdown if you store both
        // contentType: v.optional(v.union(v.literal("directives"), v.literal("markdown")))
      },
      handler: async (ctx, args): Promise<string> => {
        // If you use different configKeys for directives vs markdown:
        // const configKeyToUse = args.contentType === "markdown" ? "llmsTxtMarkdownContent" : "llmsTxtContent";
        const configKeyToUse = "llmsTxtContent"; // Or "llmsTxtMarkdownContent" if you switched

        const config = await ctx.db
          .query("siteConfig")
          .withIndex("by_key", (q) => q.eq("configKey", configKeyToUse))
          .unique();

        // Default content if nothing is configured yet
        // For directives-based:
        // return config?.value ?? "# llms.txt not configured\nUser-agent: *\nAllow: /";
        // For Markdown-based:
        return (
          config?.value ??
          `# llms.txt not fully configured\n\n> Please check back later.\n\nUser-agent: *\nAllow: /`
        ); // Basic fallback
      },
    });
    ```

    _Note: If you decide to support both directives and Markdown simultaneously (perhaps serving them at different paths or based on a query param), you'd adjust the `configKey` used here and potentially the arguments to `getLlmContent`._

## Step 4: Schedule the Cron Job

Tell Convex when to run your update mutation (`updateLlmRules` or `updateLlmMarkdown`).

1.  **Create/Edit `convex/crons.ts`:**

    - Import `cronJobs` from `convex/server` and `internal` from `./_generated/api`.
    - Instantiate `cronJobs()`.
    - Use `crons.cron()` or `crons.interval()` to schedule `internal.config.updateLlmRules` (or `internal.config.updateLlmMarkdown` if you created a new one).
    - Export the `crons` object as default.

    ```typescript
    // convex/crons.ts
    import { cronJobs } from "convex/server";
    import { internal } from "./_generated/api";

    const crons = cronJobs();

    // Example: Run daily at 03:00 UTC
    // Make sure to use the correct mutation reference here:
    // internal.config.updateLlmRules for directives-based
    // internal.config.updateLlmMarkdown for Markdown-based (if you created a new function)
    crons.cron(
      "update_llms_txt_content_daily", // Unique identifier
      "0 3 * * *", // Cron syntax: At 03:00 every day
      internal.config.updateLlmRules, // Or internal.config.updateLlmMarkdown
      {} // Arguments (none needed here)
    );

    export default crons;
    ```

## Step 5: Create the HTTP Endpoint

This makes the `llms.txt` content accessible via a URL (`/llms.txt`).

1.  **Create/Edit `convex/http.ts`:**

    - Import `httpRouter` from `convex/server`, `httpAction` from `./_generated/server`, and `internal` from `./_generated/api`.
    - Instantiate `httpRouter()`.
    - Define a route for `path: "/llms.txt"` and `method: "GET"`.
    - The `handler` should be an `httpAction` that:
      - Calls `ctx.runQuery(internal.config.getLlmContent, {})` to fetch the content.
      - Returns a `new Response()` with the fetched content, status 200, and `Content-Type: text/plain; charset=utf-8`. (This content type is appropriate for both `robots.txt`-style directives and Markdown, as Markdown is a plain text format).
    - Export the `http` router as default.

    ```typescript
    // convex/http.ts
    import { httpRouter } from "convex/server";
    import { httpAction } from "./_generated/server";
    import { internal } from "./_generated/api";

    const http = httpRouter();

    http.route({
      path: "/llms.txt",
      method: "GET",
      handler: httpAction(async (ctx, request) => {
        // Ensure you call the correct query function, e.g., getLlmContent
        const llmsContent = await ctx.runQuery(internal.config.getLlmContent, {});

        return new Response(llmsContent, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }),
    });

    // Add other HTTP routes if needed

    export default http;
    ```

## Step 6: Link in HTML `<head>` (Optional)

While crawlers find `/llms.txt` automatically at the root, you can add a `<link>` tag for potential other uses or explicit reference.

1.  **Edit your main HTML file (e.g., `index.html`):**

    - Add the following line within the `<head>` section.

    ```html
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your App Title</title>
      <!-- Other meta tags, links -->

      <!-- Add this line -->
      <link rel="llms" href="/llms.txt" type="text/plain" />
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
    ```

## Deployment

After implementing these steps, deploy your changes using `npx convex deploy`.

- The HTTP endpoint `/llms.txt` will immediately start serving the content (initially the default string from `getLlmContent` if the config isn't in the DB yet).
- The cron job will run for the first time according to its schedule _after_ the deployment completes. You can monitor its execution in the Convex dashboard logs.
- Consider running the `updateLlmRules` mutation manually once from the dashboard's "Functions" tab after deployment to populate the initial `llms.txt` content in the database immediately, rather than waiting for the first scheduled run.

```

```
