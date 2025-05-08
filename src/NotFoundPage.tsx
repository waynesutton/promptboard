import React, { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./components/Header";
import FooterContent from "./components/FooterContent";
import { Search, AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function NotFoundPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Header galleryCount={galleryCount} />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <AlertTriangle size={64} className="text-[#EB2E2A] mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-3">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! Looking for something?</p>

        <p className="text-gray-500 mb-4 max-w-md">
          The page you're looking for doesn't seem to exist. Maybe try a search?
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-8 w-full max-w-lg">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, styles, authors..."
            className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB2E2A] focus:border-transparent text-gray-700 shadow-sm"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="px-6 py-3 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#cf2925] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EB2E2A] shadow-sm font-semibold transition-colors">
            <Search size={20} />
          </button>
        </form>
      </main>

      <footer className="mt-auto py-5">
        <FooterContent />
      </footer>
    </div>
  );
}

export default NotFoundPage;
