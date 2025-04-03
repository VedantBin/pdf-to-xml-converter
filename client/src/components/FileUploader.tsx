import React from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 text-center hover:border-primary transition-colors cursor-pointer ${isDragging ? 'border-primary bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="text-4xl sm:text-5xl text-gray-400 mb-2 sm:mb-3">📄</div>
      <p className="mb-2 text-sm sm:text-base font-medium">Drag &amp; drop your PDF here or</p>
      <label 
        className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm sm:text-base rounded-md cursor-pointer hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm"
        onClick={(e) => e.stopPropagation()} // Prevent double click handlers
      >
        Browse Files
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".pdf" 
          className="hidden" 
          onChange={handleFileInputChange}
          onClick={(e) => e.stopPropagation()} // Prevent double click handlers
        />
      </label>
      <p className="mt-2 text-xs sm:text-sm text-gray-500">Maximum file size: 10MB</p>
    </div>
  );
}
