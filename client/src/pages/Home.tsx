import React from 'react';
import UploadSection from '@/components/UploadSection';
import XMLOutputSection from '@/components/XMLOutputSection';
import ConversionHistory from '@/components/ConversionHistory';
import { ThemeToggle } from '@/components/theme-toggle';
import { ConversionResult } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [currentConversion, setCurrentConversion] = React.useState<ConversionResult | null>(null);
  const { logoutMutation } = useAuth();
  
  const handleSelectConversion = (conversion: ConversionResult) => {
    setCurrentConversion(conversion);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
        <header className="mb-6 sm:mb-8 flex justify-between items-center flex-col sm:flex-row gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-tight">
              PDF to XML Converter
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              Upload a PDF file and convert it to structured XML format. Preserve document structure and formatting.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* Main content for mobile (stacked layout) */}
        <div className="lg:hidden space-y-6">
          <UploadSection 
            onConversionComplete={setCurrentConversion} 
          />
          
          <XMLOutputSection 
            conversion={currentConversion} 
          />
          
          <div className="bg-card dark:bg-card rounded-lg shadow-md p-4 sm:p-6">
            <ConversionHistory onSelectConversion={handleSelectConversion} />
          </div>
        </div>
        
        {/* Desktop layout with 2 columns and conversion history at bottom */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col h-full">
              <UploadSection 
                onConversionComplete={setCurrentConversion} 
              />
            </div>
            
            <div className="flex flex-col h-full">
              <XMLOutputSection 
                conversion={currentConversion} 
              />
            </div>
          </div>
          
          {/* Conversion history for desktop (full width) */}
          <div className="bg-card dark:bg-card rounded-lg shadow-md p-6">
            <ConversionHistory onSelectConversion={handleSelectConversion} />
          </div>
        </div>
        
        <footer className="mt-8 sm:mt-12 pt-4 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PDF to XML Converter. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
