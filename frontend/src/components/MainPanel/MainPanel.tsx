import React from 'react'
import styles from './MainPanel.module.scss'
import Header from './Header/Header'
import SearchBar from './SearchBar/SearchBar'
import NearestMatchResult from './NearestMatchResult/NearestMatchResult'
import OtherMatchResults from './OtherMatchResults/OtherMatchResults'
import type { IImageDoc } from '@/types'
import { useAppContext } from '@/contexts/AppContext'

const PAGE_LABELS = {
    title: 'ACTOR SIMILARITY SEARCH'
} as const

interface MainPanelProps {
    selectedImage?: IImageDoc | null;
}

const MainPanel: React.FC<MainPanelProps> = ({ selectedImage }) => {
    const {
        isSearching,
        celebrityMatch,
        otherMatches,
        searchError
    } = useAppContext()

    return (
        <div className={styles.mainPanel}>
            <Header title={PAGE_LABELS.title} />
            {/* <SearchBar /> */}
            <NearestMatchResult
                selectedImage={selectedImage}
                celebrityMatch={celebrityMatch}
                isSearching={isSearching}
                searchError={searchError}
            />
            <OtherMatchResults otherMatches={otherMatches} />
        </div>
    )
}

export default MainPanel
