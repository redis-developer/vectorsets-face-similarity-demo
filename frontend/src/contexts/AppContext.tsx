'use client'
import type { DatasetNameType } from '@/utils/constants'
import type { IImageDoc, SearchFormData } from '@/types'


import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { getClientConfig, setClientConfig } from '@/utils/config'
import { DATASET_NAMES } from '@/utils/constants'

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
        // Use default config initially, will be updated by useEffect after setClientConfig
        return DATASET_NAMES.VSET_TMDB as DatasetNameType;
    })

    // Sync selectedDataset with server config when it loads
    useEffect(() => {
        const syncWithServerConfig = async () => {
            await setClientConfig();
            const config = getClientConfig();
            setSelectedDataset(config.currentDataset);
        };
        syncWithServerConfig();
    }, [])

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
