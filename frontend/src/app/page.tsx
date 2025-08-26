'use client'

import { AppProvider } from '@/contexts/AppContext'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import styles from './page.module.scss'

export default function Home() {
    return (
        <AppProvider>
            <main className={styles.main}>
                <LeftSidePanel />
                <MainPanel />
            </main>
        </AppProvider>
    )
}
