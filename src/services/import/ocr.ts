/**
 * OCR (Optical Character Recognition) Service
 * Uses Tesseract.js to extract text from images
 */

import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  wordCount: number
  warnings: string[]
}

export interface OCRProgress {
  status: string
  progress: number
  message: string
}

/**
 * Extract text from an image using OCR
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const warnings: string[] = []

  try {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Create image URL
    const imageUrl = URL.createObjectURL(file)

    try {
      // Run OCR with French language
      const result = await Tesseract.recognize(imageUrl, 'fra', {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: Math.round((m.progress || 0) * 100),
              message: getProgressMessage(m.status, m.progress)
            })
          }
        }
      })

      // Extract results
      const text = cleanOCRText(result.data.text)
      const confidence = result.data.confidence

      // Add warnings for low confidence
      if (confidence < 50) {
        warnings.push('Qualité de reconnaissance faible. Vérifiez le texte extrait.')
      } else if (confidence < 70) {
        warnings.push('Qualité de reconnaissance moyenne. Certains mots peuvent être incorrects.')
      }

      // Calculate word count
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length

      if (wordCount < 10) {
        warnings.push('Peu de texte détecté. Assurez-vous que l\'image contient du texte lisible.')
      }

      return {
        text,
        confidence,
        wordCount,
        warnings
      }
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(imageUrl)
    }
  } catch (error) {
    throw new Error(
      `Erreur OCR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Get human-readable progress message
 */
function getProgressMessage(status: string, progress?: number): string {
  const percentage = progress ? Math.round(progress * 100) : 0
  
  switch (status) {
    case 'loading tesseract core':
      return 'Chargement du moteur OCR...'
    case 'initializing tesseract':
      return 'Initialisation...'
    case 'loading language traineddata':
      return 'Chargement de la langue française...'
    case 'initializing api':
      return 'Préparation de l\'analyse...'
    case 'recognizing text':
      return `Reconnaissance du texte... ${percentage}%`
    default:
      return status
  }
}

/**
 * Clean and normalize OCR text
 */
function cleanOCRText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Fix common OCR mistakes
    .replace(/\|/g, 'l') // Pipe often detected instead of l
    .replace(/0/g, (match, offset, str) => {
      // Replace 0 with O if surrounded by letters
      const prev = str[offset - 1]
      const next = str[offset + 1]
      if (prev && next && /[a-zA-Z]/.test(prev) && /[a-zA-Z]/.test(next)) {
        return 'O'
      }
      return match
    })
    // Remove isolated single characters (often noise)
    .replace(/\s[a-zA-Z]\s/g, ' ')
    // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim()
}

/**
 * Validate if file is a valid image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Supported image types
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  
  if (!supportedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Format non supporté. Utilisez JPEG, PNG, GIF, WebP ou BMP.' 
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'L\'image est trop volumineuse (max 10 Mo)' }
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'Le fichier est vide' }
  }

  return { valid: true }
}

/**
 * Preprocess image for better OCR results
 * Returns a new File with improved contrast/clarity
 */
export async function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(file) // Return original if canvas not supported
      return
    }

    img.onload = () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        
        // Increase contrast (simple threshold-based)
        const contrast = 1.5
        const adjusted = ((gray - 128) * contrast) + 128
        const value = Math.max(0, Math.min(255, adjusted))

        data[i] = value     // R
        data[i + 1] = value // G
        data[i + 2] = value // B
        // Alpha unchanged
      }

      ctx.putImageData(imageData, 0, 0)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: 'image/png' })
            resolve(processedFile)
          } else {
            resolve(file)
          }
        },
        'image/png',
        1.0
      )
    }

    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'))
    }

    img.src = URL.createObjectURL(file)
  })
}
