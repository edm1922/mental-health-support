"use client"

import { useState, useEffect } from "react"
import LoadingScreen from "../app/loading"

export default function LoadingWrapper({ children }) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    // Run this code only in the browser
    if (typeof window !== 'undefined') {
      // Always show loading on initial render
      setShowLoading(true)
    }
  }, [])

  return (
    <>
      {showLoading && <LoadingScreen />}
      {children}
    </>
  )
}
