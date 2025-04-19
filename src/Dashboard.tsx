import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Define the type for a gallery document for the dashboard
// Include all fields needed for the tables, including clicks
interface DashboardGalleryDoc {
  _id: Id<"gallery">;
  _creationTime: number;
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse: string;
  likes: number;
  commentCount?: number; // Make optional to match schema/queries
  clicks: number; // Add clicks field
}

// --- Modified Header Component ---
// Add props for logo data
interface HeaderProps {
  getConvexLogo: { imageUrl?: string | null } | null | undefined;
  getChefLogo: { imageUrl?: string | null } | null | undefined;
}

function Header({ getConvexLogo, getChefLogo }: HeaderProps) {
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  return (
    // Main header container: flex, space-between, items-center
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-none">
      {/* Left: Title */}
      <div className="flex-none">
        <h1 className="font-['Chakra_Petch'] font-light text-2xl sm:text-3xl text-[#0F0F0F] whitespace-nowrap">
          <a href="/">1 million prompts</a>
        </h1>
      </div>

      {/* Center: Counter */}
      {/* flex-grow allows it to take up space, text-center centers the span */}
      <div className="flex-grow text-center px-4">
        <span className="font-['Chakra_Petch'] font-bold text-xl  text-[#6B7280]">
          {galleryCount.toLocaleString("en-US", {
            minimumIntegerDigits: 7,
            useGrouping: true,
          })}
        </span>
      </div>

      {/* Right: Logos and Text */}
      {/* flex-none keeps it from growing, changed to vertical stacking */}
      <div className="flex-none flex flex-col items-end gap-1">
        {" "}
        {/* Changed to flex-col, items-end, reduced gap */}
        {/* Logos remain on top */}
        <div className="flex items-center justify-center gap-2">
          {getConvexLogo?.imageUrl && (
            <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
              <img src={getConvexLogo.imageUrl} alt="Convex Logo" className="h-4" />{" "}
              {/* Smaller height */}
            </a>
          )}
          {getChefLogo?.imageUrl && (
            <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
              <img src={getChefLogo.imageUrl} alt="Chef Logo" className="h-9" />{" "}
              {/* Smaller height */}
            </a>
          )}
        </div>
        {/* "Cooked on..." text - now below logos, single line */}
        <div className="text-l text-right text-[#6B7280] hidden md:block">
          {" "}
          {/* Hide on smaller screens if needed */}
          Cooked on
          <a
            href="https://convex.link/1millchefs"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hover:underline">
            Convex Chef
          </a>{" "}
          {/* Removed <br /> */}
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
const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";

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
  columns: string[];
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

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id}>
              {columns.includes("Prompt") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Wrap prompt in a link, add onClick handler */}
                  <a
                    href={`/?imageId=${item._id}`}
                    target="_blank" // Open in new tab
                    rel="noopener noreferrer"
                    className="hover:underline cursor-pointer" // Added cursor-pointer for clarity
                    onClick={(e) => {
                      // Call mutation *before* navigation
                      onPromptClick(item._id);
                      // Allow default link behavior to proceed unless handled differently (e.g., modal)
                      // If we were opening a modal here instead:
                      // e.preventDefault();
                      // openModalFunction(item._id);
                    }}>
                    {item.prompt}
                  </a>
                </td>
              )}
              {columns.includes("Style") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.style}</td>
              )}
              {columns.includes("Likes") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.likes}</td>
              )}
              {columns.includes("Comments") && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.commentCount ?? 0} {/* Handle optional commentCount */}
                </td>
              )}
              {columns.includes("Clicks") && ( // Add Clicks column display
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.clicks ?? 0} {/* Handle potential null/undefined */}
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
  const [activeTab, setActiveTab] = useState("last20Prompts");
  const incrementClicks = useMutation(api.gallery.incrementImageClicks);

  // Fetch data for the dashboard
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const last20Prompts = useQuery(api.gallery.getLast20Prompts);
  const last20Styles = useQuery(api.gallery.getLast20Styles);
  const allPrompts = useQuery(api.gallery.getAllPrompts); // Limited to 100
  const mostLiked = useQuery(api.gallery.getMostLikedImages);
  const mostCommented = useQuery(api.gallery.getMostCommentedImages);

  // Fetch logos for HEADER
  const getChefLogo = useQuery(api.gallery.getImage, { imageId: CHEF_LOGO_ID as Id<"_storage"> });
  const getConvexLogo = useQuery(api.gallery.getImage, {
    imageId: CONVEX_LOGO_ID as Id<"_storage">,
  });

  // Handler to call the mutation
  const handlePromptClick = (imageId: Id<"gallery">) => {
    incrementClicks({ imageId });
    // Note: The link's default behavior (opening in new tab) will still happen.
    // No navigation prevention needed here as it opens in a new tab.
  };

  // Determine data and columns based on active tab
  let currentData: DashboardGalleryDoc[] | undefined | null = null;
  let currentColumns: string[] = [];

  switch (activeTab) {
    case "last20Prompts":
      currentData = last20Prompts;
      currentColumns = ["Prompt", "Date Submitted"]; // Remove Clicks
      break;
    case "last20Styles":
      currentData = last20Styles;
      currentColumns = ["Style", "Date Submitted"]; // Clicks wasn't here
      break;
    case "allPrompts":
      currentData = allPrompts;
      currentColumns = ["Prompt", "Date Submitted"]; // Remove Clicks
      break;
    case "mostLiked":
      currentData = mostLiked;
      currentColumns = ["Prompt", "Likes", "Date Submitted"]; // Remove Clicks
      break;
    case "mostCommented":
      currentData = mostCommented;
      currentColumns = ["Prompt", "Comments", "Date Submitted"]; // Remove Clicks
      break;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Pass logo data to the updated Header */}
      <Header getConvexLogo={getConvexLogo} getChefLogo={getChefLogo} />

      {/* Main Dashboard Content */}
      <main className="flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

        {/* Counter Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="border border-black px-6 py-3 rounded">
            <span className="font-['Chakra_Petch'] font-semibold text-4xl text-black">
              {galleryCount.toLocaleString("en-US")}
            </span>
          </div>
          <span className="text-xl text-gray-600">Goal to 1 million</span>
        </div>

        {/* Tabs Section */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton
            label="Last 20 Prompts"
            isActive={activeTab === "last20Prompts"}
            onClick={() => setActiveTab("last20Prompts")}
          />
          <TabButton
            label="Last 20 Styles"
            isActive={activeTab === "last20Styles"}
            onClick={() => setActiveTab("last20Styles")}
          />
          <TabButton
            label="All Prompts"
            isActive={activeTab === "allPrompts"}
            onClick={() => setActiveTab("allPrompts")}
          />
          <TabButton
            label="20 Most Liked Images"
            isActive={activeTab === "mostLiked"}
            onClick={() => setActiveTab("mostLiked")}
          />
          <TabButton
            label="20 Most Commented Images"
            isActive={activeTab === "mostCommented"}
            onClick={() => setActiveTab("mostCommented")}
          />
        </div>

        {/* Data Table Section */}
        <div className="bg-white shadow rounded-lg p-4 min-h-[400px]">
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
        {/* <FooterContent getConvexLogo={getConvexLogo} getChefLogo={getChefLogo} /> */}
        {/* Optionally add other footer content like copyright */}
        <div className="text-center text-xs text-gray-400">Dashboard Footer</div>
      </footer>
    </div>
  );
}

export default Dashboard;
