'use client'

import React, { useEffect, useState } from 'react'
import OtherMatchResults from '@/components/MainPanel/OtherMatchResults/OtherMatchResults'
import { getSampleImages } from '@/utils/api'
import type { IImageDoc } from '@/types'
import { DATASET_NAMES } from '@/utils/constants'

export default function OtherMatchResultsDemo() {
    const [sampleImages, setSampleImages] = useState<IImageDoc[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSampleImages = async () => {
            try {
                setLoading(true)
                const response = await getSampleImages({
                    datasetName: DATASET_NAMES.VSET_TMDB
                })

                if (response.data) {
                    // Take more images to test scrolling
                    setSampleImages(response.data.slice(0, 50))
                }
            } catch (err) {
                // API utility handles all error toasts, just log for debugging
                console.error('Unexpected error in fetchSampleImages:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSampleImages()
    }, [])

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading sample images...
            </div>
        )
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{
                textAlign: 'center',
                marginBottom: '30px',
                color: '#333',
                fontSize: '28px',
                fontWeight: 'bold'
            }}>
                OtherMatchResults Demo
            </h1>

            <div style={{
                height: '400px',
                overflow: 'auto',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f9fafb'
            }}>
                <OtherMatchResults
                    otherMatches={sampleImages}
                />
            </div>
        </div>
    )
}
