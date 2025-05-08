import { httpRouter } from "convex/server";

const http = httpRouter();

// auth.addHttpRoutes(http); // Removed as @convex-dev/auth is no longer used

// If you have other custom HTTP routes that need authentication,
// you would protect them like this:
// http.route({
//   path: "/myProtectedEndpoint",
//   method: "GET",
//   handler: httpAction(async (ctx, request) => {
//     const identity = await ctx.auth.getUserIdentity();
//     if (!identity) {
//       return new Response("Unauthorized", { status: 401 });
//     }
//     // ... your logic for authenticated users ...
//     return new Response("Authenticated content");
//   }),
// });

export default http;
