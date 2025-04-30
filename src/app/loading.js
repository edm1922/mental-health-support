"use client"

import { useState, useEffect } from "react"

export default function LoadingScreen() {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const timer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-purple-500 to-purple-700 transition-opacity duration-1000 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="relative h-24 w-24 animate-pulse">
          <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm"></div>
          <div className="absolute inset-2 rounded-full bg-white/40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white/90 p-2">
              <div className="h-full w-full rounded-full bg-purple-100 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-purple-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white md:text-3xl">Mental Health Support</h1>

        <div className="flex flex-col items-center space-y-2">
          <p className="text-lg text-white/90">You're not alone</p>
          <div className="mt-4 flex space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
