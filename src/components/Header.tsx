import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react"; // Import icons
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link
import AboutModal from "./AboutModal";

interface HeaderProps {
  galleryCount: number;
  children?: React.ReactNode; // To allow passing controls like input/select/button
}

function Header({ galleryCount, children }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container
  const navigate = useNavigate(); // Hook for navigation

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery(""); // Clear query when opening
    }
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const toggleButton = document.querySelector('[aria-label*="search"]');
        if (!toggleButton || !toggleButton.contains(event.target as Node)) {
          setIsSearchOpen(false);
        }
      }
    }
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, dropdownRef]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle form submission (pressing Enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 bg-[#F3F4F6] z-10 px-4 sm:px-6 py-4">
      {/* Top Row: Stacks below md breakpoint */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 md:gap-0">
        {/* Left: Title */}
        {/* Takes full width on mobile/tablet, flex-1 on md+ */}
        <div className="w-full md:flex-1 text-center md:text-left">
          <Link to="/">
            <h1 className="font-['Chakra_Petch'] font-light text-xl sm:text-xl text-[#0F0F0F] whitespace-nowrap hover:text-gray-700 transition-colors">
              1 Million Prompts
            </h1>
          </Link>
        </div>

        {/* Center: Count */}
        {/* Takes full width on mobile/tablet, flex-1 on md+ */}
        <div className="w-full md:flex-1 text-center">
          <span className="font-['Chakra_Petch'] font-bold text-lg sm:text-xl text-[#6B7280]">
            {galleryCount.toLocaleString("en-US", {
              minimumIntegerDigits: 7,
              useGrouping: true,
            })}
          </span>
        </div>

        {/* Right: Search, About, Leaderboard */}
        {/* Stacks vertically centered on mobile/tablet, row centered on md+ */}
        <div className="w-full md:flex-1 flex flex-col items-center md:flex-row md:justify-end gap-4">
          {/* Search Icon & Dropdown - Always visible now */}
          <div className="relative" ref={dropdownRef}>
            {" "}
            {/* Removed hidden md:block */}
            <button
              onClick={handleSearchToggle}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label={isSearchOpen ? "Close search" : "Open search"}>
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            {isSearchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute top-full mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-20 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            )}
          </div>
          {/* About and Leaderboard - Always visible */}
          <AboutModal />
          <Link
            to="/dashboard"
            className="font-['Chakra_Petch'] font-light text-lg text-[#0F0F0F] hover:text-[#6B7280] focus:outline-none">
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Bottom Center: Children (Input/Select/Button) */}
      {children && (
        <div className="flex justify-center items-center gap-2 sm:gap-4 w-full">{children}</div>
      )}
    </header>
  );
}

export default Header;
