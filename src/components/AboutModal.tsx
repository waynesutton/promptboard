import React, { useState, useEffect } from "react";

function AboutModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Add useEffect for Escape key handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    // Cleanup function to remove the event listener when the component unmounts or isOpen changes
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]); // Dependency array ensures this runs only when isOpen changes

  return (
    <>
      <button
        onClick={openModal}
        className="font-['Chakra_Petch'] font-light text-lg text-[#0F0F0F] hover:text-[#6B7280] focus:outline-none">
        About
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-[#6B7280] hover:text-[#0F0F0F] focus:outline-none text-3xl font-thin"
              aria-label="Close modal">
              &times;
            </button>

            {/* About Section */}
            <h2 className="text-2xl font-semibold mb-4 font-['Chakra_Petch'] text-[#0F0F0F]">
              About
            </h2>
            <p className="mb-4 text-[#374151] font-['Inter']">
              <strong>1 Million Prompts</strong> is a community-powered AI image generator built
              with Convex, Convex Chef, and OpenAI. Every image contributes to a global goal:
              reaching 1,000,000 AI-generated prompts.
            </p>
            <p className="mb-4 text-[#374151] font-['Inter']">
              Track progress in real-time, explore a living prompt gallery, and generate images in
              your favorite styles—from Pixar to pop art to thermal silhouettes.
            </p>
            <p className="mb-4 text-[#374151] font-['Inter']">
              Because everyone has a creative prompt in them—and we want to see it.
            </p>
            <p className="mb-6 text-[#374151] font-['Inter']">
              This isn't just another image app. It's a vibe-coded global challenge.
            </p>

            <hr className="my-6 border-t border-[#E5E7EB]" />

            {/* Contest Section */}
            <h2 className="text-2xl font-semibold mb-4 font-['Chakra_Petch'] text-[#0F0F0F]">
              Contest
            </h2>
            <p className="mb-4 text-[#374151] font-['Inter']">
              Submit your best AI-generated image using one of the featured styles. You're eligible
              to win:
            </p>
            <ul className="list-none mb-4 pl-0 text-[#374151] font-['Inter'] space-y-2">
              <li>🔥 Prize for most creative prompt + image</li>
              <li>❤️ Prize for most liked prompt</li>
              <li>
                🏆 $$$$$ + Bonus for submitting the <strong>1 millionth prompt</strong>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 font-['Chakra_Petch'] text-[#0F0F0F]">
              How to enter:
            </h3>
            <ol className="list-decimal list-inside mb-4 text-[#374151] font-['Inter'] space-y-1">
              <li>
                Enter your prompt, select a style from the dropdown menu, click "Add Yours" to
                generate an image
              </li>
              <li>Add your prompt author name and social handle</li>
              <li>Share your image on social media</li>
            </ol>
            <p className="mb-6 text-[#374151] font-['Inter']">
              Winners will also receive Convex swag and startup credits. Let the prompt cooking
              begin.
            </p>
            <p className="mb-6 text-[#374151] font-['Inter']">
              Winners will be announced on the via{" "}
              <strong>
                <a href="https://twitter.com/convex_dev">@convex_dev</a>
              </strong>{" "}
              social account after the 1 millionth prompt is submitted.
            </p>
            <hr className="my-6 border-t border-[#E5E7EB]" />

            <h2 className="text-2xl font-semibold mb-4 font-['Chakra_Petch'] text-[#0F0F0F]">
              Meet the Judges
            </h2>
            <h3 className="text-lg font-semibold mb-2 font-['Chakra_Petch'] text-[#0F0F0F]">TBA</h3>
            <ol className="list-decimal list-inside mb-4 text-[#374151] font-['Inter'] space-y-1">
              <li>Judge 1</li>
              <li>Judge 2</li>
              <li>Judge 3</li>
              <li>Judge 4</li>
              <li>Judge 5</li>
            </ol>

            <hr className="my-6 border-t border-[#E5E7EB]" />

            <h2 className="text-2xl font-semibold mb-4 font-['Chakra_Petch'] text-[#0F0F0F]">
              Contest Hosted by
            </h2>

            <p className="mb-6 text-[#374151] font-['Inter']">
              <strong>
                {" "}
                <a
                  href="https://convex.link/1millprompts"
                  target="_blank"
                  rel="noopener noreferrer">
                  Convex
                </a>{" "}
              </strong>
              is the open-source reactive database for app developers shipping modern, AI-powered
              apps. Convex handles the real-time infra so you can focus on cooking up your building
              your app.
            </p>

            <hr className="my-6 border-t border-[#E5E7EB]" />

            {/* FAQ Section */}
            <h2 className="text-2xl font-semibold mb-4 font-['Chakra_Petch'] text-[#0F0F0F]">
              FAQ
            </h2>
            <div className="space-y-3">
              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer list-none">
                  <span className="text-md font-semibold font-['Chakra_Petch'] text-[#0F0F0F]">
                    Eligibility
                  </span>
                  <span className="text-[#6B7280] transform transition-transform duration-200 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="p-3 border border-t-0 border-gray-200 rounded-b">
                  <p className="text-[#374151] font-['Inter']">
                    Participants must be 18 years or older. Employees of Convex and their immediate
                    family members are not eligible to participate.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer list-none">
                  <span className="text-md font-semibold font-['Chakra_Petch'] text-[#0F0F0F]">
                    How are submissions judged?
                  </span>
                  <span className="text-[#6B7280] transform transition-transform duration-200 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="p-3 border border-t-0 border-gray-200 rounded-b">
                  <p className="text-[#374151] font-['Inter']">
                    Your prompts will be judged by the Convex team and partners.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer list-none">
                  <span className="text-md font-semibold font-['Chakra_Petch'] text-[#0F0F0F]">
                    Can I submit more than one prompt?
                  </span>
                  <span className="text-[#6B7280] transform transition-transform duration-200 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="p-3 border border-t-0 border-gray-200 rounded-b">
                  <p className="text-[#374151] font-['Inter']">
                    Yes! Submit as many prompts as you like.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AboutModal;
