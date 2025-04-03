import React, { useRef, useEffect } from 'react';
import { ConversionResult } from '@/types';
import { highlightXml } from '@/lib/xml-utils';
import { useToast } from '@/hooks/use-toast';

interface XMLOutputSectionProps {
  conversion: ConversionResult | null;
}

export default function XMLOutputSection({ conversion }: XMLOutputSectionProps) {
  const xmlContentRef = useRef<HTMLPreElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (conversion && xmlContentRef.current) {
      xmlContentRef.current.innerHTML = highlightXml(conversion.xmlContent);
    }
  }, [conversion]);

  const handleCopyXml = () => {
    if (!conversion) return;
    
    navigator.clipboard.writeText(conversion.xmlContent)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          duration: 2000,
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          variant: "destructive",
          duration: 2000,
        });
      });
  };

  const handleDownloadXml = () => {
    if (!conversion) return;
    
    const filename = conversion.filename.replace('.pdf', '.xml');
    const blob = new Blob([conversion.xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <section className="xml-output-section shadow-md p-4 sm:p-6 flex flex-col">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--light-secondary)] dark:text-[var(--dark-accent)]">XML Output</h2>
        {conversion && (
          <div className="flex">
            <button 
              className="mr-2 p-1.5 sm:p-2 text-[var(--light-primary)] hover:text-[var(--light-secondary)] dark:text-[var(--dark-secondary)] dark:hover:text-[var(--dark-accent)] rounded-md flex items-center transition-colors" 
              onClick={handleCopyXml}
              title="Copy to Clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-copy">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <path d="M9 14v-3"/>
                <path d="M12 14v-6"/>
                <path d="M15 14v-3"/>
              </svg>
              <span className="ml-1 hidden sm:inline text-sm">Copy</span>
            </button>
            <button 
              className="p-1.5 sm:p-2 text-[var(--light-primary)] hover:text-[var(--light-secondary)] dark:text-[var(--dark-secondary)] dark:hover:text-[var(--dark-accent)] rounded-md flex items-center transition-colors" 
              onClick={handleDownloadXml}
              title="Download XML"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              <span className="ml-1 hidden sm:inline text-sm">Download</span>
            </button>
          </div>
        )}
      </div>
      
      {!conversion ? (
        <div className="flex-grow flex items-center justify-center text-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-800 rounded-md min-h-[200px] sm:min-h-[300px]">
          <div>
            <div className="text-4xl sm:text-5xl text-gray-400 dark:text-gray-600 mb-3">📝</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Convert a PDF to see the XML output here</p>
          </div>
        </div>
      ) : (
        <div className="flex-grow relative">
          <pre 
            ref={xmlContentRef}
            className="xml-content bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-md h-[300px] sm:h-[400px] md:h-[500px] overflow-auto font-mono text-xs sm:text-sm leading-relaxed"
          ></pre>
        </div>
      )}
    </section>
  );
}
