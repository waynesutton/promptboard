import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import FooterContent from "./components/FooterContent"; // Import FooterContent

// Define the type for a gallery document for the dashboard
// Include all fields needed for the tables, including clicks
interface DashboardGalleryDoc {
  _id: Id<"gallery">;
  _creationTime: number;
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse?: string; // Make optional
  likes: number;
  commentCount?: number; // Make optional to match schema/queries
  clicks: number; // Add clicks field
}

// --- Modified Header Component ---
// Remove props interface
// interface HeaderProps {
//   getConvexLogo: { imageUrl?: string | null } | null | undefined;
//   getChefLogo: { imageUrl?: string | null } | null | undefined;
// }

// Remove props from function signature
function Header() {
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  return (
    // Keep base flex, adjust to col on small, row on md+
    // Center items vertically in row view (md+), use items-center for col view (mobile)
    <header className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 md:px-6 border-none">
      {/* Section 1: Title (Always visible, first on mobile, first on desktop) */}
      <div className="flex-none text-center md:text-left w-full md:w-auto order-1">
        <h1 className="font-['Chakra_Petch'] font-light text-xl sm:text-2xl md:text-3xl text-[#0F0F0F] whitespace-nowrap">
          <a href="/">1 million prompts</a>
        </h1>
      </div>

      {/* Section 2: Logos and Text (Below title on mobile, last on desktop) */}
      {/* Ensure it takes full width on mobile for centering, auto on md+ */}
      <div className="flex-none flex flex-col items-center gap-1 w-full md:w-auto order-3 md:order-3">
        <div className="flex items-center justify-center gap-2">
          {/* Logos */}
          <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
            <img src="/convex-black.svg" alt="Convex Logo" className="h-3 sm:h-4" />
          </a>
          <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
            <img src="/chef.svg" alt="Chef Logo" className="h-7 sm:h-9" />
          </a>
        </div>
        {/* "Cooked on..." text - Center text on mobile, right on md+ */}
        <div className="text-xs sm:text-sm text-center md:text-right text-[#6B7280]">
          {" "}
          {/* Removed hidden */}
          Cooked on
          <a
            href="https://convex.link/1millchefs"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hover:underline">
            Convex Chef
          </a>
          <span className="mx-1">with a splash of</span> {/* Always show connector text */}
          <a
            href="https://openai.com/?utm_source=convexchef1millionprompts"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline">
            {" "}
            {/* Removed ml-1 */}
            OpenAI
          </a>
          <span className="ml-1">DALL·E 3</span> {/* Always show DALL-E */}
        </div>
      </div>

      {/* Section 3: Counter (Below logos/text on mobile, middle on desktop) */}
      {/* Make it visible and centered on mobile */}
      <div className="flex-grow text-center px-2 md:px-4 order-2 md:order-2 py-2 md:py-0">
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
// --- End of Modified Header Component ---

// Remove or comment out the separate FooterContent component if no longer needed elsewhere
/*
const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";

interface FooterContentProps {
  getConvexLogo: { imageUrl?: string | null } | null | undefined;
  getChefLogo: { imageUrl?: string | null } | null | undefined;
}

function FooterContent({ getConvexLogo, getChefLogo }: FooterContentProps) {
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
          openai
        </a>{" "}
        DALL·E 3
      </div>
      <div className="flex items-center justify-center gap-4">
        {getConvexLogo?.imageUrl && (
          <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
            <img src={getConvexLogo.imageUrl} alt="Convex Logo" className="h-3" />
          </a>
        )}
        {getChefLogo?.imageUrl && (
          <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
            <img src={getChefLogo.imageUrl} alt="Chef Logo" className="h-8" />
          </a>
        )}
      </div>
    </div>
  );
}
*/
// Constants still needed if getImage calls remain
// const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
// const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";

// Tab Component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border border-black rounded text-sm font-medium ${isActive ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
      {label}
    </button>
  );
}

// Table Component Placeholder (Expand later)
interface DataTableProps {
  data: DashboardGalleryDoc[] | undefined | null;
  columns: string[]; // Will now include 'Rank' potentially
  activeTab: string;
  onPromptClick: (imageId: Id<"gallery">) => void; // Add callback prop
}

