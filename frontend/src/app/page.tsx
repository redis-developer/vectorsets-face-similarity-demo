'use client'
import type { IApiResponse, IImageDoc, IVectorSetSearchResponse, SearchFormData } from '@/types'

import { useEffect } from 'react'

import { useAppContext } from '@/contexts/AppContext'
import { setClientConfig } from '@/utils/config'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import { existingElementSearch, newElementSearch } from '@/utils/api'

import styles from './page.module.scss'

const buildFilterQuery = (
    searchData: Record<string, string | number>
): string => {
    const filters: string[] = [];

    for (const [key, value] of Object.entries(searchData)) {
        if (value !== "" && value !== null && value !== undefined) {
            const fieldName = key;

            if (typeof value === "string") {
                filters.push(`.${fieldName}=="${value}"`);
            } else if (typeof value === "number" && value) {
                filters.push(`.${fieldName}>=${value}`);
            }
        }
    }

    return filters.join(" and ");
};

function HomeContent() {
    const {
        selectedImage,
        setSelectedImage,
        setIsSearching,
        setCelebrityMatch,
        setOtherMatches,
        searchFormData,
        setSearchFormData,
        setLastQuery
    } = useAppContext()

    useEffect(() => {
        setClientConfig();
    }, []);

    const handleImage = async (image: IImageDoc) => {
        setSelectedImage(image)
        const isNewElement = image.fromUpload || false;
        await vectorSetElementSearch(image, isNewElement);
    }

    const vectorSetElementSearch = async (image: IImageDoc, isNewElement: boolean, searchData?: SearchFormData) => {
        setIsSearching(true)
        setCelebrityMatch(null)
        setOtherMatches([])

        try {
            let response: IApiResponse<IVectorSetSearchResponse>;
            const resultCount = 50;
            const activeSearchData = searchData ?? searchFormData ?? {};
            const filterQuery = activeSearchData ? buildFilterQuery(activeSearchData) : "";

            if (isNewElement) {
                response = await newElementSearch({
                    localImageUrl: image.src,
                    count: resultCount,
                    filterQuery: filterQuery
                })
            } else {
                response = await existingElementSearch({
                    id: image.id,
                    count: resultCount,
                    filterQuery: filterQuery
                })
            }

            if (response?.data?.queryResults?.length) {
                const query = response.data.query;
                const queryResults = response.data.queryResults;
                // First result goes to nearest match
                setCelebrityMatch(queryResults[0])
                // Remaining results go to other matches
                setOtherMatches(queryResults.slice(1))
                setLastQuery(query);
            }
        } catch (error) {
            console.error('Unexpected error in performSearch:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleSetFilters = async (searchData: SearchFormData) => {
        setSearchFormData(searchData)
        if (selectedImage) {
            const isNewElement = selectedImage.fromUpload || false;
            await vectorSetElementSearch(selectedImage, isNewElement, searchData);
        }
    }

    const handleClearFilters = async () => {
        setSearchFormData({})
        if (selectedImage) {
            const isNewElement = selectedImage.fromUpload || false;
            await vectorSetElementSearch(selectedImage, isNewElement, {});
        }
    }

    return (
        <main className={styles.main}>
            <LeftSidePanel
                onImageSelect={handleImage}
                onImageUpload={handleImage}
            />
            <MainPanel
                selectedImage={selectedImage}
                onSetFilters={handleSetFilters}
                onClearFilters={handleClearFilters}
            />
        </main>
    )
}

export default function Home() {
    return <HomeContent />
}
