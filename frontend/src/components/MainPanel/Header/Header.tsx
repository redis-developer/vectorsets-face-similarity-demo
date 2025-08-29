import React from 'react'
import styles from './Header.module.scss'

interface HeaderProps {
    title: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
        </div>
    )
}

export default Header
