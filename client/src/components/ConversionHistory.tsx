import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConversionHistoryItem, ConversionResult } from '@/types';
import { formatDate, formatFileSize } from '@/lib/xml-utils';
import { apiRequest } from '@/lib/queryClient';
import ConversionFilters, { ConversionFilterValues } from './ConversionFilters';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface ConversionHistoryProps {
  onSelectConversion: (conversion: ConversionResult) => void;
}

interface ConversionResponse {
  items: ConversionHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function ConversionHistory({ onSelectConversion }: ConversionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ConversionFilterValues>({
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    params.append('page', currentPage.toString());
    params.append('limit', '10');
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    
    if (filters.search) params.append('search', filters.search);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    if (filters.sizeMin !== undefined) params.append('sizeMin', filters.sizeMin.toString());
    if (filters.sizeMax !== undefined) params.append('sizeMax', filters.sizeMax.toString());
    
    return params.toString();
  };

  // Query conversions with filters and pagination
  const { data: conversionResponse, isLoading } = useQuery<ConversionResponse>({
    queryKey: ['/api/conversions', filters, currentPage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/conversions?${buildQueryString()}`);
      return response.json();
    },
    staleTime: 10000,
  });

  const conversions = conversionResponse?.items || [];
  const pagination = conversionResponse?.pagination || { total: 0, page: 1, limit: 10, pages: 0 };

  const handleViewConversion = async (id: number) => {
    try {
      const response = await apiRequest('GET', `/api/conversions/${id}`);
      const data = await response.json();
      onSelectConversion(data);
    } catch (error) {
      console.error('Error fetching conversion:', error);
    }
  };
  
  const handleFilterChange = (newFilters: ConversionFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="history-section shadow-md p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[var(--light-primary)] dark:text-[var(--dark-secondary)]">Conversion History</h3>
      
      {/* Filter Controls */}
      <ConversionFilters onFilterChange={handleFilterChange} />
      
      {isLoading ? (
        <div className="text-center py-4 text-sm">
          <svg className="animate-spin h-5 w-5 mr-2 text-[var(--light-secondary)] dark:text-[var(--dark-accent)] inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading history...</span>
        </div>
      ) : conversions && conversions.length > 0 ? (
        <div>
          {/* Desktop view - table */}
          <div className="hidden sm:block border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filename</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {conversions.map((conversion: ConversionHistoryItem) => (
                  <tr key={conversion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                      {conversion.filename}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(conversion.convertedAt)}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatFileSize(conversion.originalSize)}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right text-xs sm:text-sm">
                      <button 
                        className="text-[var(--light-secondary)] hover:text-[var(--light-primary)] dark:text-[var(--dark-accent)] dark:hover:text-[var(--dark-secondary)] font-medium"
                        onClick={() => handleViewConversion(conversion.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view - card list */}
          <div className="sm:hidden space-y-2">
            {conversions.map((conversion: ConversionHistoryItem) => (
              <div key={conversion.id} className="border rounded-md overflow-hidden p-3 bg-white dark:bg-gray-900 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[220px]">
                    {conversion.filename}
                  </p>
                  <button 
                    className="ml-2 px-2 py-1 bg-[var(--light-upload-fade)] hover:bg-[var(--light-secondary)] text-[var(--light-primary)] dark:bg-[var(--dark-upload-fade)] dark:hover:bg-[var(--dark-secondary)] dark:text-[var(--dark-accent)] text-xs rounded font-medium transition-colors"
                    onClick={() => handleViewConversion(conversion.id)}
                  >
                    View
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <p>{formatDate(conversion.convertedAt)}</p>
                  <p>{formatFileSize(conversion.originalSize)}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-4 flex justify-center gap-1">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="text-[var(--light-primary)] dark:text-[var(--dark-secondary)]"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="text-[var(--light-primary)] dark:text-[var(--dark-secondary)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center px-2 text-sm text-muted-foreground">
                Page {currentPage} of {pagination.pages}
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                title="Next Page"
                className="text-[var(--light-primary)] dark:text-[var(--dark-secondary)]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(pagination.pages)}
                disabled={currentPage === pagination.pages}
                title="Last Page"
                className="text-[var(--light-primary)] dark:text-[var(--dark-secondary)]"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-3xl sm:text-4xl mb-2">📄</div>
          <p className="text-sm sm:text-base">No conversion history found</p>
          {filters.search && (
            <p className="text-xs mt-2">Try adjusting your search filters</p>
          )}
        </div>
      )}
    </div>
  );
}
