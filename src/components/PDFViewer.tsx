"use client"

import { useState, useEffect } from "react"
import { Download, ZoomIn, ZoomOut, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Document, Page, pdfjs } from "react-pdf"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PageDetails {
  numPages: number | null
}

interface PDFViewerProps {
  url?: string
}

const PDFViewer = ({ 
  url = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf" 
}: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          headers: {
            "Accept": "application/pdf"
          },
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        setPdfData(uint8Array)
      } catch (err) {
        console.error("Error fetching PDF:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        toast({
          title: "Error Fetching PDF",
          description: err instanceof Error ? err.message : "Failed to fetch the PDF file. Please check the URL and try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPdf()
  }, [url, toast])

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

  const handleDownload = () => {
    if (pdfData) {
      const blob = new Blob([pdfData], { type: "application/pdf" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "document.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      toast({
        title: "Download started",
        description: "Your PDF is being downloaded",
      })
    }
  }

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
          "w-full bg-background rounded-lg shadow-xl overflow-hidden transition-all duration-300",
          "hover:shadow-2xl border border-primary",
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

        <div 
          className="relative w-full bg-muted" 
          style={{ height: isFullscreen ? "calc(100vh - 64px)" : "70vh" }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-destructive text-center">
                <p className="font-semibold">Error loading PDF</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </div>
          )}
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {pdfData && !error && (
              <Document
                file={{ data: pdfData }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                }
                error={
                  <div className="text-destructive p-4 text-center">
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
                  loading={
                    <div className="animate-pulse bg-secondary w-[595px] h-[842px]" />
                  }
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFViewer