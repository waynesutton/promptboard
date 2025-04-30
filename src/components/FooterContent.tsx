import React from "react";
import { Id } from "../../convex/_generated/dataModel"; // Corrected Import Id type

// Define props for the component
interface FooterContentProps {
  hideDashboardLink?: boolean; // Optional prop to hide the dashboard link
  showReportLink?: boolean; // Optional prop to show the report link
  galleryId?: Id<"gallery">; // Optional gallery ID
  prompt?: string; // Optional prompt text
  style?: string; // Optional style text
}

// Reusable Footer Content Component
export function FooterContent({
  hideDashboardLink = false,
  showReportLink = false,
  galleryId,
  prompt,
  style,
}: FooterContentProps) {
  // Construct the GitHub issue URL dynamically
  const reportLink =
    showReportLink && galleryId
      ? (() => {
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
          const imagePageLink = `${baseUrl}/?imageId=${galleryId}`;
          const title = encodeURIComponent("Reporting 1 million prompts");
          const body = encodeURIComponent(
            `**Image Link:** ${imagePageLink}\n\n` +
              `**Gallery ID:** ${galleryId}\n` +
              `**Prompt:** ${prompt || "N/A"}\n` +
              `**Style:** ${style || "N/A"}\n\n` +
              `**Reason for reporting:** (Please fill this in)`
          );
          const labels = encodeURIComponent("flagged");
          return `https://github.com/waynesutton/promptboard/issues/new?title=${title}&body=${body}&labels=${labels}`;
        })()
      : "#"; // Default href if not showing link or no galleryId

  return (
    <div className="text-center py-4 mt-5">
      <div className="text-sm text-[#6B7280] mb-2">
        Cooked on
        <a
          href="https://convex.link/1millchefs"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 hover:underline">
          Convex Chef
        </a>{" "}
        with a splash of
        <a
          href="https://openai.com/?utm_source=convexchef1millionprompts"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 hover:underline">
          OpenAI
        </a>{" "}
      </div>
      <div className="flex items-center text-[#6B7280] justify-center gap-2">
        {/* Use static path for Convex logo */}
        Powered by{" "}
        <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
          <img src="/convex-black.svg" alt="Convex Logo" className="h-3" />
        </a>
        {/* Use static path for Chef logo 
        <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
          <img src="/chef.svg" alt="Chef Logo" className="h-6" />
        </a>*/}
      </div>

      {showReportLink &&
        galleryId && ( // Conditionally render the report link only if galleryId exists
          <>
            {/* report link for modal only starts here */}

            {/* Add divider and margin-top */}
            <hr className="border-gray-100 my-4" />

            <a
              href={reportLink} // Use the dynamically generated link
              target="_blank"
              rel="noopener noreferrer" // Added rel for security
              className="text-sm text-gray-500 hover:underline mt-2 block">
              Report Image
            </a>

            {/* report link for modal only ends here */}
          </>
        )}
      {/* remove dashboard link back here as it's part of the standard footerand I don't want it in the modal it's in the footer and not in the modal */}
      {!hideDashboardLink && ( // Conditionally render the dashboard link
        <div className="text-center text-sm text-gray-500 pt-4">
          <a href="/dashboard" className="hover:underline">
            Leaderboard
          </a>
        </div>
      )}
    </div>
  );
}

export default FooterContent;
