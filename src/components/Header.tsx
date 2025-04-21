import React from "react";
import AboutModal from "./AboutModal";

interface HeaderProps {
  galleryCount: number;
  children?: React.ReactNode; // To allow passing controls like input/select/button
}

function Header({ galleryCount, children }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 sticky top-0 bg-[#F3F4F6] z-10">
      {/* Title & About Link Group (Order 1 on all screens) */}
      <div className="flex items-center gap-4 order-1">
        <h1 className="font-['Chakra_Petch'] font-light text-2xl sm:text-2xl text-[#0F0F0F] whitespace-nowrap">
          1 Million Prompts Contest
        </h1>
        <AboutModal />
      </div>
      {/* Title & About Link Group ends here */}
      {/* contest about start here - Removed the centering div */}

      {/* contest about ends here */}
      {/* Controls Group (Order 2 on all screens) - Passed as children */}
      {children && (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full md:w-auto order-2">
          {children}
        </div>
      )}

      {/* Count (Order 3 on all screens) */}
      <div className="flex items-center gap-2 sm:gap-4 order-3">
        <span className="font-['Chakra_Petch'] font-bold text-lg sm:text-xl text-[#6B7280]">
          {galleryCount.toLocaleString("en-US", {
            minimumIntegerDigits: 7,
            useGrouping: true,
          })}
        </span>
      </div>
    </header>
  );
}

export default Header;
