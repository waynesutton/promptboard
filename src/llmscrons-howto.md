# Auto-Updating llms.txt with Convex Cron Jobs

This guide outlines the steps to create an `llms.txt` file for your Convex application that:

1.  Is served at the root path (`/llms.txt`).
2.  Can be optionally linked in the `<head>` of your HTML.
3.  Is automatically updated (e.g., daily or weekly) using a Convex Cron Job.
4.  Generates rules dynamically based on content stored in your Convex database (specifically, prompts from a `gallery` table in this example).

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

This function will run periodically. It fetches data (gallery prompts), applies your custom logic to generate `llms.txt` rules, and saves the result to the `siteConfig` table.

1.  **Create/Edit `convex/config.ts` (or a suitable file):**
    _ Define an `internalMutation` named `updateLlmRules`.
    _ Inside the `handler`:
    _ Query the `gallery` table (use `.take()` or filters to manage performance).
    _ Implement your logic to generate `Disallow:` or `Allow:` rules based on the prompts. **Crucially, adjust the path generation (e.g., `/image/${item._id}`) to match your site's URL structure for detail pages, if applicable.**
    _ Construct the final `llms.txt` content string.
    _ Query the `siteConfig` table to find if an entry for `"llmsTxtContent"` exists. \* Use `ctx.db.patch` to update the existing entry or `ctx.db.insert` to create a new one.

        ```typescript
        // convex/config.ts
        import { internalMutation, internalQuery } from "./_generated/server";
        import { v } from "convex/values";
        import { Doc } from "./_generated/dataModel";

        export const updateLlmRules = internalMutation({
          args: {},
          handler: async (ctx) => {
            console.log("Running scheduled update for llms.txt, processing prompts...");

            let llmsTxtContent = `User-agent: *

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

## Step 3: Create Query to Fetch Rules

This simple query is used by the HTTP endpoint to get the latest rules stored in the database.

1.  **Add to `convex/config.ts`:**

    ```typescript
    // convex/config.ts (continued)

    export const getLlmRules = internalQuery({
      args: {},
      handler: async (ctx): Promise<string> => {
        const config = await ctx.db
          .query("siteConfig")
          .withIndex("by_key", (q) => q.eq("configKey", "llmsTxtContent"))
          .unique();

        return config?.value ?? "# llms.txt not configured\nUser-agent: *\nAllow: /";
      },
    });
    ```

## Step 4: Schedule the Cron Job

Tell Convex when to run the `updateLlmRules` mutation.

1.  **Create/Edit `convex/crons.ts`:**

    - Import `cronJobs` from `convex/server` and `internal` from `./_generated/api`.
    - Instantiate `cronJobs()`.
    - Use `crons.cron()` (with standard cron syntax) or `crons.interval()` to schedule `internal.config.updateLlmRules`.
    - Export the `crons` object as default.

    ```typescript
    // convex/crons.ts
    import { cronJobs } from "convex/server";
    import { internal } from "./_generated/api";

    const crons = cronJobs();

    // Example: Run daily at 03:00 UTC
    crons.cron(
      "update_llms_txt_rules_daily", // Unique identifier
      "0 3 * * *", // Cron syntax: At 03:00 every day
      internal.config.updateLlmRules, // The mutation to run
      {} // Arguments (none needed here)
    );

    // Example: Run weekly on Sunday at 05:00 UTC
    // crons.cron(
    //   "update_llms_txt_rules_weekly",
    //   "0 5 * * 0", // Cron syntax: At 05:00 on Sunday
    //   internal.config.updateLlmRules,
    //   {}
    // );

    export default crons;
    ```

## Step 5: Create the HTTP Endpoint

This makes the `llms.txt` content accessible via a URL (`/llms.txt`).

1.  **Create/Edit `convex/http.ts`:**

    - Import `httpRouter` from `convex/server`, `httpAction` from `./_generated/server`, and `internal` from `./_generated/api`.
    - Instantiate `httpRouter()`.
    - Define a route for `path: "/llms.txt"` and `method: "GET"`.
    - The `handler` should be an `httpAction` that:
      - Calls `ctx.runQuery(internal.config.getLlmRules, {})` to fetch the content.
      - Returns a `new Response()` with the fetched content, status 200, and `Content-Type: text/plain; charset=utf-8`.
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
        const llmsTxtContent = await ctx.runQuery(internal.config.getLlmRules, {});

        return new Response(llmsTxtContent, {
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

- The HTTP endpoint `/llms.txt` will immediately start serving the content (initially the default string from `getLlmRules` if the config isn't in the DB yet).
- The cron job will run for the first time according to its schedule _after_ the deployment completes. You can monitor its execution in the Convex dashboard logs.
- Consider running the `updateLlmRules` mutation manually once from the dashboard's "Functions" tab after deployment to populate the initial `llms.txt` content in the database immediately, rather than waiting for the first scheduled run.

```

```
