import React from 'react';

interface ConversionButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export default function ConversionButton({ disabled, isLoading, onClick }: ConversionButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`w-full py-2.5 sm:py-3 mb-4 sm:mb-5 rounded-md text-sm sm:text-base font-medium transition-all shadow-sm ${
        disabled && !isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 
        isLoading ? 'bg-gradient-to-r from-blue-600 to-blue-500 cursor-wait text-white' : 
        'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
      }`}
      onClick={onClick}
      type="button"
    >
      {isLoading ? (
        <span className="inline-flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Converting...
        </span>
      ) : (
        <span className="inline-flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v13"/>
            <path d="m8 13 4 4 4-4"/>
            <path d="M8 21H16"/>
          </svg>
          Convert to XML
        </span>
      )}
    </button>
  );
}
