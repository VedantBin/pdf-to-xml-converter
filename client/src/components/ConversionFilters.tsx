import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Slider } from "@/components/ui/slider";
import { X, Filter, SortAsc, SortDesc, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Define the filter props interface
export interface ConversionFilterValues {
  search?: string;
  sortBy: 'date' | 'filename' | 'size';
  sortOrder: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
}

interface ConversionFiltersProps {
  onFilterChange: (filters: ConversionFilterValues) => void;
  maxFileSize?: number;
}

export default function ConversionFilters({ onFilterChange, maxFileSize = 10 * 1024 * 1024 }: ConversionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'filename' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, maxFileSize]);
  
  // Apply filters when any filter value changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFilterChange({
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        sizeMin: sizeRange[0] > 0 ? sizeRange[0] : undefined,
        sizeMax: sizeRange[1] < maxFileSize ? sizeRange[1] : undefined
      });
    }, 300); // Debounce filter changes

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, sortBy, sortOrder, dateFrom, dateTo, sizeRange, onFilterChange, maxFileSize]);

  // Reset all filters
  const handleReset = () => {
    setSearchTerm('');
    setSortBy('date');
    setSortOrder('desc');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSizeRange([0, maxFileSize]);
  };

  return (
    <div className="mb-6 w-full">
      {/* Search and sort controls always visible */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-grow">
          <Input
            placeholder="Search by filename"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="filename">Filename</SelectItem>
              <SelectItem value="size">File Size</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Advanced filters in collapsible panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="flex justify-between items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2 flex gap-2 items-center text-xs">
              <Filter className="h-3 w-3" />
              {isOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </Button>
          </CollapsibleTrigger>
          
          {isOpen && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              Reset All
            </Button>
          )}
        </div>
        
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date filters */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Date Range</h4>
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="dateFrom" className="text-xs">From</Label>
                  <DatePicker
                    id="dateFrom"
                    date={dateFrom}
                    onSelect={setDateFrom}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="dateTo" className="text-xs">To</Label>
                  <DatePicker
                    id="dateTo"
                    date={dateTo}
                    onSelect={setDateTo}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* File size filter */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">File Size (bytes)</h4>
              <div className="px-2">
                <Slider 
                  defaultValue={[0, maxFileSize]}
                  min={0}
                  max={maxFileSize}
                  step={1024}
                  value={sizeRange}
                  onValueChange={(values) => setSizeRange(values as [number, number])}
                  className="my-6"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(sizeRange[0])}</span>
                  <span>{formatFileSize(sizeRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}