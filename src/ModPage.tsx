import React, { useState, useEffect, FormEvent, Fragment } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import Header from "./components/Header";
import FooterContent from "./components/FooterContent";
import { Dialog, Transition } from "@headlessui/react";
import {
  ExternalLink,
  Download,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Trash2,
  Star,
  ShieldAlert,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";

// Extended gallery doc type for moderation page
type ModGalleryDoc = Doc<"gallery"> & {
  isHighlighted?: boolean;
  isHidden?: boolean;
  customMessage?: string;
};

function ModPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Modal State
  const [modalImageId, setModalImageId] = useState<Id<"gallery"> | null>(null);
  const [modalImage, setModalImage] = useState<string | undefined>();
  const [currentModalDoc, setCurrentModalDoc] = useState<ModGalleryDoc | null>(null);
  const [customMessageInput, setCustomMessageInput] = useState("");

  // Determine if the user is an admin
  const isAdmin =
    isSignedIn &&
    (user?.organizationMemberships?.some((mem) => mem.role === "admin") ||
      user?.publicMetadata?.role === "admin");

  // --- Data Fetching ---
  const results = useQuery(
    api.gallery.searchCombined,
    isAdmin && initialQuery ? { searchQuery: initialQuery } : isAdmin ? { searchQuery: "" } : "skip"
  );
  const isLoading = isAdmin && results === undefined;
  const galleryCount = useQuery(api.gallery.getGalleryCount, isAdmin ? {} : "skip") || 0;

  // --- Mutations ---
  const deleteImageMutation = useMutation(api.gallery.deleteImage);
  const toggleHideImageMutation = useMutation(api.gallery.toggleHideImage);
  const toggleHighlightImageMutation = useMutation(api.gallery.toggleHighlightImage);
  const addOrUpdateCustomMessageMutation = useMutation(api.gallery.addOrUpdateCustomMessage);
  const getComments = useQuery(
    api.gallery.getComments,
    modalImageId ? { galleryId: modalImageId } : "skip"
  );
  const modalImageResult = useQuery(
    api.gallery.getImage,
    isAdmin && modalImageId && currentModalDoc?.storageId
      ? { imageId: currentModalDoc.storageId }
      : "skip"
  );

  useEffect(() => {
    if (modalImageResult?.imageUrl) {
      setModalImage(modalImageResult.imageUrl);
    } else {
      setModalImage(undefined);
    }
  }, [modalImageResult?.imageUrl, modalImageId]);

  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    setSearchQuery(queryFromUrl);
  }, [searchParams]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ q: searchQuery });
  };

  const handleOpenModal = (imageDoc: ModGalleryDoc) => {
    setModalImageId(imageDoc._id);
    setCurrentModalDoc(imageDoc);
    setCustomMessageInput(imageDoc.customMessage || "");
  };

  const handleCloseModal = () => {
    setModalImageId(null);
    setModalImage(undefined);
    setCurrentModalDoc(null);
    setCustomMessageInput("");
  };

  const handleDelete = async () => {
    if (!isAdmin || !modalImageId) return;
    if (window.confirm("Are you sure you want to permanently delete this image?")) {
      try {
        await deleteImageMutation({ galleryId: modalImageId });
        handleCloseModal();
      } catch (error) {
        console.error("Failed to delete image:", error);
        alert("Error deleting image. See console for details.");
      }
    }
  };

  const handleToggleHide = async () => {
    if (!isAdmin || !modalImageId) return;
    try {
      await toggleHideImageMutation({ galleryId: modalImageId });
      if (currentModalDoc) {
        setCurrentModalDoc((prev) => (prev ? { ...prev, isHidden: !prev.isHidden } : null));
      }
    } catch (error) {
      console.error("Failed to toggle hide image:", error);
      alert("Error hiding image. See console for details.");
    }
  };

  const handleToggleHighlight = async () => {
    if (!isAdmin || !modalImageId) return;
    try {
      await toggleHighlightImageMutation({ galleryId: modalImageId });
      if (currentModalDoc) {
        setCurrentModalDoc((prev) =>
          prev ? { ...prev, isHighlighted: !prev.isHighlighted } : null
        );
      }
    } catch (error) {
      console.error("Failed to toggle highlight image:", error);
      alert("Error highlighting image. See console for details.");
    }
  };

  const handleSaveCustomMessage = async () => {
    if (!isAdmin || !modalImageId || !currentModalDoc) return;
    try {
      await addOrUpdateCustomMessageMutation({
        galleryId: modalImageId,
        customMessage: customMessageInput,
      });
      setCurrentModalDoc((prev) => (prev ? { ...prev, customMessage: customMessageInput } : null));
      alert("Custom message saved successfully!");
    } catch (error) {
      console.error("Failed to save custom message:", error);
      alert("Error saving custom message. See console for details.");
    }
  };

  const handleDownload = async () => {
    if (!isAdmin || !modalImage || !currentModalDoc) return;
    try {
      const response = await fetch(modalImage);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = `${currentModalDoc.prompt.replace(/\s+/g, "_").substring(0, 20) || currentModalDoc._id}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  // Redirect if signed in but not an admin
  if (isSignedIn && !isAdmin && user) {
    return <Navigate to="/404" replace />;
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Header galleryCount={isAdmin ? (results?.length ?? galleryCount) : 0} />

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <SignedIn>
          {isAdmin ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
                  Moderation Panel
                </h1>
                <UserButton afterSignOutUrl="/" />
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-8">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search all images (moderator view)..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] text-gray-700"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="px-6 py-2 bg-[#EB2E2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#cf2925]">
                  Search
                </button>
              </form>

              {isLoading && (
                <p className="text-center text-gray-500 py-10">Loading moderation data...</p>
              )}

              {!isLoading && results && (results as ModGalleryDoc[]).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-gray-700">
                    Search Results ({results.length})
                  </h3>
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white shadow-sm">
                    {(results as ModGalleryDoc[]).map((item) => (
                      <li
                        key={item._id}
                        className={`p-4 hover:bg-gray-50 relative ${item.isHidden ? "opacity-60" : ""} ${item.isHighlighted ? "ring-2 ring-[#EB2E2A] ring-inset" : ""}`}>
                        {item.isHighlighted && (
                          <div className="absolute top-1 right-1 bg-[#EB2E2A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            HIGHLIGHTED
                          </div>
                        )}
                        <button onClick={() => handleOpenModal(item)} className="text-left w-full">
                          <p
                            className={`font-semibold ${item.isHighlighted ? "text-[#EB2E2A]" : "text-blue-600"} hover:underline`}>
                            {item.prompt}
                          </p>
                          <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1 items-center">
                            <span>Style: {item.style}</span>
                            {item.authorName && <span>Author: {item.authorName}</span>}
                            {item.isHidden && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <EyeOff size={12} /> Hidden
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!isLoading && results && results.length === 0 && initialQuery && (
                <p className="text-center text-gray-500 py-10">
                  No results found for "{initialQuery}".
                </p>
              )}
              {!isLoading && results && results.length === 0 && !initialQuery && (
                <p className="text-center text-gray-500 py-10">
                  Enter a search term to find specific images, or leave blank to see all.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-20 max-w-md mx-auto">
              <ShieldAlert size={48} className="mx-auto mb-4 text-orange-500" />
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">Access Restricted</h2>
              <p className="text-gray-600 mb-8">
                You do not have permission to view this page. If you believe this is an error,
                please contact support.
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-lg font-semibold shadow-md">
                Go to Homepage
              </Link>
            </div>
          )}
        </SignedIn>
        <SignedOut>
          <div className="text-center py-20 max-w-md mx-auto">
            <ShieldAlert size={48} className="mx-auto mb-4 text-[#EB2E2A]" />
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Access Denied</h2>
            <p className="text-gray-600 mb-8">
              You must be signed in with moderator privileges to access this page.
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-[#EB2E2A] text-white rounded-lg hover:bg-[#cf2925] text-lg font-semibold shadow-md transition-all duration-150 ease-in-out transform hover:scale-105">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      {isAdmin && modalImageId && currentModalDoc && (
        <Transition appear show={!!modalImageId} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95">
                  <Dialog.Panel
                    className={`w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all ${currentModalDoc.isHighlighted ? "ring-2 ring-[#EB2E2A] ring-offset-2" : ""}`}>
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                      Moderation Controls
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        onClick={handleCloseModal}>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Dialog.Title>
                    <div className="mt-2">
                      {modalImage ? (
                        <img
                          src={modalImage}
                          alt={currentModalDoc.prompt || "Modal image"}
                          className="w-full h-auto max-h-[50vh] object-contain mb-4 rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-[250px] bg-gray-100 flex items-center justify-center mb-4 text-gray-400 rounded-md border border-gray-200">
                          Loading image...
                        </div>
                      )}
                      {currentModalDoc.customMessage && (
                        <div className="mb-3 p-3 bg-red-600 text-white rounded-md text-sm">
                          <p>
                            <strong>Admin Message:</strong> {currentModalDoc.customMessage}
                          </p>
                        </div>
                      )}
                      <div className="text-sm text-gray-700 space-y-1 mb-5">
                        <p>
                          <strong>Prompt:</strong> {currentModalDoc.prompt}
                        </p>
                        <p>
                          <strong>Style:</strong> {currentModalDoc.style}
                        </p>
                        {currentModalDoc.authorName && (
                          <p>
                            <strong>Author:</strong> {currentModalDoc.authorName}
                          </p>
                        )}
                        <p>
                          <strong>Status:</strong>
                          {currentModalDoc.isHidden && (
                            <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <EyeOff size={12} /> Hidden
                            </span>
                          )}
                          {currentModalDoc.isHighlighted && (
                            <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Star size={12} /> Highlighted
                            </span>
                          )}
                          {!currentModalDoc.isHidden && !currentModalDoc.isHighlighted && (
                            <span className="ml-1.5 text-gray-500">Normal</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-gray-200">
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors">
                          <Download size={16} /> Download
                        </button>
                      </div>

                      <div className="my-4 pt-4 border-t border-gray-200">
                        <label
                          htmlFor="customMessage"
                          className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Admin Message:
                        </label>
                        <textarea
                          id="customMessage"
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#EB2E2A] focus:border-[#EB2E2A] sm:text-sm"
                          value={customMessageInput}
                          onChange={(e) => setCustomMessageInput(e.target.value)}
                          placeholder="Enter a message to display for this image (visible in modal)..."
                        />
                        <button
                          onClick={handleSaveCustomMessage}
                          disabled={customMessageInput === (currentModalDoc.customMessage || "")}
                          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                          Save Message
                        </button>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleToggleHighlight}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm ${currentModalDoc.isHighlighted ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"}`}>
                          <Star size={18} />{" "}
                          {currentModalDoc.isHighlighted ? "Remove Highlight" : "Highlight Image"}
                        </button>
                        <button
                          onClick={handleToggleHide}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm ${currentModalDoc.isHidden ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-400"}`}>
                          {currentModalDoc.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                          {currentModalDoc.isHidden ? "Unhide Image" : "Hide Image"}
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors shadow-sm border border-gray-300">
                          <Trash2 size={18} /> Delete Permanently
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <FooterContent
                        hideDashboardLink={true}
                        showReportLink={true}
                        galleryId={currentModalDoc?._id}
                        prompt={currentModalDoc?.prompt}
                        style={currentModalDoc?.style}
                      />
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
      <footer className="mt-auto py-5">
        <FooterContent />
      </footer>
    </div>
  );
}

export default ModPage;
