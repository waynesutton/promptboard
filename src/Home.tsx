import { useState, useEffect, useRef } from "react";
import { useAction, useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ExternalLink } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import FooterContent from "./components/FooterContent";
import Header from "./components/Header";

// Remove logo IDs
// const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
// const CONVEX_LOGO_ID = "kg22dhgjcrwasz9vpntxqj0q157eag1p";
const MAX_GALLERY_COUNT = 1000000;
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
  _creationTime: number;
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse: string;
  likes: number;
  commentCount?: number;
}

// New component to render a single gallery image start
interface GalleryImageItemProps {
  imageDoc: GalleryDoc;
  onClick: () => void;
}

function GalleryImageItem({ imageDoc, onClick }: GalleryImageItemProps) {
  const imageResult = useQuery(api.gallery.getImage, { imageId: imageDoc.storageId });

  return (
    <div
      className="aspect-square cursor-pointer bg-gray-200 border border-gray-300 overflow-hidden"
      onClick={onClick}>
      {imageResult?.imageUrl ? (
        <img
          src={imageResult.imageUrl}
          alt={imageDoc.prompt || "Gallery image"}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-100"></div>
      )}
    </div>
  );
}
// New component to render a single gallery image end

function Home() {
  // States
  const [selectedStyle, setSelectedStyle] = useState("Studio Laika");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [modalImage, setModalImage] = useState<string | undefined>();
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showGreatnessModal, setShowGreatnessModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [loadingImageIndex, setLoadingImageIndex] = useState(0);

  // Queries
  const {
    results: galleryItems,
    status: galleryStatus,
    loadMore,
  } = usePaginatedQuery(
    api.gallery.listGallery,
    { paginationOpts: {} },
    { initialNumItems: 1000 } // Load 1000 initially (10 columns * 100 rows)
  );
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  // Remove logo queries
  // const getChefLogo = useQuery(api.gallery.getImage, { imageId: CHEF_LOGO_ID as Id<"_storage"> });
  // const getConvexLogo = useQuery(api.gallery.getImage, {
  //   imageId: CONVEX_LOGO_ID as Id<"_storage">,
  // });
  const getComments = useQuery(
    api.gallery.getComments,
    modalImageId ? { galleryId: modalImageId } : "skip"
  );
  const modalImageData = modalImageId ? galleryItems.find((img) => img._id === modalImageId) : null;

  const isLimitReached = galleryCount >= MAX_GALLERY_COUNT;
  const isLoadingMore = galleryStatus === "LoadingMore";

  // Actions & Mutations
  const generateImage = useAction(api.gallery.processImage);
  const addComment = useMutation(api.gallery.addComment);
  const addLike = useMutation(api.gallery.addLike);

  // Effect to open modal based on URL query parameter on initial load
  useEffect(() => {
    const imageIdFromUrl = searchParams.get("imageId");
    // Basic check: Ensure it's a non-empty string.
    // Convex IDs have a specific format, but a simple string check is likely sufficient here.
    if (imageIdFromUrl && typeof imageIdFromUrl === "string") {
      // Attempt to cast to Id<"gallery"> - This doesn't validate existence,
      // but sets the state to trigger modal logic.
      setModalImageId(imageIdFromUrl as Id<"gallery">);
    }
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once

  // Query to get the URL for the currently cycling loading image
  const loadingStorageId =
    isGenerating && galleryItems.length > 0
      ? galleryItems[loadingImageIndex % galleryItems.length]?.storageId // Use modulo and optional chaining
      : null;
  const loadingImageResult = useQuery(
    api.gallery.getImage,
    loadingStorageId ? { imageId: loadingStorageId } : "skip"
  );

  // Effect to cycle cooking words during generation
  useEffect(() => {
    let wordInterval: NodeJS.Timeout | undefined;
    if (isGenerating) {
      wordInterval = setInterval(() => {
        setCurrentWord((prev) => (prev + 1) % cookingWords.length);
      }, 2000); // Keep word cycle same
    }
    return () => clearInterval(wordInterval);
  }, [isGenerating]);

  // Effect to cycle through gallery images during generation
  useEffect(() => {
    let imageCycleInterval: NodeJS.Timeout | undefined;
    if (isGenerating && galleryItems.length > 0) {
      // Reset index when generation starts if gallery has items
      setLoadingImageIndex(0);
      imageCycleInterval = setInterval(() => {
        // Increment index, relying on modulo operator when accessing the array
        setLoadingImageIndex((prevIndex) => prevIndex + 1);
      }, 3000); // Change image every 3 seconds
    }
    return () => clearInterval(imageCycleInterval); // Clear interval on cleanup
  }, [isGenerating, galleryItems.length]); // Re-run if isGenerating or gallery length changes

  // Show greatness modal when limit is reached
  useEffect(() => {
    if (isLimitReached) {
      setShowGreatnessModal(true);
    }
  }, [isLimitReached]);

  // Effect to handle Escape key press for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showCommentModal) {
          setShowCommentModal(false);
        } else if (modalImageId) {
          setModalImageId(null);
          setModalImage(undefined); // Clear image state too
          // Optionally clear URL param: window.history.pushState({}, '', '/');
        } else if (showGreatnessModal) {
          setShowGreatnessModal(false);
        }
      }
    };

    // Add event listener only if a modal is open
    if (modalImageId || showCommentModal || showGreatnessModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalImageId, showCommentModal, showGreatnessModal]); // Re-run if any modal state changes

  const handleGenerateImage = async () => {
    if (!prompt || isLimitReached) return;
    setIsGenerating(true);
    try {
      const result = await generateImage({ prompt, style: selectedStyle });
      if (result?.galleryId) {
        setModalImageId(result.galleryId);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
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
    }
  };

  const handleLike = async () => {
    if (modalImageId) {
      await addLike({ galleryId: modalImageId });
    }
  };

  const handleOpenModal = (imageDoc: GalleryDoc) => {
    setModalImageId(imageDoc._id);
  };

  const handleCopy = () => {
    if (modalImageId) {
      const baseUrl = window.location.origin;
      const urlToCopy = `${baseUrl}/?imageId=${modalImageId}`;
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const modalImageResult = useQuery(
    api.gallery.getImage,
    modalImageId && modalImageData?.storageId ? { imageId: modalImageData.storageId } : "skip"
  );

  useEffect(() => {
    if (modalImageResult?.imageUrl) {
      setModalImage(modalImageResult.imageUrl);
    } else if (modalImageId && !modalImageResult?.imageUrl && modalImageData) {
      setModalImage(undefined);
    } else if (modalImageId && !modalImageData) {
      setModalImage(undefined);
    }
  }, [modalImageId, modalImageResult?.imageUrl, modalImageData]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Use the reusable Header component */}
      <Header galleryCount={galleryCount}>
        {/* Pass controls as children */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isLimitReached
              ? "1 million prompts reached!"
              : "Enter your prompt to generate an image."
          }
          // Responsive width: full on small, adjusts medium+, max large
          className="w-full sm:w-64 md:w-72 lg:w-96 px-4 py-2 focus:outline-none bg-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLimitReached}
        />
        {/* Inner group for select + button to ensure they stay together */}
        <div className="flex items-stretch gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            // Allow select to grow slightly on smallest screens if needed, but fixed otherwise
            className="flex-grow sm:flex-grow-0 px-4 py-2 bg-white rounded-lg shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLimitReached}>
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
            disabled={isGenerating || isLimitReached}
            // Adjust padding slightly on smaller screens if needed, keep text wrap prevention
            className="px-4 sm:px-6 py-2 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {isGenerating ? "Generating..." : "Add Yours"}
          </button>
        </div>
      </Header>

      <main className="flex-1 px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 mt-8">
          {galleryItems.map((imgDoc) => (
            <GalleryImageItem
              key={imgDoc._id.toString()}
              imageDoc={imgDoc}
              onClick={() => handleOpenModal(imgDoc)}
            />
          ))}
        </div>

        {galleryStatus === "CanLoadMore" && !isLimitReached && (
          <div className="text-center my-8">
            <button
              onClick={() => loadMore(1000)}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-[#EB2E2A] text-white rounded-lg hover:bg-[#cf2925] disabled:opacity-50">
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
        {galleryStatus === "Exhausted" && !isLimitReached && (
          <p className="text-center text-gray-500 my-8">No more images to load.</p>
        )}
      </main>

      {isGenerating && (
        <div className="fixed inset-0 bg-gray-100/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="text-center">
            {/* Conditional Image Display */}
            {loadingImageResult?.imageUrl ? (
              <img
                src={loadingImageResult.imageUrl}
                alt="Loading..."
                className="w-48 h-48 sm:w-64 sm:h-64 object-cover mx-auto mb-4 rounded-lg shadow-xl animate-pulse" // Adjusted styling
              />
            ) : (
              // Fallback spinner if no image or gallery is empty
              <svg
                className="w-16 h-16 text-gray-700 animate-spin mx-auto mb-4"
                viewBox="0 0 10870 10946">
                {/* SVG paths remain the same */}
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
            )}
            <div className="mt-4 text-black font-['Chakra_Petch'] font-bold text-lg">
              {cookingWords[currentWord]}
            </div>
          </div>
        </div>
      )}

      {modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-20"
              onClick={() => {
                setModalImageId(null);
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
              <div className="w-full h-[400px] bg-none border-2 border-[#EFEFEF] flex items-center justify-center mb-4 text-gray-500">
                Loading image...
              </div>
            )}
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
            <div className="flex items-center justify-center gap-6 mb-4">
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
                {modalImageData?.likes ?? 0}
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
                {modalImageData?.commentCount ?? (getComments ? getComments.length : 0)}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-gray-700 hover:text-green-600">
                <ExternalLink className="w-5 h-5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            {/* Call FooterContent without props */}
            <FooterContent />
          </div>
        </div>
      )}

      {showCommentModal && modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
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
                  <div key={comment._id?.toString() ?? i} className="mb-2 text-sm">
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

      {showGreatnessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-8 relative max-w-md w-full text-center">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
              onClick={() => setShowGreatnessModal(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-semibold mb-4 font-['Chakra_Petch']">Thank you!</h3>
            <p className="text-gray-700">We've officially achieved internet greatness.</p>
          </div>
        </div>
      )}

      <footer className="mt-auto">
        {/* Call FooterContent without props */}
        <FooterContent />
      </footer>
    </div>
  );
}

export default Home;
