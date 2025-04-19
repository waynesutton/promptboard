import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Header from "./components/Header";
import FooterContent from "./components/FooterContent";

function NotFoundPage() {
  // Fetch the gallery count
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Use the reusable Header component, passing only the count */}
      <Header galleryCount={galleryCount} />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="font-['Chakra_Petch'] font-bold text-8xl sm:text-9xl text-[#EB2E2A] mb-4">
          404
        </div>
        <div className="font-['Chakra_Petch'] font-bold text-4xl sm:text-5xl text-[#6B7280] mb-8">
          {galleryCount.toLocaleString("en-US", {
            minimumIntegerDigits: 7,
            useGrouping: true,
          })}
        </div>
        <p className="text-xl text-gray-700 mb-8">Oops! Page not found.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#EB2E2A] text-white rounded-lg hover:bg-[#cf2925] transition-colors duration-200">
          Go Home
        </Link>
      </main>

      <footer className="mt-auto">
        {/* Use the reusable Footer component */}
        <FooterContent />
      </footer>
    </div>
  );
}

export default NotFoundPage;
