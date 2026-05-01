import {createContext, useContext, useState, ReactNode} from 'react';

// Define the context type
type PdfContextType = {
  pdfUri: string | null;
  setPdfUri: (uri: string | null) => void;
  refreshPdf: () => void;
};

// Create the context with a default value
const PdfContext = createContext<PdfContextType>({
  pdfUri: null,
  setPdfUri: () => {},
  refreshPdf: () => {},
});

// Define props type for PdfProvider
type PdfProviderProps = {
  children: ReactNode; // Explicitly type `children`
};

export const PdfProvider: React.FC<PdfProviderProps> = ({children}) => {
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const refreshPdf = () => {
    setPdfUri(null); // Reset pdfUri to trigger re-fetch
  };

  return (
    <PdfContext.Provider value={{pdfUri, setPdfUri, refreshPdf}}>{children}</PdfContext.Provider>
  );
};

// Hook to use the context
export const usePdf = () => useContext(PdfContext);
