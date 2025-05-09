import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  CSSProperties,
  LegacyRef,
  RefObject,
  Ref,
  useCallback,
} from "react";
import { useAction, useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ExternalLink, Download, Link as LinkIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import FooterContent from "./components/FooterContent";
import Header from "./components/Header";
import { Dialog, Transition } from "@headlessui/react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import { useSwipeable } from "react-swipeable";

// Add type declarations for Cloudflare Turnstile
declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          // Add other options as needed from Turnstile documentation
        }
      ) => string | undefined; // render returns a widgetId or undefined
      remove: (widgetIdOrContainer: string | HTMLElement) => void;
      reset: (widgetIdOrContainer: string | HTMLElement) => void;
    };
    onloadTurnstileCallback: () => void;
  }
}

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
  aiResponse?: string;
  likes: number;
  commentCount?: number;
  authorName?: string;
  authorSocialLink?: string;
  authorEmail?: string;
  isHighlighted?: boolean;
  customMessage?: string;
}

// New component to render a single gallery image start
interface GalleryImageItemProps {
  imageDoc: GalleryDoc | null;
  style: CSSProperties;
  onClick: (imageDoc: GalleryDoc) => void;
}

function GalleryImageItem({ imageDoc, style, onClick }: GalleryImageItemProps) {
  const imageResult = useQuery(
    api.gallery.getImage,
    imageDoc ? { imageId: imageDoc.storageId } : "skip"
  );

  if (!imageDoc) {
    return (
      <div style={style} className="p-0.5">
        <div className="w-full h-full bg-gray-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div style={style} className="p-0.5">
      <div
        className={`aspect-square cursor-pointer bg-gray-200 border border-gray-300 overflow-hidden w-full h-full ${imageDoc?.isHighlighted ? "ring-2 ring-[#EB2E2A] border-8 border-red-600 ring-inset" : ""}`}
        onClick={() => onClick(imageDoc!)}>
        {imageResult?.imageUrl ? (
          <img
            src={imageResult.imageUrl}
            alt={imageDoc.prompt || "Gallery image"}
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 animate-pulse"></div>
        )}
      </div>
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
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showGreatnessModal, setShowGreatnessModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [loadingImageIndex, setLoadingImageIndex] = useState(0);
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [authorSocialLinkInput, setAuthorSocialLinkInput] = useState("");
  const [authorEmailInput, setAuthorEmailInput] = useState("");
  const [columnCount, setColumnCount] = useState(10);
  const infiniteLoaderRef = useRef<typeof InfiniteLoader | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null); // New state for Turnstile token
  const turnstileWidgetRef = useRef<HTMLDivElement>(null); // Ref for the Turnstile widget container

  // Queries
  const {
    results: galleryItems,
    status: galleryStatus,
    loadMore,
  } = usePaginatedQuery(api.gallery.listGallery, {}, { initialNumItems: 200 });
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const getComments = useQuery(
    api.gallery.getComments,
    modalImageId ? { galleryId: modalImageId } : "skip"
  );
  const modalImageData = modalImageId
    ? galleryItems.find((img): img is GalleryDoc => img._id === modalImageId)
    : null;

  const isLimitReached = galleryCount >= MAX_GALLERY_COUNT;
  const isLoadingMore = galleryStatus === "LoadingMore";
  const canLoadMore = galleryStatus === "CanLoadMore";

  // Actions & Mutations
  const generateImage = useAction(api.gallery.processImage);
  const addComment = useMutation(api.gallery.addComment);
  const addLike = useMutation(api.gallery.addLike);
  const saveAuthorInfo = useMutation(api.gallery.addAuthorInfo);

  // --- New: Queries for next/previous images in modal ---
  const prevImageDataResult = useQuery(
    api.gallery.getAdjacentGalleryImage,
    modalImageId ? { currentImageId: modalImageId, direction: "previous" } : "skip"
  );
  const nextImageDataResult = useQuery(
    api.gallery.getAdjacentGalleryImage,
    modalImageId ? { currentImageId: modalImageId, direction: "next" } : "skip"
  );
  // --- End: New Queries ---

  // --- Wrapped navigation handlers in useCallback for useEffect dependency array ---
  const navigateToImage = useCallback((newImageId: Id<"gallery"> | null | undefined) => {
    if (newImageId) {
      setModalImageId(newImageId);
      setAuthorNameInput("");
      setAuthorSocialLinkInput("");
      setAuthorEmailInput("");
    }
  }, []); // No external dependencies other than setters, so empty array is fine

  const handlePreviousImage = useCallback(() => {
    if (prevImageDataResult?._id) {
      navigateToImage(prevImageDataResult._id);
    }
  }, [prevImageDataResult, navigateToImage]);

  const handleNextImage = useCallback(() => {
    if (nextImageDataResult?._id) {
      navigateToImage(nextImageDataResult._id);
    }
  }, [nextImageDataResult, navigateToImage]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePreviousImage(),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });
  // --- End: Wrapped navigation handlers ---

  // Effect to open modal based on URL query parameter on initial load
  useEffect(() => {
    const imageIdFromUrl = searchParams.get("imageId");
    if (imageIdFromUrl && typeof imageIdFromUrl === "string") {
      setModalImageId(imageIdFromUrl as Id<"gallery">);
    }
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once

  // Query to get the URL for the currently cycling loading image
  const loadingStorageId =
    isGenerating && galleryItems.length > 0
      ? galleryItems[loadingImageIndex % galleryItems.length]?.storageId
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
          // setModalImage(undefined); // Clear image state too (modalImage state removed)
          // Optionally clear URL param: window.history.pushState({}, '', '/');
        } else if (showGreatnessModal) {
          setShowGreatnessModal(false);
        }
      } else if (modalImageId) {
        // Only handle arrow keys if modal is open
        if (event.key === "ArrowLeft") {
          handlePreviousImage();
        }
        if (event.key === "ArrowRight") {
          handleNextImage();
        }
      }
    };

    // Add event listener only if a modal is open or for general escape handling
    if (modalImageId || showCommentModal || showGreatnessModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalImageId, showCommentModal, showGreatnessModal, handlePreviousImage, handleNextImage]); // Added handlePreviousImage and handleNextImage to dependencies

  // Effect for Cloudflare Turnstile
  useEffect(() => {
    if (turnstileWidgetRef.current && !isLimitReached) {
      // Only render if not limit reached
      const scriptId = "cf-turnstile-script";
      let widgetId: string | undefined;

      const renderWidget = () => {
        if (
          turnstileWidgetRef.current &&
          window.turnstile &&
          !turnstileWidgetRef.current.innerHTML
        ) {
          widgetId = window.turnstile.render(turnstileWidgetRef.current, {
            sitekey: "0x4AAAAAABPtvtoxSb2wsHA6", // REPLACE with your actual sitekey cLOUDFLARE TURNSTILE YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY
            callback: function (token) {
              setTurnstileToken(token);
            },
            "error-callback": function () {
              console.error("Turnstile error: Challenge failed to render or execute.");
              setTurnstileToken(null); // Ensure token is null on error
            },
            theme: "light", // Or 'dark', or 'auto'
            // Managed (often invisible) is the default if not specified otherwise
          });
        }
      };

      if (document.getElementById(scriptId)) {
        renderWidget();
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
        script.async = true;
        script.defer = true;

        (window as any).onloadTurnstileCallback = function () {
          renderWidget();
        };
        document.head.appendChild(script);
      }

      return () => {
        // Clean up widget if component unmounts
        if (widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        if (turnstileWidgetRef.current) {
          turnstileWidgetRef.current.innerHTML = ""; // Clear container
        }
        // Script can be left as it might be used by other instances,
        // or managed more globally if multiple Turnstile widgets are on a page.
      };
    }
  }, [isLimitReached]); // Re-run if limit is reached to potentially remove/hide widget

  const handleGenerateImage = async () => {
    if (!prompt || isLimitReached || isGenerating || !turnstileToken) return; // Add !turnstileToken check
    setIsGenerating(true);
    try {
      // Pass the turnstileToken to the action
      const result = await generateImage({ prompt, style: selectedStyle, turnstileToken });
      if (result?.galleryId) {
        setModalImageId(result.galleryId);
        setAuthorNameInput("");
        setAuthorSocialLinkInput("");
        setAuthorEmailInput("");
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission (page reload)
    handleGenerateImage(); // Call the existing image generation logic
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

  const handleDownload = async () => {
    if (!modalImageResult?.imageUrl || !modalImageData) return;

    try {
      const response = await fetch(modalImageResult.imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      // Create a simple filename based on prompt or ID
      const filename = `${modalImageData.prompt.replace(/\s+/g, "_").substring(0, 20) || modalImageData._id}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl); // Clean up the blob URL
    } catch (error) {
      console.error("Error downloading image:", error);
      // Optionally show an error message to the user
    }
  };

  const handleOpenModal = (imageDoc: GalleryDoc) => {
    setModalImageId(imageDoc._id);
    setAuthorNameInput("");
    setAuthorSocialLinkInput("");
    setAuthorEmailInput("");
  };

  const handleCloseModal = () => {
    setModalImageId(null);
    // setModalImage(undefined); // modalImage state removed
    setShowCommentModal(false);
    setAuthorNameInput("");
    setAuthorSocialLinkInput("");
    setAuthorEmailInput("");
  };

  const handleSaveAuthorInfo = async () => {
    if (!modalImageId || !authorNameInput) return;
    try {
      await saveAuthorInfo({
        galleryId: modalImageId,
        authorName: authorNameInput,
        authorSocialLink: authorSocialLinkInput || undefined,
        authorEmail: authorEmailInput || undefined,
      });
    } catch (error) {
      console.error("Error saving author info:", error);
    }
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

  // Removed useEffect for setModalImage as modalImage state itself is removed.
  // The modal will directly use modalImageResult.imageUrl or a placeholder.

  // Calculate total number of items (or a placeholder if count is loading)
  const totalItems = galleryCount ?? galleryItems.length + (canLoadMore ? 1 : 0);

  // Function required by InfiniteLoader to check if an item is loaded
  const isItemLoaded = (index: number) => !canLoadMore || index < galleryItems.length;

  // Function required by InfiniteLoader to load more items
  const loadMoreItems = isLoadingMore
    ? () => Promise.resolve() // Do nothing if already loading
    : () => {
        console.log("Attempting to load more items...");
        loadMore(100); // Load next 100 items (adjust batch size as needed)
        return Promise.resolve(); // Return a promise for InfiniteLoader
      };

  // --- Recalculate columns based on window width ---
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) return 10; // xl
      if (width >= 1024) return 8; // lg
      if (width >= 768) return 6; // md
      if (width >= 640) return 4; // sm
      return 2; // xs
    };

    const handleResize = () => {
      setColumnCount(calculateColumns());
      // Reset cached item sizes in InfiniteLoader if columns change
      if (infiniteLoaderRef.current) {
        infiniteLoaderRef.current.resetloadMoreItemsCache();
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // --- End column calculation ---

  // Effect to reset infinite loader cache if items change drastically (e.g., new generation)
  useEffect(() => {
    if (infiniteLoaderRef.current) {
      infiniteLoaderRef.current.resetloadMoreItemsCache();
    }
  }, [galleryItems.length]); // Reset when the number of loaded items changes

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Use the reusable Header component */}
      <Header galleryCount={galleryCount}>
        {/* Wrap controls in a form */}
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-4 w-full sm:w-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              isLimitReached
                ? "1 million prompts reached!"
                : "Enter your prompt, select a style, and click Add Yours"
            }
            // Responsive width: full on small, adjusts medium+, max large
            className="w-full sm:w-64 md:w-72 lg:w-96 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] bg-white rounded-lg shadow-sm disabled:opacity-50 placeholder:text-gray-700 placeholder:text-xs disabled:cursor-not-allowed"
            disabled={isLimitReached || isGenerating}
          />
          {/* Inner group for select + button remains conceptually the same */}
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            // Allow select to grow slightly on smallest screens if needed, but fixed otherwise
            className="flex-grow sm:flex-grow-0 px-4 py-2 bg-white rounded-lg shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLimitReached || isGenerating}>
            {/* New Options Start */}
            <option value="Studio Laika">Studio Laika</option>
            <option value="3dsoft">3D Soft</option>
            <option value="Ghibli">Ghibli</option>
            <option value="80s Anime">80s Anime</option>
            <option value="T206 Vintage">T206 Vintage</option>
            <option value="futuristic">Futuristic</option>
            <option value="b&w">B&W</option>
            <option value="photorealistic portrait">Photorealistic Portrait</option>
            <option value="realism">Realism</option>
            <option value="immersive photo-real">Immersive Photo-Real</option>
            <option value="lifestyle realism">Lifestyle Realism</option>
            <option value="thermal silhouette">Thermal Silhouette</option>
            <option value="knitted toy">Knitted Toy</option>
            <option value="sticker">Sticker</option>
            <option value="low poly">Low Poly</option>
            <option value="marvel">Marvel</option>
            <option value="retro anime">Retro Anime</option>
            <option value="pop art">Pop Art</option>
            <option value="oil on canvas">Oil on Canvas</option>
            <option value="pixar">Pixar</option>
            <option value="caricature">Caricature</option>
            <option value="convex">Convex</option>
            <option value="ai founder">AI Founder</option>
            <option value="VC Mode Edition">VC Mode</option>
            <option value="Infra Bro Mode">Infra Bro</option> {/* Adjusted display name */}
            <option value="Founder Hacker Card">Founder Hacker</option>
            <option value="pixel art">Pixel Art</option>
            {/* New Options End */}
          </select>
          {/* Add the Turnstile widget container here, ensure it doesn't break flex layout */}
          {!isLimitReached && (
            <div
              ref={turnstileWidgetRef}
              className="turnstile-container sm:mx-2 flex items-center justify-center min-h-[1px] min-w-[00px]"></div>
          )}
          <button
            type="submit"
            onClick={handleGenerateImage}
            disabled={isGenerating || isLimitReached || !prompt || !turnstileToken} // Added !turnstileToken
            // Adjust padding slightly on smaller screens if needed, keep text wrap prevention
            className="px-4 sm:px-6 py-2 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {isGenerating ? "Generating..." : "Add Yours"}
          </button>
        </form>
      </Header>

      <main className="flex-1 px-6 flex flex-col pt-2">
        <AutoSizer>
          {({ height, width }) => {
            if (width === 0 || height === 0) {
              return null;
            }
            const calculatedColumnCount = columnCount;
            const columnWidth = Math.floor(width / calculatedColumnCount);
            const rowHeight = columnWidth;
            const rowCount = Math.ceil(totalItems / calculatedColumnCount);

            return (
              <InfiniteLoader
                ref={infiniteLoaderRef}
                isItemLoaded={isItemLoaded}
                itemCount={totalItems}
                loadMoreItems={loadMoreItems}
                threshold={5}>
                {({
                  onItemsRendered,
                  ref,
                }: {
                  onItemsRendered: (props: any) => any;
                  ref: Ref<any>;
                }) => (
                  <Grid
                    className="grid-container"
                    columnCount={calculatedColumnCount}
                    columnWidth={columnWidth}
                    height={height}
                    rowCount={rowCount}
                    rowHeight={rowHeight}
                    width={width}
                    itemData={{
                      items: galleryItems,
                      columnCount: calculatedColumnCount,
                      handleOpenModal,
                    }}
                    onItemsRendered={({
                      visibleRowStartIndex,
                      visibleRowStopIndex,
                      overscanRowStartIndex,
                      overscanRowStopIndex,
                    }) => {
                      onItemsRendered({
                        overscanStartIndex: overscanRowStartIndex * calculatedColumnCount,
                        overscanStopIndex: overscanRowStopIndex * calculatedColumnCount,
                        visibleStartIndex: visibleRowStartIndex * calculatedColumnCount,
                        visibleStopIndex: visibleRowStopIndex * calculatedColumnCount,
                      });
                    }}
                    ref={ref}>
                    {GridItem}
                  </Grid>
                )}
              </InfiniteLoader>
            );
          }}
        </AutoSizer>
        {isLoadingMore && <p className="text-center text-gray-500 my-4">Loading more...</p>}
      </main>

      {isGenerating && (
        <div className="fixed inset-0 bg-gray-100/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="text-center">
            {loadingImageResult?.imageUrl ? (
              <img
                src={loadingImageResult.imageUrl}
                alt="Loading..."
                className="w-48 h-48 sm:w-64 sm:h-64 object-cover mx-auto mb-4 rounded-lg shadow-xl animate-pulse"
              />
            ) : (
              <svg
                className="w-16 h-16 text-gray-700 animate-spin mx-auto mb-4"
                viewBox="0 0 10870 10946">
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

      {modalImageId && modalImageData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            {...swipeHandlers}
            className={`bg-white rounded-lg p-6 relative max-w-lg w-full max-h-[90vh] overflow-y-auto ${modalImageData?.isHighlighted ? "ring-2 ring-[#EB2E2A] ring-offset-2" : ""}`}>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-[60]"
              onClick={handleCloseModal}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="relative group">
              {modalImageResult?.imageUrl ? (
                <img
                  src={modalImageResult.imageUrl}
                  alt={modalImageData?.prompt || "Modal image"}
                  className="w-full h-auto max-h-[60vh] object-contain mb-4 cursor-pointer"
                  onClick={handleDownload}
                />
              ) : (
                <div className="w-full h-[400px] bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 text-gray-500">
                  Loading image...
                </div>
              )}
              {prevImageDataResult && (
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-0 top-1/2 -translate-y-1/2 transform bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Previous image"
                  style={{ marginLeft: "-20px" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
              )}
              {nextImageDataResult && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-0 top-1/2 -translate-y-1/2 transform bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Next image"
                  style={{ marginRight: "-20px" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              )}
            </div>

            {modalImageData && (
              <div className="mb-4 text-sm">
                {modalImageData.customMessage && (
                  <div className="mb-3 p-3 bg-red-600 text-white rounded-md text-sm">
                    <p>
                      <strong>Admin Message:</strong> {modalImageData.customMessage}
                    </p>
                  </div>
                )}
                <p>
                  <strong>Prompt:</strong> {modalImageData.prompt}
                </p>
                <p>
                  <strong>Style:</strong> {modalImageData.style}
                </p>
                {modalImageData.authorName && (
                  <p>
                    <strong>Author:</strong> {modalImageData.authorName}
                    {modalImageData.authorSocialLink && (
                      <a
                        href={modalImageData.authorSocialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={modalImageData.authorSocialLink}
                        className="ml-1.5 text-blue-600 hover:text-blue-800 inline-flex items-center">
                        <LinkIcon size={14} className="mr-0.5" />
                        Link
                      </a>
                    )}
                  </p>
                )}
                {!modalImageData.authorName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Add author details (one time):</p>
                    <input
                      type="text"
                      placeholder="Author Name *"
                      value={authorNameInput}
                      onChange={(e) => setAuthorNameInput(e.target.value)}
                      className="w-full mb-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] focus:border-[#2a2a2a]"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Social Profile Link (Optional)"
                      value={authorSocialLinkInput}
                      onChange={(e) => setAuthorSocialLinkInput(e.target.value)}
                      className="w-full mb-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] focus:border-[#2a2a2a]"
                    />
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={authorEmailInput}
                      onChange={(e) => setAuthorEmailInput(e.target.value)}
                      className="w-full mb-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] focus:border-[#2a2a2a]"
                    />
                    <p className="text-xs text-gray-500 mb-2">
                      Opt in for updates and to be notified if you're a winner.
                    </p>
                    <button
                      onClick={handleSaveAuthorInfo}
                      disabled={!authorNameInput}
                      className="w-full px-4 py-1.5 bg-[#EB2E2A] text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#cf2925]">
                      Save Author Info
                    </button>
                  </div>
                )}
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
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-gray-700 hover:text-purple-600">
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
            <FooterContent
              hideDashboardLink={true}
              showReportLink={true}
              galleryId={modalImageData?._id}
              prompt={modalImageData?.prompt}
              style={modalImageData?.style}
            />
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
        <FooterContent />
      </footer>
    </div>
  );
}

const GridItem = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<{
  items: GalleryDoc[];
  columnCount: number;
  handleOpenModal: (imageDoc: GalleryDoc) => void;
}>) => {
  const { items, columnCount, handleOpenModal } = data;
  const index = rowIndex * columnCount + columnIndex;

  const imageDoc = items[index] ?? null;

  return <GalleryImageItem imageDoc={imageDoc} style={style} onClick={handleOpenModal} />;
};

export default Home;
