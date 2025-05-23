import React, { useState, useEffect } from 'react';
import { useCaseStudy } from './CaseStudyPanel';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export const CaseStudyToggle: React.FC = () => {
  const { showCaseStudy, setShowCaseStudy } = useCaseStudy();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleToggle = () => {
    if (!isDisabled) {
      const newState = !showCaseStudy;
      setShowCaseStudy(newState);
    }
  };

  return (
    <div className="w-full flex justify-center my-4">
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`
          flex items-center justify-center
          w-auto h-[40px] rounded-md px-6 py-2
          transition-all duration-200 ease-in-out
          ${
            showCaseStudy
              ? 'bg-gem-green text-white hover:bg-[#0d4432] active:bg-[#0a3727]'
              : 'bg-gem-gradient border text-gray-200 border-gem/20 hover:bg-gem-gradient-animated hover:bg-200% hover:animate-gradient-shift'
          }
          ${
            isDisabled
              ? 'opacity-50 cursor-not-allowed pointer-events-none filter grayscale'
              : 'shadow-sm hover:shadow-md'
          }
          focus:outline-none focus:ring-2 focus:ring-gem/30
        `}
        aria-pressed={showCaseStudy}
        title={
          isDisabled ? 'This feature is currently unavailable' : 'Toggle case study visibility'
        }
      >
        <div className="flex gap-3 items-center justify-center">
          {showCaseStudy ? (
            <FaEyeSlash className="stroke-current w-[18px] h-[18px]" aria-hidden="true" />
          ) : (
            <FaEye className="stroke-current w-[18px] h-[18px]" aria-hidden="true" />
          )}
          <span className="font-medium">
            {showCaseStudy ? 'Hide Case Study' : 'Show Case Study'}
          </span>
        </div>
      </button>
    </div>
  );
};
