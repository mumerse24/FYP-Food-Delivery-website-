"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  // Process files
  const handleFiles = (files: File[]) => {
    // Check max images
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`)
      return
    }

    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 5MB`)
        return
      }

      // Create object URL
      const objectUrl = URL.createObjectURL(file)
      setUploadingImages(prev => new Set(prev).add(objectUrl))

      // Simulate upload (replace with actual upload)
      setTimeout(() => {
        setUploadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(objectUrl)
          return newSet
        })
        
        // For demo, use object URL. In production, upload to server
        onImagesChange([...images, objectUrl])
        
        // Clean up object URL after 1 second (for demo)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      }, 1500)
    })

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Add URL manually
  const addImageUrl = (url: string) => {
    if (!url.trim()) return
    
    if (images.length >= maxImages) {
      alert(`You can only upload up to ${maxImages} images`)
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      alert('Please enter a valid URL starting with http://, https://, or /')
      return
    }

    if (images.includes(url)) {
      alert('This image URL already exists')
      return
    }

    onImagesChange([...images, url])
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // Handle image load error
  const handleImageError = (url: string) => {
    setFailedImages(prev => new Set(prev).add(url))
  }

  const handleImageLoad = (url: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(url)
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all",
          isDragging 
            ? "border-amber-500 bg-amber-50" 
            : "border-gray-300 hover:border-amber-400 hover:bg-gray-50",
          images.length >= maxImages && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag & drop images here
          </p>
          <p className="text-xs text-gray-500 mb-3">
            or click to browse (JPG, PNG, GIF, WEBP up to 5MB)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Choose Images
          </Button>
          <p className="text-xs text-gray-400 mt-3">
            {images.length} / {maxImages} images uploaded
          </p>
        </div>
      </div>

      {/* Manual URL Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Or enter image URL (https://...)"
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addImageUrl((e.target as HTMLInputElement).value)
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
          onBlur={(e) => {
            if (e.target.value) {
              addImageUrl(e.target.value)
              e.target.value = ''
            }
          }}
          disabled={images.length >= maxImages}
        />
      </div>

      {/* Uploading Indicator */}
      {uploadingImages.size > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploading...</p>
          <div className="flex gap-2 flex-wrap">
            {Array.from(uploadingImages).map((url) => (
              <div
                key={url}
                className="relative w-20 h-20 bg-gray-100 rounded-lg animate-pulse"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Images ({images.length})
          </p>
          <div className="grid grid-cols-4 gap-3">
            {images.map((url, index) => {
              const isFailed = failedImages.has(url)
              
              return (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {/* Image */}
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className={cn(
                      "w-full h-full object-cover transition-all",
                      isFailed && "opacity-50"
                    )}
                    onError={() => handleImageError(url)}
                    onLoad={() => handleImageLoad(url)}
                  />
                  
                  {/* Failed Overlay */}
                  {isFailed && (
                    <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {!isFailed && (
                    <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    type="button"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  {/* Image Number */}
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Images Message */}
      {images.length === 0 && !uploadingImages.size && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add at least one image to continue
          </p>
        </div>
      )}
    </div>
  )
}