function DataTable({ data, columns, activeTab, onPromptClick }: DataTableProps) {
  if (!data) {
    return <div className="mt-4 text-center text-gray-500">Loading data...</div>;
  }

  if (data.length === 0) {
    return <div className="mt-4 text-center text-gray-500">No data available for {activeTab}.</div>;
  }

  // Format date helper
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Determine if Rank column should be shown based on activeTab
  const showRankColumn = activeTab === "mostLiked" || activeTab === "mostCommented";

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* Conditionally add Rank header */}
            {showRankColumn && (
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16" // Added width
              >
                Rank
              </th>
            )}
            {columns
              .filter((col) => col !== "Rank")
              .map(
                (
                  col // Filter out 'Rank' if manually added below
                ) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                )
              )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.map(
            (
              item,
              index // Use optional chaining and add index
            ) => (
              <tr key={item._id}>
                {/* Conditionally add Rank data cell */}
                {showRankColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {index + 1}
                  </td>
                )}
                {columns.includes("Prompt") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a
                      href={`/?imageId=${item._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer"
                      onClick={(e) => {
                        onPromptClick(item._id);
                      }}>
                      {item.prompt}
                    </a>
                  </td>
                )}
                {columns.includes("Style") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.style}
                  </td>
                )}
                {columns.includes("Likes") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.likes}
                  </td>
                )}
                {columns.includes("Comments") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.commentCount ?? 0}
                  </td>
                )}
                {columns.includes("Clicks") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.clicks ?? 0}
                  </td>
                )}
                {columns.includes("Date Submitted") && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item._creationTime)}
                  </td>
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  // Start with 'mostLiked' as the default active tab
  const [activeTab, setActiveTab] = useState("mostLiked");
  const incrementClicks = useMutation(api.gallery.incrementImageClicks);

  // Fetch data for the dashboard
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const last20Prompts = useQuery(api.gallery.getLast20Prompts);
  const last20Styles = useQuery(api.gallery.getLast20Styles);
  const allPrompts = useQuery(api.gallery.getAllPrompts); // Limited to 100
  const mostLiked = useQuery(api.gallery.getMostLikedImages);
  const mostCommented = useQuery(api.gallery.getMostCommentedImages);

  // Remove logo queries
  // const getChefLogo = useQuery(api.gallery.getImage, { imageId: CHEF_LOGO_ID as Id<"_storage"> });
  // const getConvexLogo = useQuery(api.gallery.getImage, {
  //   imageId: CONVEX_LOGO_ID as Id<"_storage">,
  // });

  // Handler to call the mutation
  const handlePromptClick = (imageId: Id<"gallery">) => {
    incrementClicks({ imageId });
    // Note: The link's default behavior (opening in new tab) will still happen.
    // No navigation prevention needed here as it opens in a new tab.
  };

  // Determine data and columns based on active tab
  let currentData: DashboardGalleryDoc[] | undefined | null = null;
  let currentColumns: string[] = [];

  // Updated switch statement with new default and order
  switch (activeTab) {
    case "mostLiked": // New default
      currentData = mostLiked;
      // Add 'Rank' to columns
      currentColumns = ["Rank", "Prompt", "Likes", "Date Submitted"];
      break;
    case "mostCommented":
      currentData = mostCommented;
      // Add 'Rank' to columns
      currentColumns = ["Rank", "Prompt", "Comments", "Date Submitted"];
      break;
    case "last20Prompts": // Note: Key still 'last20Prompts' internally
      currentData = last20Prompts;
      currentColumns = ["Prompt", "Date Submitted"];
      break;
    case "last20Styles": // Note: Key still 'last20Styles' internally
      currentData = last20Styles;
      currentColumns = ["Style", "Date Submitted"];
      break;
    case "allPrompts":
      currentData = allPrompts;
      currentColumns = ["Prompt", "Date Submitted"];
      break;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Call Header without props */}
      <Header />

      {/* Main Dashboard Content - Adjust padding */}
      <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Leaderboard
        </h1>

        {/* Counter Section - Adjust layout and text size */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="border border-black px-4 py-2 sm:px-6 sm:py-3 rounded">
            <span className="font-['Chakra_Petch'] font-semibold text-2xl sm:text-4xl text-black">
              {galleryCount.toLocaleString("en-US")}
            </span>
          </div>
          <span className="text-lg sm:text-xl text-gray-600">Goal to 1 million</span>
        </div>

        {/* Tabs Section - Ensure wrapping and spacing */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* TabButtons remain the same, flex-wrap handles responsiveness */}
          <TabButton
            label="100 Most Liked"
            isActive={activeTab === "mostLiked"}
            onClick={() => setActiveTab("mostLiked")}
          />
          <TabButton
            label="100 Most Commented"
            isActive={activeTab === "mostCommented"}
            onClick={() => setActiveTab("mostCommented")}
          />
          <TabButton
            label="Last 100 Prompts"
            isActive={activeTab === "last20Prompts"}
            onClick={() => setActiveTab("last20Prompts")}
          />
          <TabButton
            label="Last 100 Styles"
            isActive={activeTab === "last20Styles"}
            onClick={() => setActiveTab("last20Styles")}
          />
          <TabButton
            label="All Prompts"
            isActive={activeTab === "allPrompts"}
            onClick={() => setActiveTab("allPrompts")}
          />
        </div>

        {/* Data Table Section - Adjust padding */}
        {/* The table container itself uses overflow-x-auto which is good */}
        <div className="bg-white shadow rounded-lg p-2 sm:p-4 min-h-[400px]">
          <DataTable
            data={currentData}
            columns={currentColumns}
            activeTab={activeTab}
            onPromptClick={handlePromptClick}
          />
        </div>
      </main>

      {/* Footer can be empty or removed if nothing else goes here */}
      <footer className="mt-auto py-4">
        {/* Use the shared FooterContent component */}
        <FooterContent />
      </footer>
    </div>
  );
}

export default Dashboard;
