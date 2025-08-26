'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Context
const AppContext = createContext<{
    isSearching: boolean
    setIsSearching: (searching: boolean) => void
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [isSearching, setIsSearching] = useState(false)

    return (
        <AppContext.Provider value={{ isSearching, setIsSearching }}>
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
