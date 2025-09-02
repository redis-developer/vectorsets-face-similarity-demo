import type { IImageDoc, SearchFormData } from '@/types'

import React from 'react'
import styles from './MainPanel.module.scss'
import Header from './Header/Header'
import SearchBar from './SearchBar/SearchBar'
import DatabaseQuery from './DatabaseQuery/DatabaseQuery'
import NearestMatchResult from './NearestMatchResult/NearestMatchResult'
import OtherMatchResults from './OtherMatchResults/OtherMatchResults'
import { useAppContext } from '@/contexts/AppContext'
import { DATASETS_FILTERS } from '@/utils/constants'
import { CURRENT_DATASET } from '@/utils/config'


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

    const searchFields = DATASETS_FILTERS[CURRENT_DATASET].inputFields;

    return (
        <div className={styles.mainPanel}>
            <Header title={PAGE_LABELS.title} />
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
        </div>
    )
}

export default MainPanel
