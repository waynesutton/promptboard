import React, { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import Header from "./components/Header";
import FooterContent from "./components/FooterContent";
import { Dialog, Transition } from "@headlessui/react";
import { ExternalLink, Download, Link as LinkIcon } from "lucide-react";

// Define type for search results (directly from query)
// The _score field is no longer present with FTS query results
type SearchResultItem = Doc<"gallery">;

// Define type for a single gallery document
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
  clicks?: number;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Modal State (similar to Home.tsx)
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [modalImage, setModalImage] = useState<string | undefined>();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);
  const [authorNameInput, setAuthorNameInput] = useState(""); // For modal author input
  const [authorSocialLinkInput, setAuthorSocialLinkInput] = useState(""); // For modal author input

  const results = useQuery(
    api.gallery.searchCombined,
    // Pass query only if it's not empty, otherwise skip query
    initialQuery ? { searchQuery: initialQuery } : "skip"
  );
  const isLoading = results === undefined; // Loading state based on useQuery result

  const galleryCount = useQuery(api.gallery.getGalleryCount) || 0;

  // --- Modal Data Fetching & Logic (Adopted from Home.tsx) ---
  const modalImageData =
    modalImageId && results ? results.find((img) => img._id === modalImageId) : null;
  const getComments = useQuery(
    api.gallery.getComments,
    modalImageId ? { galleryId: modalImageId } : "skip"
  );
  const addComment = useMutation(api.gallery.addComment);
  const addLike = useMutation(api.gallery.addLike);
  const saveAuthorInfo = useMutation(api.gallery.addAuthorInfo);
  const modalImageResult = useQuery(
    api.gallery.getImage,
    modalImageId && modalImageData?.storageId ? { imageId: modalImageData.storageId } : "skip"
  );

  useEffect(() => {
    if (modalImageResult?.imageUrl) {
      setModalImage(modalImageResult.imageUrl);
    } else {
      setModalImage(undefined); // Clear if no result or no modal
    }
  }, [modalImageResult?.imageUrl, modalImageId]);

  // Effect to handle Escape key press for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showCommentModal) {
          setShowCommentModal(false);
        } else if (modalImageId) {
          handleCloseModal();
        }
      }
    };
    if (modalImageId || showCommentModal) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalImageId, showCommentModal]);

  // --- Update useEffect to sync input state only ---
  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    setSearchQuery(queryFromUrl); // Sync input field with URL
    // No need to call executeSearch here, useQuery handles data fetching
  }, [searchParams]);

  // Form submission updates URL, triggering useQuery update
  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ q: searchQuery });
  };

  // --- Modal Handlers (Adopted from Home.tsx) ---
  const handleOpenModal = (imageDoc: SearchResultItem) => {
    setModalImageId(imageDoc._id);
    setAuthorNameInput(""); // Reset author inputs when opening
    setAuthorSocialLinkInput("");
  };

  const handleCloseModal = () => {
    setModalImageId(null);
    setModalImage(undefined);
    setShowCommentModal(false);
    setAuthorNameInput("");
    setAuthorSocialLinkInput("");
  };

  const handleAddComment = async () => {
    if (modalImageId && userName && newComment) {
      await addComment({ galleryId: modalImageId, userName, text: newComment });
      setNewComment("");
      // Note: Comments won't auto-refresh in modal without re-querying getComments
    }
  };

  const handleLike = async () => {
    if (modalImageId) {
      await addLike({ galleryId: modalImageId });
      // Note: Like count won't auto-refresh in modal without re-fetching result data
    }
  };

  const handleDownload = async () => {
    if (!modalImage || !modalImageData) return;
    try {
      const response = await fetch(modalImage);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = `${modalImageData.prompt.replace(/\s+/g, "_").substring(0, 20) || modalImageData._id}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleCopy = () => {
    if (modalImageId) {
      const baseUrl = window.location.origin;
      const urlToCopy = `${baseUrl}/?imageId=${modalImageId}`; // Point to home page modal link
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAuthorInfo = async () => {
    if (!modalImageId || !authorNameInput) return;
    try {
      await saveAuthorInfo({
        galleryId: modalImageId,
        authorName: authorNameInput,
        authorSocialLink: authorSocialLinkInput || undefined,
      });
      // Note: Author info won't auto-refresh in modal without re-fetching
    } catch (error) {
      console.error("Error saving author info:", error);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Reuse Header, pass gallery count but no controls */}
      <Header galleryCount={galleryCount} />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-6 text-center">Search Gallery</h2>

        {/* Search Bar (Form handler triggers URL change, onChange updates URL too) */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-8">
          <input
            type="search"
            value={searchQuery} // Controlled input
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchQuery(newValue); // Update local state
              // Update URL immediately on change for realtime clearing
              setSearchParams({ q: newValue }, { replace: true }); // Use replace to avoid history clutter
            }}
            placeholder="Search prompts, comments, authors..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            // Disable button only if search input is empty
            disabled={!searchQuery.trim()}
            className="px-6 py-2 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#cf2925]">
            Search
          </button>
        </form>

        {/* Loading State */}
        {isLoading && <p className="text-center text-gray-500">Loading results...</p>}

        {/* Error Message */}
        {/* {error && <p className="text-center text-red-600">Error: {error}</p>} */}

        {/* Results */}
        {!isLoading && results && results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Results ({results.length})</h3>
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white shadow-sm">
              {results.map((item) => (
                <li key={item._id} className="p-4 hover:bg-gray-50">
                  <button onClick={() => handleOpenModal(item)} className="text-left w-full">
                    <p className="font-semibold text-blue-600 hover:underline">{item.prompt}</p>
                    <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Style: {item.style}</span>
                      {item.authorName && <span>Author: {item.authorName}</span>}
                      <span>Likes: {item.likes}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && results && results.length === 0 && initialQuery && (
          <p className="text-center text-gray-500">No results found for "{initialQuery}".</p>
        )}
        {!isLoading && results && results.length === 0 && !initialQuery && (
          <p className="text-center text-gray-500">Enter a search term above.</p>
        )}
      </main>

      {/* --- Modal Rendering (Adopted from Home.tsx) --- */}
      {modalImageId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black z-20"
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
            {modalImage ? (
              <img
                src={modalImage}
                alt={modalImageData?.prompt || "Modal image"}
                className="w-full h-auto max-h-[60vh] object-contain mb-4 cursor-pointer"
                onClick={handleDownload}
              />
            ) : (
              <div className="w-full h-[400px] bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 text-gray-500">
                Loading image...
              </div>
            )}
            {/* Prompt, Style, Author */}
            {modalImageData && (
              <div className="mb-4 text-sm">
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
                {/* Add Author Form if not present */}
                {!modalImageData.authorName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Add author details (one time):</p>
                    <input
                      type="text"
                      placeholder="Author Name *"
                      value={authorNameInput}
                      onChange={(e) => setAuthorNameInput(e.target.value)}
                      className="w-full mb-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Social Profile Link (Optional)"
                      value={authorSocialLinkInput}
                      onChange={(e) => setAuthorSocialLinkInput(e.target.value)}
                      className="w-full mb-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
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
            {/* Like/Comment/Share/Download Buttons */}
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
            {/* Modal Footer */}
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
      {/* Comment Modal */}
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

      {/* Reuse Footer */}
      <footer className="mt-auto">
        <FooterContent />
      </footer>
    </div>
  );
}

export default SearchPage;
