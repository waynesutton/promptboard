import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ExternalLink } from "lucide-react";

const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";
const cookingWords = [
  "baking",
  "boiling",
  "grilling",
  "roasting",
  "frying",
  "sauteing",
  "steaming",
  "broiling",
  "chopping",
  "mixing",
  "whisking",
  "stirring",
  "blending",
  "measuring",
  "seasoning",
  "marinating",
  "preheating",
  "peeling",
  "slicing",
  "dicing",
  "mincing",
  "simmering",
  "poaching",
  "glazing",
  "caramelizing",
  "reducing",
  "kneading",
  "folding",
  "greasing",
  "sifting",
  "cracking",
  "spreading",
  "layering",
  "toasting",
  "skewering",
  "drizzling",
  "serving",
  "plating",
  "garnishing",
  "flipping",
  "tossing",
  "braising",
  "grating",
  "infusing",
  "chilling",
  "reheating",
  "pureeing",
  "melting",
  "searing",
  "rubbing",
];

// Define the type for a single gallery document (matching the query return type)
interface GalleryDoc {
  _id: Id<"gallery">;
  _creationTime: number; // Assuming _creationTime is part of the document
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse: string;
  likes: number;
}

// New component to render a single gallery image
interface GalleryImageItemProps {
  imageDoc: GalleryDoc;
  onClick: () => void;
}

function GalleryImageItem({ imageDoc, onClick }: GalleryImageItemProps) {
  // Fetch the image URL for this specific item using its storageId
  const imageResult = useQuery(api.gallery.getImage, { imageId: imageDoc.storageId });

  return (
    <div
      className="aspect-square cursor-pointer bg-gray-200" // Add a placeholder background
      onClick={onClick}>
      {imageResult?.imageUrl ? (
        <img
          src={imageResult.imageUrl}
          alt={imageDoc.prompt || "Gallery image"} // Use prompt as alt text
          className="w-full h-full object-cover"
          loading="lazy" // Add lazy loading
        />
      ) : (
        // Optional: Show a loading indicator or placeholder
        <div className="w-full h-full flex items-center justify-center text-gray-400">...</div>
      )}
    </div>
  );
}

// Define the types for the props of FooterContent
interface FooterContentProps {
  getConvexLogo: { imageUrl?: string | null } | null | undefined;
  getChefLogo: { imageUrl?: string | null } | null | undefined;
}

// Reusable Footer Content Component
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
      {/* Flex container for logos */}
      <div className="flex items-center justify-center gap-4">
        {/* Convex Logo */}
        {getConvexLogo?.imageUrl && (
          <a href="https://convex.link/1millprompts" target="_blank" rel="noopener noreferrer">
            <img src={getConvexLogo.imageUrl} alt="Convex Logo" className="h-3" />
          </a>
        )}
        {/* Chef Logo */}
        {getChefLogo?.imageUrl && (
          <a href="https://convex.link/1millchefs" target="_blank" rel="noopener noreferrer">
            <img src={getChefLogo.imageUrl} alt="Chef Logo" className="h-8" />
          </a>
        )}
      </div>
    </div>
  );
}

