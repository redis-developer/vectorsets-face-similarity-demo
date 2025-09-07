import type { IImageDoc, SearchFormData } from '@/types'

import React from 'react'
import styles from './MainPanel.module.scss'
import Header from './Header/Header'
import SearchBar from './SearchBar/SearchBar'
import DatabaseQuery from './DatabaseQuery/DatabaseQuery'
import NearestMatchResult from './NearestMatchResult/NearestMatchResult'
import OtherMatchResults from './OtherMatchResults/OtherMatchResults'
import PlaceholderContent from './PlaceholderContent/PlaceholderContent'
import { useAppContext } from '@/contexts/AppContext'
import { getClientConfig } from '@/utils/config'
import { DATASETS_FILTERS } from '@/utils/constants'


const PAGE_LABELS = {
    title: 'Face Similarity Search'
}

interface MainPanelProps {
    selectedImage?: IImageDoc | null;
    onSetFilters: (searchData: SearchFormData) => void;
    onClearFilters: () => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ selectedImage, onSetFilters, onClearFilters }) => {
    const {
        isSearching,
        celebrityMatch,
        otherMatches
    } = useAppContext()

    const { currentDataset } = getClientConfig()
    const searchFields = DATASETS_FILTERS[currentDataset]?.inputFields || [];

    return (
        <div className={styles.mainPanel}>
            <Header title={PAGE_LABELS.title} />
            {selectedImage ? (
                <>
                    <SearchBar
                        inputFields={searchFields}
                        onSearch={onSetFilters}
                        onClear={onClearFilters}
                        mode='auto'
                        labelPosition='left'
                    />
                    <DatabaseQuery />
                    <NearestMatchResult
                        selectedImage={selectedImage}
                        celebrityMatch={celebrityMatch}
                        isSearching={isSearching}
                    />
                    <OtherMatchResults otherMatches={otherMatches} />
                </>
            ) : (
                <PlaceholderContent />
            )}
        </div>
    )
}

export default MainPanel
