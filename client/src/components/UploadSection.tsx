import React from 'react';
import FileUploader from './FileUploader';
import SelectedFileInfo from './SelectedFileInfo';
import ConversionButton from './ConversionButton';
import AlertMessage from './AlertMessage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AlertInfo, ConversionResult } from '@/types';

interface UploadSectionProps {
  onConversionComplete: (conversion: ConversionResult | null) => void;
}

export default function UploadSection({ onConversionComplete }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [alert, setAlert] = React.useState<AlertInfo>({ type: null, message: null });
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/convert', formData);
      const data = await response.json();
      return data as ConversionResult;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: 'PDF successfully converted to XML!' });
      onConversionComplete(data);
      queryClient.invalidateQueries({ queryKey: ['/api/conversions'] });
    },
    onError: (error: Error) => {
      setAlert({ type: 'error', message: error.message || 'Conversion failed. Please try again.' });
      onConversionComplete(null);
    }
  });

  const handleFileSelect = (file: File) => {
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      setAlert({ type: 'error', message: 'Please select a PDF file' });
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'File size exceeds 10MB limit' });
      return;
    }
    
    setSelectedFile(file);
    setAlert({ type: null, message: null });
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleConvert = () => {
    if (!selectedFile) return;
    
    convertMutation.mutate(selectedFile);
  };

  return (
    <section className="upload-section shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[var(--light-primary)] dark:text-[var(--dark-accent)]">Upload PDF</h2>
      
      <FileUploader onFileSelect={handleFileSelect} />
      
      {selectedFile && (
        <SelectedFileInfo 
          file={selectedFile} 
          onClear={handleClearFile} 
        />
      )}
      
      <ConversionButton 
        disabled={!selectedFile || convertMutation.isPending} 
        isLoading={convertMutation.isPending}
        onClick={handleConvert}
      />
      
      {alert.type && (
        <AlertMessage 
          type={alert.type} 
          message={alert.message || ''} 
        />
      )}
    </section>
  );
}
