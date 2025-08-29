'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { IImageDoc } from '@/types'

// Context
const AppContext = createContext<{
    isSearching: boolean
    setIsSearching: (searching: boolean) => void
    selectedImage: IImageDoc | null
    setSelectedImage: (image: IImageDoc | null) => void
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [isSearching, setIsSearching] = useState(false)
    const [selectedImage, setSelectedImage] = useState<IImageDoc | null>(null)

    return (
        <AppContext.Provider value={{
            isSearching,
            setIsSearching,
            selectedImage,
            setSelectedImage
        }}>
            {children}
        </AppContext.Provider>
    )
}

// Hook
export function useAppContext() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}
