import React from 'react'
import styles from './Header.module.scss'
import { DATASETS_OPTIONS } from '@/utils/constants'
import { useAppContext } from '@/contexts/AppContext'

interface HeaderProps {
    title: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { selectedDataset, setSelectedDataset } = useAppContext()

    const handleDatasetChange = (dataset: string) => {
        if (dataset) {
            setSelectedDataset(dataset as any)
        }
    }

    return (
        <div className={styles.header}>
            <div className={styles.leftSection}></div>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.rightSection}>
                <select
                    className={styles.datasetDropdown}
                    value={selectedDataset || ''}
                    onChange={(e) => handleDatasetChange(e.target.value)}
                >
                    <option value="">Select Dataset</option>
                    {DATASETS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default Header
