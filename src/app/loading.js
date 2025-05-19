"use client"

import { useState, useEffect } from "react"
import RedCrossIcon from "@/components/ui/RedCrossIcon"

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
        <div className="relative animate-pulse">
          <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm -z-10 transform scale-110"></div>
          <RedCrossIcon size="xlarge" />
        </div>

        <h1 className="text-2xl font-bold text-white md:text-3xl">Healmate</h1>

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
