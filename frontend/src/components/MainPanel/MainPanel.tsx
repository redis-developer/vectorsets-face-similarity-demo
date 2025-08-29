import React from 'react'
import styles from './MainPanel.module.scss'
import Header from './Header/Header'
import SearchBar from './SearchBar/SearchBar'
import NearestMatchResult from './NearestMatchResult/NearestMatchResult'
import OtherMatchResults from './OtherMatchResults/OtherMatchResults'
import type { IImageDoc } from '@/types'

const PAGE_LABELS = {
    title: 'ACTOR SIMILARITY SEARCH'
} as const

interface MainPanelProps {
    selectedImage?: IImageDoc | null;
}

const MainPanel: React.FC<MainPanelProps> = ({ selectedImage }) => {
    return (
        <div className={styles.mainPanel}>
            <Header title={PAGE_LABELS.title} />
            <SearchBar />
            <NearestMatchResult selectedImage={selectedImage} />
            <OtherMatchResults />
        </div>
    )
}

export default MainPanel
