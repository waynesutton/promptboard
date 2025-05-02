import React, { useState, useRef, useEffect } from "react";
import { Search, X, Menu } from "lucide-react"; // Import icons and Menu icon
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link
import AboutModal from "./AboutModal";

interface HeaderProps {
  galleryCount: number;
  children?: React.ReactNode; // To allow passing controls like input/select/button
}

function Header({ galleryCount, children }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for search dropdown
  const menuRef = useRef<HTMLDivElement>(null); // Ref for mobile menu
  const navigate = useNavigate(); // Hook for navigation

  // Toggle Search
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
    }
    // Ensure mobile menu is closed when opening search via main icon (if needed)
    // setIsMenuOpen(false);
  };

  // Toggle Mobile Menu
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsSearchOpen(false); // Close search if menu opens
  };

  // Close dropdown/menu if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close search dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[aria-label*="search"]') // Check if click is on toggle
      ) {
        setIsSearchOpen(false);
      }
      // Close mobile menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[aria-label="Open menu"]') // Check if click is on toggle
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isSearchOpen || isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, isMenuOpen, dropdownRef, menuRef]);

  // Focus search input when search opens (desktop or mobile)
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle form submission (closes search dropdown and potentially mobile menu)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMenuOpen(false); // Close mobile menu on search
      setSearchQuery("");
    }
  };

  // Close menu when a link/action inside is clicked
  const handleMenuAction = () => {
    setIsMenuOpen(false);
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

        {/* Right: Desktop Links / Mobile Hamburger */}
        <div className="w-full md:flex-1 flex justify-center md:justify-end items-center">
          {/* Desktop Links (Hidden below md) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Icon & Dropdown (Desktop) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleSearchToggle}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label={isSearchOpen ? "Close search" : "Open search"}>
                {isSearchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
              {isSearchOpen && (
                <form
                  onSubmit={handleSearchSubmit}
                  className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-20">
                  <input
                    ref={searchInputRef} // Ref for desktop search
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#2a2a2a]"
                  />
                </form>
              )}
            </div>
            <AboutModal />
            <Link
              to="/dashboard"
              className="font-['Chakra_Petch'] font-light text-lg text-[#0F0F0F] hover:text-[#6B7280] focus:outline-none">
              Leaderboard
            </Link>
          </div>

          {/* Hamburger Button (Visible below md) */}
          <div className="md:hidden">
            <button
              onClick={handleMenuToggle}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2" // Added padding
              aria-label="Open menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Center: Children (Input/Select/Button) */}
      {children && (
        <div className="flex justify-center items-center gap-2 sm:gap-4 w-full">{children}</div>
      )}

      {/* Mobile Menu Overlay */}
      <div
        ref={menuRef}
        className={`fixed inset-y-0 right-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          {/* Close Button */}
          <button
            onClick={handleMenuToggle}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            aria-label="Close menu">
            <X size={24} />
          </button>

          <h2 className="text-lg font-semibold mb-6 mt-2">Menu</h2>

          {/* Search Form (Mobile) */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <input
              // Not using searchInputRef here to avoid conflicts, focus is handled differently if needed
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#2a2a2a]"
            />
          </form>

          {/* About Button (Mobile) */}
          <div onClick={handleMenuAction} className="block w-full text-left mb-3">
            <AboutModal />
          </div>

          {/* Leaderboard Link (Mobile) */}
          <Link
            to="/dashboard"
            onClick={handleMenuAction}
            className="block font-['Chakra_Petch'] font-light text-lg text-[#0F0F0F] hover:text-[#6B7280] focus:outline-none py-2">
            Leaderboard
          </Link>
        </div>
      </div>
      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={handleMenuToggle} // Close menu on overlay click
        ></div>
      )}
    </header>
  );
}

export default Header;
