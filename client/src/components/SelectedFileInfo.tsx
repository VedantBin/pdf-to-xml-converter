import React from 'react';
import { formatFileSize } from '@/lib/xml-utils';

interface SelectedFileInfoProps {
  file: File;
  onClear: () => void;
}

export default function SelectedFileInfo({ file, onClear }: SelectedFileInfoProps) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-blue-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-700 text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">{file.name}</p>
            <p className="text-xs sm:text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button 
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onClear}
          type="button"
          aria-label="Remove file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
