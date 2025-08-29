'use client'

import { AppProvider, useAppContext } from '@/contexts/AppContext'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import styles from './page.module.scss'
import type { IImageDoc } from '@/types'

function HomeContent() {
    const { selectedImage, setSelectedImage } = useAppContext()

    const handleImageSelect = (image: IImageDoc) => {
        setSelectedImage(image)
    }

    const handleImageUpload = (image: IImageDoc) => {
        setSelectedImage(image)
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
