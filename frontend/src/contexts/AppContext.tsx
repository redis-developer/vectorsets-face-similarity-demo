'use client'
import type { DatasetNameType } from '@/utils/constants'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { IImageDoc, SearchFormData } from '@/types'
import { getClientConfig } from '@/utils/config'

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
    selectedDataset: DatasetNameType
    setSelectedDataset: (dataset: DatasetNameType) => void
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [isSearching, setIsSearching] = useState(false)
    const [selectedImage, setSelectedImage] = useState<IImageDoc | null>(null)
    const [celebrityMatch, setCelebrityMatch] = useState<IImageDoc | null>(null)
    const [otherMatches, setOtherMatches] = useState<IImageDoc[]>([])
    const [searchFormData, setSearchFormData] = useState<SearchFormData>({})
    const [lastQuery, setLastQuery] = useState<string>('')
    const [selectedDataset, setSelectedDataset] = useState<DatasetNameType>(() => {
        const config = getClientConfig();
        return config.currentDataset;
    })

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
            setLastQuery,
            selectedDataset,
            setSelectedDataset
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
