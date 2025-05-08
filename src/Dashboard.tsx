import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import FooterContent from "./components/FooterContent"; // Import FooterContent
import Header from "./components/Header"; // Import the updated Header component

// Define the type for a gallery document for the dashboard
// Include all fields needed for the tables, including clicks
interface DashboardGalleryDoc extends Doc<"gallery"> {
  _id: Id<"gallery">;
  _creationTime: number;
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse?: string; // Make optional
  likes: number;
  commentCount?: number; // Make optional to match schema/queries
  clicks: number; // Add clicks field
  authorName?: string; // Add author name
  authorSocialLink?: string; // Add author social link
  isHighlighted?: boolean; // Add isHighlighted
  isHidden?: boolean; // Add isHidden (though queries filter them, good for type consistency)
}

// --- Removed the old inline Header component definition ---
/*
function OldHeader() { // Renamed to avoid conflict if needed, though commented out
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 md:px-6 border-none">
      {/* ... old header content ... * /}
    </header>
  );
}
*/
// --- End of Removed Header Component ---

// --- Removed the old inline FooterContent component definition ---
/*
const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";

interface FooterContentProps {
  getConvexLogo: { imageUrl?: string | null } | null | undefined;
  getChefLogo: { imageUrl?: string | null } | null | undefined;
}

function OldFooterContent({ getConvexLogo, getChefLogo }: FooterContentProps) { // Renamed
  return (
    <div className="text-center py-4 mt-5">
      {/* ... old footer content ... * /}
    </div>
  );
}
*/
// --- End of Removed FooterContent Component ---

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
          {data?.map((item, index) => (
            <tr key={item._id} className={`${item.isHighlighted ? "bg-red-50" : ""}`}>
              {/* Conditionally add Rank data cell */}
              {showRankColumn && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {index + 1}
                </td>
              )}
              {columns.includes("Prompt") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm max-w-xs truncate">
                  <a
                    href={`/?imageId=${item._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hover:underline cursor-pointer ${item.isHighlighted ? "text-[#EB2E2A] font-semibold" : "text-gray-900"}`}
                    title={item.prompt}
                    onClick={(e) => {
                      onPromptClick(item._id);
                    }}>
                    {item.prompt}
                    {item.isHighlighted && (
                      <span className="ml-2 text-xs text-red-600 font-bold">(H)</span>
                    )}
                  </a>
                </td>
              )}
              {columns.includes("Style") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.style}</td>
              )}
              {/* Add Author Name column */}
              {columns.includes("Author") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.authorName || "N/A"}
                </td>
              )}
              {/* Add Social Link column */}
              {columns.includes("Social Link") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.authorSocialLink ? (
                    <a
                      href={item.authorSocialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline">
                      Profile
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
              )}
              {columns.includes("Likes") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.likes}</td>
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
          ))}
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

  // Handler to call the mutation
  const handlePromptClick = (imageId: Id<"gallery">) => {
    incrementClicks({ imageId });
  };

  // Determine data and columns based on active tab
  let currentData: DashboardGalleryDoc[] | undefined | null = null;
  let currentColumns: string[] = [];

  switch (activeTab) {
    case "mostLiked":
      currentData = mostLiked;
      currentColumns = ["Rank", "Prompt", "Author", "Social Link", "Likes", "Date Submitted"];
      break;
    case "mostCommented":
      currentData = mostCommented;
      currentColumns = ["Rank", "Prompt", "Comments", "Date Submitted"];
      break;
    case "last20Prompts":
      currentData = last20Prompts;
      currentColumns = ["Prompt", "Author", "Social Link", "Date Submitted"];
      break;
    case "last20Styles":
      currentData = last20Styles;
      currentColumns = ["Style", "Author", "Social Link", "Date Submitted"];
      break;
    case "allPrompts":
      currentData = allPrompts;
      currentColumns = ["Prompt", "Author", "Social Link", "Date Submitted"];
      break;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Use the imported Header component, pass galleryCount */}
      {/* The Dashboard doesn't need the children (input/select/button), so don't pass them */}
      <Header galleryCount={galleryCount} />

      {/* Main Dashboard Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Leaderboard
        </h1>
        {/* powered by logos start */}
        <div className="flex items-center text-[#6B7280] text-sm  justify-center gap-2">
          {/* Use static path for Convex logo */}
          Powered by{" "}
          <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
            <img src="/convex-black.svg" alt="Convex Logo" className="h-3" />
          </a>{" "}
          and {/* Use static path for open ai logo */}
          <a
            href="https://openai.com/?utm_source=convexchef1millionprompts"
            target="_blank"
            rel="noopener noreferrer">
            <img src="/openai.svg" alt="OpenAI Logo" className="h-6" />
          </a>
        </div>
        {/* powered by logos end */}
        {/* Counter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="border border-black px-4 py-2 sm:px-6 sm:py-3 rounded">
            <span className="font-['Chakra_Petch'] font-semibold text-2xl sm:text-4xl text-black">
              {galleryCount.toLocaleString("en-US")}
            </span>
          </div>
          <span className="text-lg sm:text-xl text-gray-600">Goal to 1 million</span>
        </div>

        {/* Tabs Section */}
        <div className="flex flex-wrap gap-2 mb-6">
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

        {/* Data Table Section */}
        <div className="bg-white shadow rounded-lg p-2 sm:p-4 min-h-[400px]">
          <DataTable
            data={currentData}
            columns={currentColumns}
            activeTab={activeTab}
            onPromptClick={handlePromptClick}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4">
        <FooterContent />
      </footer>
    </div>
  );
}

export default Dashboard;
