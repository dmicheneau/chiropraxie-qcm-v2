/**
 * PDF Text Extraction Service
 * Uses pdf.js to extract text content from PDF files
 */

import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

// Configure worker - use local worker from public folder
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

export interface PDFExtractionResult {
  text: string
  pageCount: number
  wordCount: number
  metadata: {
    title?: string
    author?: string
    creationDate?: string
  }
  pageTexts: string[]
  warnings: string[]
}

export interface PDFExtractionProgress {
  currentPage: number
  totalPages: number
  percentage: number
  message: string
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  const warnings: string[] = []
  const pageTexts: string[] = []

  try {
    // Load PDF from file
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

    const pdf = await loadingTask.promise
    const totalPages = pdf.numPages

    // Extract metadata
    const metadata = await pdf.getMetadata().catch(() => null)
    const info = metadata?.info as Record<string, unknown> | undefined
    const pdfMetadata = {
      title: info?.Title as string | undefined,
      author: info?.Author as string | undefined,
      creationDate: info?.CreationDate as string | undefined,
    }

    // Extract text from each page
    let fullText = ''

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages,
          percentage: Math.round((pageNum / totalPages) * 100),
          message: `Extraction page ${pageNum}/${totalPages}...`,
        })
      }

      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        // Combine text items with proper spacing
        const pageText = textContent.items
          .filter((item): item is TextItem => 'str' in item)
          .map(item => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()

        pageTexts.push(pageText)
        fullText += pageText + '\n\n'
      } catch (pageError) {
        warnings.push(`Page ${pageNum}: extraction partielle`)
        pageTexts.push('')
      }
    }

    // Clean up text
    fullText = cleanExtractedText(fullText)

    // Calculate word count
    const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length

    return {
      text: fullText,
      pageCount: totalPages,
      wordCount,
      metadata: pdfMetadata,
      pageTexts,
      warnings,
    }
  } catch (error) {
    throw new Error(
      `Impossible de lire le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove page numbers (common patterns)
      .replace(/^\s*\d+\s*$/gm, '')
      // Remove header/footer artifacts
      .replace(/^(Page|page)\s+\d+\s*(of|sur|\/)\s*\d+\s*$/gm, '')
      // Trim
      .trim()
  )
}

/**
 * Validate if file is a valid PDF
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'Le fichier doit être un PDF' }
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 50 Mo)' }
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'Le fichier est vide' }
  }

  return { valid: true }
}

/**
 * Get PDF info without full extraction
 */
export async function getPDFInfo(file: File): Promise<{
  pageCount: number
  title?: string
  author?: string
}> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const metadata = await pdf.getMetadata().catch(() => null)
  const info = metadata?.info as Record<string, unknown> | undefined

  return {
    pageCount: pdf.numPages,
    title: info?.Title as string | undefined,
    author: info?.Author as string | undefined,
  }
}
