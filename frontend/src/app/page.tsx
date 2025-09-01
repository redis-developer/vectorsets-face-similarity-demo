'use client'
import type { IApiResponse, IImageDoc, SearchFormData } from '@/types'

import { AppProvider, useAppContext } from '@/contexts/AppContext'
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel'
import MainPanel from '@/components/MainPanel/MainPanel'
import styles from './page.module.scss'
import { existingElementSearch, newElementSearch } from '@/utils/api'

const buildFilterQuery = (
    searchData: Record<string, string | number>
): string => {
    const filters: string[] = [];

    for (const [key, value] of Object.entries(searchData)) {
        if (value !== "" && value !== null && value !== undefined) {
            const fieldName = key;

            if (typeof value === "string") {
                filters.push(`.${fieldName}=="${value}"`);
            } else if (typeof value === "number") {
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
        setSearchFormData
    } = useAppContext()

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
            let response: IApiResponse<IImageDoc[]>;
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

            if (response.data && response.data.length > 0) {
                // First result goes to nearest match
                setCelebrityMatch(response.data[0])
                // Remaining results go to other matches
                setOtherMatches(response.data.slice(1))
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
    return (
        <AppProvider>
            <HomeContent />
        </AppProvider>
    )
}
