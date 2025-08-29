'use client'

import { AppProvider, useAppContext } from '@/contexts/AppContext'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import styles from './page.module.scss'
import type { IImageDoc } from '@/types'
import { existingElementSearch } from '@/utils/api'

function HomeContent() {
    const {
        selectedImage,
        setSelectedImage,
        setIsSearching,
        setCelebrityMatch,
        setOtherMatches,
        setSearchError
    } = useAppContext()

    const handleImageSelect = async (image: IImageDoc) => {
        setSelectedImage(image)
        await performSearch(image)
    }

    const handleImageUpload = async (image: IImageDoc) => {
        setSelectedImage(image)
        // await performSearch(image)
    }

    const performSearch = async (image: IImageDoc) => {
        setIsSearching(true)
        setSearchError(null)
        setCelebrityMatch(null)
        setOtherMatches([])

        try {
            const response = await existingElementSearch({
                id: image.id,
                count: 50,
                filterQuery: "" // No filter for now
            })

            if (response.data && response.data.length > 0) {
                // First result goes to celebrity match
                setCelebrityMatch(response.data[0])
                // Remaining results go to other matches
                setOtherMatches(response.data.slice(1))
            } else {
                setSearchError(response.error || 'No matches found')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Search failed'
            setSearchError(errorMessage)
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <main className={styles.main}>
            <LeftSidePanel
                onImageSelect={handleImageSelect}
                onImageUpload={handleImageUpload}
            />
            <MainPanel selectedImage={selectedImage} />
        </main>
    )
}

export default function Home() {
    return (
        <AppProvider>
            <HomeContent />
        </AppProvider>
    )
}
