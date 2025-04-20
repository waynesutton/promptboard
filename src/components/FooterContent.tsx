import React from "react";

// Define props for the component
interface FooterContentProps {
  hideDashboardLink?: boolean; // Optional prop to hide the dashboard link
}

// Reusable Footer Content Component
export function FooterContent({ hideDashboardLink = false }: FooterContentProps) {
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
        DALL·E 3
      </div>
      <div className="flex items-center justify-center gap-4">
        {/* Use static path for Convex logo */}
        <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
          <img src="/convex-black.svg" alt="Convex Logo" className="h-3" />
        </a>
        {/* Use static path for Chef logo */}
        <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
          <img src="/chef.svg" alt="Chef Logo" className="h-6" />
        </a>
      </div>
      {/* remove dashboard link back here as it's part of the standard footerand I don't want it in the modal it's in the footer and not in the modal */}
      {!hideDashboardLink && ( // Conditionally render the dashboard link
        <div className="text-center text-sm text-gray-500 pt-4">
          <a href="/dashboard" className="hover:underline">
            View Dashboard
          </a>
        </div>
      )}
    </div>
  );
}

export default FooterContent;
