'use client'
import type { IApiResponse, IImageDoc } from '@/types'

import { AppProvider, useAppContext } from '@/contexts/AppContext'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import styles from './page.module.scss'
import { existingElementSearch, newElementSearch } from '@/utils/api'

function HomeContent() {
    const {
        selectedImage,
        setSelectedImage,
        setIsSearching,
        setCelebrityMatch,
        setOtherMatches
    } = useAppContext()

    const handleImageSelect = async (image: IImageDoc) => {
        setSelectedImage(image)
        await performSearch(image, false);
    }

    const handleImageUpload = async (image: IImageDoc) => {
        setSelectedImage(image)
        await performSearch(image, true);
    }

    const performSearch = async (image: IImageDoc, isNewElement: boolean) => {
        setIsSearching(true)
        setCelebrityMatch(null)
        setOtherMatches([])

        try {
            let response: IApiResponse<IImageDoc[]>;
            const resultCount = 50;
            if (isNewElement) {
                response = await newElementSearch({
                    localImageUrl: image.src,
                    count: resultCount,
                    filterQuery: "" // No filter for now
                })
            } else {
                response = await existingElementSearch({
                    id: image.id,
                    count: resultCount,
                    filterQuery: "" // No filter for now
                })
            }

            if (response.data && response.data.length > 0) {
                // First result goes to celebrity match
                setCelebrityMatch(response.data[0])
                // Remaining results go to other matches
                setOtherMatches(response.data.slice(1))
            }
        } catch (error) {
            // API utility handles all error toasts, just log for debugging
            console.error('Unexpected error in performSearch:', error)
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
