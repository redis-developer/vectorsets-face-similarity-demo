'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { IImageDoc, SearchFormData } from '@/types'

// Context
const AppContext = createContext<{
    isSearching: boolean
    setIsSearching: (searching: boolean) => void
    selectedImage: IImageDoc | null
    setSelectedImage: (image: IImageDoc | null) => void
    celebrityMatch: IImageDoc | null
    setCelebrityMatch: (match: IImageDoc | null) => void
    otherMatches: IImageDoc[]
    setOtherMatches: (matches: IImageDoc[]) => void
    searchFormData: SearchFormData
    setSearchFormData: (data: SearchFormData) => void
    lastQuery: string
    setLastQuery: (query: string) => void
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [isSearching, setIsSearching] = useState(false)
    const [selectedImage, setSelectedImage] = useState<IImageDoc | null>(null)
    const [celebrityMatch, setCelebrityMatch] = useState<IImageDoc | null>(null)
    const [otherMatches, setOtherMatches] = useState<IImageDoc[]>([])
    const [searchFormData, setSearchFormData] = useState<SearchFormData>({})
    const [lastQuery, setLastQuery] = useState<string>('')

    return (
        <AppContext.Provider value={{
            isSearching,
            setIsSearching,
            selectedImage,
            setSelectedImage,
            celebrityMatch,
            setCelebrityMatch,
            otherMatches,
            setOtherMatches,
            searchFormData,
            setSearchFormData,
            lastQuery,
            setLastQuery
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
