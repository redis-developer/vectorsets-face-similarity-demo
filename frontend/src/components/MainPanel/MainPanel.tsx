import React from 'react'
import styles from './MainPanel.module.scss'
import Header from './Header/Header'
import SearchBar from './SearchBar/SearchBar'
import NearestMatchResult from './NearestMatchResult/NearestMatchResult'
import OtherMatchResults from './OtherMatchResults/OtherMatchResults'

const PAGE_LABELS = {
    title: 'ACTOR SIMILARITY SEARCH'
} as const

const MainPanel: React.FC = () => {
    return (
        <div className={styles.mainPanel}>
            <Header title={PAGE_LABELS.title} />
            <SearchBar />
            <NearestMatchResult />
            <OtherMatchResults />
        </div>
    )
}

export default MainPanel
