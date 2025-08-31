'use client'

import React, { useState } from 'react'
import NearestMatchResult from '@/components/MainPanel/NearestMatchResult/NearestMatchResult'
import type { IImageDoc } from '@/types'

const imgPrefix = 'http://localhost:3001/api/static/celebs/images/';
// Sample data for testing
const sampleSelectedImage: IImageDoc = {
    id: '1',
    src: imgPrefix + '00000_Aaron_Eckhart.jpg',
    filename: 'aaron_eckhart.jpg',
    label: 'Aaron Eckhart',
    fromUpload: false
}

const sampleCelebrityMatch: IImageDoc = {
    id: '2',
    src: imgPrefix + '00018_Aaron_Paul.jpg',
    filename: 'aaron_paul.jpg',
    label: 'Aaron Paul (92%)',
    fromUpload: false
}

const DemoNearestMatchResult: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<IImageDoc | undefined>(undefined)
    const [celebrityMatch, setCelebrityMatch] = useState<IImageDoc | undefined>(undefined)
    const [isSearching, setIsSearching] = useState(false)

    // Auto-start search when component mounts
    React.useEffect(() => {
        const startSearch = () => {
            setIsSearching(true)
            setSelectedImage(sampleSelectedImage)
            setCelebrityMatch(undefined)

            // Simulate API call
            setTimeout(() => {
                setIsSearching(false)
                setCelebrityMatch(sampleCelebrityMatch)
            }, 3000)
        }

        // Start search after a short delay
        const timer = setTimeout(startSearch, 1000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                NearestMatchResult Component Demo
            </h1>
            <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '2rem' }}>
                This demo automatically starts a search after 1 second and shows the result after 3 seconds.
                <br />
                Refresh the page to restart the demo.
            </p>

            <NearestMatchResult
                selectedImage={selectedImage}
                celebrityMatch={celebrityMatch}
                isSearching={isSearching}
            />
        </div>
    )
}

export default DemoNearestMatchResult
