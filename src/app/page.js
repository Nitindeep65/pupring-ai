'use client'

import { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import ProcessingDashboard from './components/ProcessingDashboard'
import Navbar from './components/navbar'

export default function App() {
  const [imageData, setImageData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUploadComplete = (result) => {
    try {
      setError(null)
      setImageData(result)
    } catch (err) {
      setError('Failed to process image. Please try again.')
    }
  }

  const handleUploadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleUploadError = (error) => {
    setIsLoading(false)
    setError(error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <Navbar />
      
      {/* Error Display */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {!imageData ? (
        <div className="pt-24">
          {/* Hero Section - Enhanced */}
          <section className="px-4 max-w-7xl mx-auto">
            <div className="text-center mb-20 relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-5">
                <div className="w-96 h-96 bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-600 dark:to-purple-600 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative">
                {/* Animated badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Handcrafted with Love</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
                  <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Pet Memorial
                  </span>
                  <br />
                  <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Jewelry
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
                  Transform your beloved pets photo into a
                  <span className="font-semibold text-gray-900 dark:text-white"> timeless keepsake</span>
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap justify-center gap-6 text-sm animate-fade-in-up animation-delay-400">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Premium Quality</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Lifetime Warranty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-5xl mx-auto mb-32">
              {isLoading ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-12">
                  <div className="animate-pulse">
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded mb-4"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ) : (
                <ImageUpload 
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={handleUploadStart}
                  onError={handleUploadError}
                />
              )}
            </div>

          </section>

          {/* Enhanced Footer */}
          <footer className="relative mt-32">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-950 dark:to-transparent"></div>
            <div className="relative border-t border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    © 2025 Pupring
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <section className="pt-32 px-4">
          <div className="max-w-6xl mx-auto">
            <ProcessingDashboard imageData={imageData} />
          </div>
        </section>
      )}
    </div>
  )
}