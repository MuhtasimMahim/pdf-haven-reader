"use client"

import { useState } from "react"
import { Download, ZoomIn, ZoomOut, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Document, Page, pdfjs } from "react-pdf"
import { fetchPDFThroughProxy } from "@/api/pdfProxy"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PageDetails {
  numPages: number | null
}

interface PDFViewerProps {
  url?: string
}

const PDFViewer = ({ 
  url = "https://www.aeee.in/wp-content/uploads/2020/08/Sample-pdf.pdf" 
}: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchPDFThroughProxy(url);
      setPdfData(data);
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError(err instanceof Error ? err.message : "Failed to load PDF");
      toast({
        title: "Error Loading PDF",
        description: err instanceof Error ? err.message : "Failed to load the PDF file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: PageDetails) => {
    setNumPages(numPages)
    setIsLoading(false)
    toast({
      title: "PDF Loaded",
      description: `Document has ${numPages} pages`,
    })
  }

  const onDocumentLoadError = (error: Error) => {
    setIsLoading(false)
    setError(error.message)
    toast({
      title: "Error Loading PDF",
      description: `Failed to load the PDF file: ${error.message}`,
      variant: "destructive",
    })
    console.error("Error loading PDF:", error)
  }

  const handleDownload = async () => {
    try {
      const data = await fetchPDFThroughProxy(url);
      const blob = new Blob([data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download started",
        description: "Your PDF is being downloaded",
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download the PDF file",
        variant: "destructive",
      });
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const newZoom = direction === "in" ? prev + 25 : prev - 25
      return Math.min(Math.max(newZoom, 50), 200)
    })

    toast({
      title: "Zoom " + direction,
      description: `Zoom level: ${zoomLevel}%`,
    })
  }

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset
      return numPages ? Math.min(Math.max(1, newPage), numPages) : 1
    })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-6 p-4">
      <div
        className={cn(
          "w-full bg-[#121212] rounded-lg shadow-xl overflow-hidden transition-all duration-300",
          "hover:shadow-2xl border border-[#00ffd5]",
          isFullscreen && "fixed inset-0 z-50 max-w-none rounded-none"
        )}
      >
        <div className="bg-muted p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              PDF Viewer
              <span className="text-xs bg-primary/20 px-2 py-1 rounded-full text-primary">
                {zoomLevel}%
              </span>
            </h2>
            <div className="text-primary/80 text-sm">
              Page {pageNumber} of {numPages}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => changePage(1)}
              disabled={pageNumber >= (numPages || 1)}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleZoom("out")}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleZoom("in")}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleDownload}
              variant="secondary"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group"
            >
              <Download className="mr-2 h-4 w-4 group-hover:animate-download-bounce" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="relative w-full bg-[#1a1a1a]" style={{ height: isFullscreen ? "calc(100vh - 64px)" : "70vh" }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ffd5]"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
              <div className="text-red-500 text-center">
                <p className="font-semibold">Error loading PDF</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </div>
          )}
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ffd5]"></div>
                </div>
              }
              error={
                <div className="text-red-500 p-4 text-center">
                  <p className="font-semibold">Failed to load PDF file.</p>
                  <p className="text-sm mt-2">Please check the URL and try again.</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={zoomLevel / 100}
                className="shadow-lg"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<div className="animate-pulse bg-[#2a2a2a] w-[595px] h-[842px]" />}
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