function App() {
  // States
  const [selectedStyle, setSelectedStyle] = useState("Studio Laika");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [modalImage, setModalImage] = useState<string | undefined>();
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);

  // Queries
  // listGallery now returns GalleryDoc[]
  const listGallery = useQuery(api.gallery.listGallery) || [];
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const getChefLogo = useQuery(api.gallery.getImage, { imageId: CHEF_LOGO_ID as Id<"_storage"> });
  // Fetch Convex logo URL
  const getConvexLogo = useQuery(api.gallery.getImage, {
    imageId: CONVEX_LOGO_ID as Id<"_storage">,
  });
  // getComments depends on modalImageId, so keep its conditional query
  const getComments = useQuery(
    api.gallery.getComments,
    modalImageId ? { galleryId: modalImageId } : "skip"
  );
  const modalImageData = modalImageId ? listGallery.find((img) => img._id === modalImageId) : null;

  // Actions & Mutations
  const generateImage = useAction(api.gallery.processImage);
  const addComment = useMutation(api.gallery.addComment);
  const addLike = useMutation(api.gallery.addLike);

  // Cycle through cooking words
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentWord((prev) => (prev + 1) % cookingWords.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleGenerateImage = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const result = await generateImage({ prompt, style: selectedStyle });
      if (result?.imageUrl && result?.galleryId) {
        // Open the modal immediately with the data returned from the action
        setModalImage(result.imageUrl);
        setModalImageId(result.galleryId);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (modalImageId && userName && newComment) {
      await addComment({
        galleryId: modalImageId,
        userName,
        text: newComment,
      });
      setNewComment("");
      // Keep name for convenience?
      // setUserName(");
    }
  };

  const handleLike = async () => {
    if (modalImageId) {
      await addLike({ galleryId: modalImageId });
    }
  };

  // Function to handle opening the modal for a specific image
  const handleOpenModal = (imageDoc: GalleryDoc) => {
    // Fetch the URL again when opening modal, or rely on the GalleryImageItem having loaded it?
    // For simplicity, let's fetch it again here, though this is slightly redundant.
    // A better approach might involve passing the already fetched URL from GalleryImageItem
    // or managing a global cache, but this keeps components decoupled.
    // const imageUrlQuery = api.gallery.getImage.toString(); // REMOVE THIS LINE - Causes TypeError
    // Since we can't call useQuery here, we set the ID and rely on the modal's rendering logic
    // or pre-fetch/cache URLs differently.
    // For now, let's just set the ID, and the modal will use the stored URL if already fetched
    // or show loading. Let's assume the modal needs the image URL passed in.

    // Revised: Set the ID. The modal display logic below handles fetching/showing the image.
    setModalImageId(imageDoc._id);
    // We'll fetch the URL specifically for the modal context below.
  };

  const handleCopy = () => {
    // Construct the URL for the specific image page/modal view if applicable
    // For now, just copying the ID as before
    // const textToCopy = modalImageId ? modalImageId : "";
    // Construct the full URL
    if (modalImageId) {
      const baseUrl = window.location.origin;
      const urlToCopy = `${baseUrl}?imageId=${modalImageId}`;
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch image URL specifically for the modal when modalImageId changes
  const modalImageResult = useQuery(
    api.gallery.getImage,
    modalImageId ? { imageId: modalImageData?.storageId! } : "skip"
  );

  // Update modal image URL when fetched
  useEffect(() => {
    if (modalImageResult?.imageUrl) {
      setModalImage(modalImageResult.imageUrl);
    }
  }, [modalImageResult?.imageUrl]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="font-['Chakra_Petch'] font-light text-[32px] text-[#0F0F0F]">
          1 million prompts
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add to the 1 million. Enter your prompt..."
            className="w-96 px-4 py-2 bg-white rounded-lg shadow-sm"
          />
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm">
            <option value="Studio Laika">Studio Laika</option>
            <option value="3dsoft">3D Soft</option>
            <option value="Ghibli">Ghibli</option>
            <option value="80s Anime">80s Anime</option>
            <option value="T206 Vintage">T206 Vintage</option>
            <option value="futuristic">Futuristic</option>
            <option value="b&w">B&W</option>
            <option value="convex">Convex</option>
          </select>
          <button
            onClick={handleGenerateImage}
            disabled={isLoading}
            className="px-6 py-2 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-50">
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-['Chakra_Petch'] font-light text-xl text-[#6B7280]">
            {galleryCount.toLocaleString("en-US", { minimumIntegerDigits: 7, useGrouping: true })}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6">
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 mt-8">
          {listGallery.map((imgDoc: GalleryDoc) => (
            // Use the new GalleryImageItem component
            <GalleryImageItem
              key={imgDoc._id}
              imageDoc={imgDoc}
              onClick={() => handleOpenModal(imgDoc)} // Pass the full doc
            />
          ))}
        </div>
      </main>

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-100/75 flex items-center justify-center z-50">
          <div className="text-center">
            <svg className="w-16 h-16 text-white animate-spin mx-auto" viewBox="0 0 10870 10946">
              <path
                d="M6868.76 8627.42C8487.29 8450.74 10013.2 7603.18 10853.3 6188.51C10455.5 9687.49 6562.35 11899.1 3384.6 10541.2C3091.79 10416.4 2839.74 10208.9 2666.77 9942.01C1952.64 8839.93 1717.89 7437.62 2055.19 6165.03C3018.89 7799.62 4978.42 8801.63 6868.76 8627.42Z"
                fill="#F3B01C"
              />
              <path
                d="M1995.82 5138.31C1339.76 6628.34 1311.35 8372.89 2115.67 9808.56C-714.901 7715.6 -684.013 3236.85 2081.07 1164.89C2336.83 973.381 2640.76 859.713 2959.53 842.416C4270.41 774.462 5602.3 1272.38 6536.35 2200.25C4638.6 2218.78 2790.26 3413.53 1995.82 5138.31Z"
                fill="#8D2676"
              />
              <path
                d="M7451.92 2658.62C6494.39 1346.5 4995.71 453.219 3353.71 426.038C6527.75 -989.865 10432 1305.73 10857 4699.69C10896.5 5014.75 10844.6 5335.98 10702.6 5620.15C10109.5 6803.78 9009.91 7721.77 7724.97 8061.53C8666.43 6345.4 8550.29 4248.73 7451.92 2658.62Z"
                fill="#EE342F"
              />
            </svg>
            <div className="mt-4 text-black font-['Chakra_Petch'] font-bold">
              {cookingWords[currentWord]}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal - Opens when modalImageId is set */}
      {modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 relative max-w-lg w-full">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
              onClick={() => {
                setModalImageId(null); // Close modal by clearing the ID
                setModalImage(undefined);
                setShowCommentModal(false);
              }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {modalImage ? (
              <img
                src={modalImage}
                alt={modalImageData?.prompt || "Modal image"}
                className="w-full h-auto max-h-[60vh] object-contain mb-4"
              />
            ) : (
              <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center mb-4">
                Loading...
              </div>
            )}
            {/* Display prompt and style */}
            {modalImageData && (
              <div className="mb-4 text-sm">
                <p>
                  <strong>Prompt:</strong> {modalImageData.prompt}
                </p>
                <p>
                  <strong>Style:</strong> {modalImageData.style}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-700 hover:text-[#EB2E2A]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                {modalImageData?.likes || 0}
              </button>
              <button
                onClick={() => setShowCommentModal(true)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {getComments ? getComments.length : 0}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-gray-700 hover:text-green-600">
                <ExternalLink className="w-5 h-5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            {/* Add Footer Content Here */}
            <FooterContent getConvexLogo={getConvexLogo} getChefLogo={getChefLogo} />
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
              onClick={() => setShowCommentModal(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            <div className="max-h-[300px] overflow-y-auto mb-4 border-t border-b py-2">
              {getComments && getComments.length > 0 ? (
                getComments.map((comment, i) => (
                  <div key={i} className="mb-2 text-sm">
                    <strong className="text-gray-800">{comment.userName}:</strong>{" "}
                    <span className="text-gray-600">{comment.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="w-full mb-2 px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full mb-2 px-3 py-2 border rounded text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={!userName || !newComment}
              className="w-full px-4 py-2 bg-[#EB2E2A] text-white rounded disabled:opacity-50">
              Submit Comment
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8">
        {/* Use the reusable FooterContent component */}
        <FooterContent getConvexLogo={getConvexLogo} getChefLogo={getChefLogo} />
      </footer>
    </div>
  );
}

export default App;
