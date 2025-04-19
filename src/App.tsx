import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const CHEF_LOGO_ID = "kg23gffcphmwpmp6sba280zphs7dyxsa";
const cookingWords = ["baking", "boiling", "grilling", "roasting", "frying", "sauteing", "steaming", "broiling", "chopping", "mixing", "whisking", "stirring", "blending", "measuring", "seasoning", "marinating", "preheating", "peeling", "slicing", "dicing", "mincing", "simmering", "poaching", "glazing", "caramelizing", "reducing", "kneading", "folding", "greasing", "sifting", "cracking", "spreading", "layering", "toasting", "skewering", "drizzling", "serving", "plating", "garnishing", "flipping", "tossing", "braising", "grating", "infusing", "chilling", "reheating", "pureeing", "melting", "searing", "rubbing"];

interface GalleryImage {
  _id: Id<"gallery">;
  storageId: Id<"_storage">;
  style: string;
  prompt: string;
  aiResponse: string;
  likes: number;
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
  const listGallery = useQuery(api.gallery.listGallery) || [];
  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;
  const getChefLogo = useQuery(api.gallery.getImage, { imageId: CHEF_LOGO_ID as Id<"_storage"> });
  const getComments = modalImageId ? useQuery(api.gallery.getComments, { galleryId: modalImageId }) || [] : [];

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
      if (result?.storageId) {
        const imageResult = await useQuery(api.gallery.getImage, { imageId: result.storageId });
        if (imageResult?.imageUrl) {
          setModalImage(imageResult.imageUrl);
        }
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
    }
  };

  const handleLike = async () => {
    if (modalImageId) {
      await addLike({ galleryId: modalImageId });
    }
  };

  const handleCopy = () => {
    if (modalImageId) {
      navigator.clipboard.writeText(modalImageId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="font-['Chakra_Petch'] font-light text-[32px] text-[#0F0F0F]">
          1 million prompts
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-['Chakra_Petch'] font-light text-lg text-[#6B7280]">
            {galleryCount.toLocaleString('en-US', {minimumIntegerDigits: 7, useGrouping: true})}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <div className="flex items-center gap-4 mb-8">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            className="flex-1 px-4 py-2 bg-white rounded-lg shadow-sm"
          />
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm"
          >
            <option value="Studio Laika">Studio Laika</option>
            <option value="3dsoft">3D Soft</option>
            <option value="Ghibli">Ghibli</option>
            <option value="80s Anime">80s Anime</option>
            <option value="T206 Vintage">T206 Vintage</option>
            <option value="futuristic">Futuristic</option>
            <option value="b&w">B&W</option>
          </select>
          <button
            onClick={handleGenerateImage}
            disabled={isLoading}
            className="px-6 py-2 bg-[#EB2E2A] text-white rounded-lg"
          >
            Generate
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-20 gap-0">
          {listGallery.map((img: GalleryImage) => {
            const imageResult = useQuery(api.gallery.getImage, { imageId: img.storageId });
            return (
              <div
                key={img._id}
                className="aspect-square cursor-pointer"
                onClick={() => {
                  if (imageResult?.imageUrl) {
                    setModalImage(imageResult.imageUrl);
                    setModalImageId(img._id);
                  }
                }}
              >
                {imageResult?.imageUrl && (
                  <img
                    src={imageResult.imageUrl}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="text-center">
            <svg className="w-16 h-16 text-white animate-spin mx-auto" viewBox="0 0 10870 10946">
              <path d="M6868.76 8627.42C8487.29 8450.74 10013.2 7603.18 10853.3 6188.51C10455.5 9687.49 6562.35 11899.1 3384.6 10541.2C3091.79 10416.4 2839.74 10208.9 2666.77 9942.01C1952.64 8839.93 1717.89 7437.62 2055.19 6165.03C3018.89 7799.62 4978.42 8801.63 6868.76 8627.42Z" fill="#F3B01C"/>
              <path d="M1995.82 5138.31C1339.76 6628.34 1311.35 8372.89 2115.67 9808.56C-714.901 7715.6 -684.013 3236.85 2081.07 1164.89C2336.83 973.381 2640.76 859.713 2959.53 842.416C4270.41 774.462 5602.3 1272.38 6536.35 2200.25C4638.6 2218.78 2790.26 3413.53 1995.82 5138.31Z" fill="#8D2676"/>
              <path d="M7451.92 2658.62C6494.39 1346.5 4995.71 453.219 3353.71 426.038C6527.75 -989.865 10432 1305.73 10857 4699.69C10896.5 5014.75 10844.6 5335.98 10702.6 5620.15C10109.5 6803.78 9009.91 7721.77 7724.97 8061.53C8666.43 6345.4 8550.29 4248.73 7451.92 2658.62Z" fill="#EE342F"/>
            </svg>
            <div className="mt-4 text-white font-['Chakra_Petch']">
              {cookingWords[currentWord]}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {modalImage && modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => {
                setModalImage(undefined);
                setModalImageId(null);
                setShowCommentModal(false);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={modalImage} alt="Large" className="w-[400px] h-[400px] object-cover" />
            <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={handleLike} className="flex items-center gap-1 text-[#EB2E2A]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {listGallery.find(img => img._id === modalImageId)?.likes || 0}
              </button>
              <button
                onClick={() => setShowCommentModal(true)}
                className="flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {getComments.length}
              </button>
              <button onClick={handleCopy} className="flex items-center gap-1">
                {copied ? (
                  "Copied!"
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <div className="max-h-[300px] overflow-y-auto mb-4">
              {getComments.map((comment, i) => (
                <div key={i} className="mb-2">
                  <strong>{comment.userName}:</strong> {comment.text}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <button
              onClick={handleAddComment}
              className="w-full px-4 py-2 bg-[#EB2E2A] text-white rounded"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-8">
        <div className="text-sm text-[#6B7280]">Cooked on Chef</div>
        {getChefLogo?.imageUrl && (
          <a href="https://chef.convex.dev" target="_blank" rel="noopener noreferrer">
            <img src={getChefLogo.imageUrl} alt="Chef Logo" className="h-8 mx-auto mt-2" />
          </a>
        )}
      </footer>
    </div>
  );
}

export default App;
