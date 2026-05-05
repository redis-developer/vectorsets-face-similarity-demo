import { Toaster } from 'react-hot-toast';
import type {
  ApiResponse,
  ImageDoc,
  VectorSetSearchResponse,
  SearchFormData,
} from './types';

import { useAppContext } from './contexts/AppContext';
import { LandingPage } from './components/LandingPage/LandingPage';
import { ResultsView } from './components/ResultsView/ResultsView';
import { existingElementSearch, newElementSearch } from './utils/api';
import styles from './App.module.scss';

function buildFilterQuery(searchData: Record<string, string | number>): string {
  const filters: string[] = [];

  for (const [key, value] of Object.entries(searchData)) {
    if (value !== '' && value !== null && value !== undefined) {
      if (typeof value === 'string') {
        filters.push(`.${key}=="${value}"`);
      } else if (typeof value === 'number' && value) {
        filters.push(`.${key}>=${value}`);
      }
    }
  }

  return filters.join(' and ');
}

function App() {
  const {
    selectedImage,
    setSelectedImage,
    setIsSearching,
    setCelebrityMatch,
    setOtherMatches,
    searchFormData,
    setSearchFormData,
    setLastQuery,
  } = useAppContext();

  const vectorSetElementSearch = async (
    image: ImageDoc,
    isNewElement: boolean,
    searchData?: SearchFormData,
  ) => {
    setIsSearching(true);
    setCelebrityMatch(null);
    setOtherMatches([]);

    try {
      let response: ApiResponse<VectorSetSearchResponse>;
      const resultCount = 50;
      const activeSearchData = searchData ?? searchFormData ?? {};
      const filterQuery = activeSearchData
        ? buildFilterQuery(activeSearchData)
        : '';

      if (isNewElement) {
        response = await newElementSearch({
          localImageUrl: image.src,
          count: resultCount,
          filterQuery,
        });
      } else {
        response = await existingElementSearch({
          id: image.id,
          count: resultCount,
          filterQuery,
        });
      }

      if (response?.data?.queryResults?.length) {
        const query = response.data.query;
        const queryResults = response.data.queryResults;
        setCelebrityMatch(queryResults[0]);
        setOtherMatches(queryResults.slice(1));
        setLastQuery(query);
      }
    } catch (error) {
      console.error('Unexpected error in performSearch:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImage = async (image: ImageDoc) => {
    setSelectedImage(image);
    const isNewElement = image.fromUpload || false;
    await vectorSetElementSearch(image, isNewElement);
  };

  const handleSetFilters = async (searchData: SearchFormData) => {
    setSearchFormData(searchData);

    if (selectedImage) {
      const isNewElement = selectedImage.fromUpload || false;
      await vectorSetElementSearch(selectedImage, isNewElement, searchData);
    }
  };

  const handleClearFilters = async () => {
    setSearchFormData({});

    if (selectedImage) {
      const isNewElement = selectedImage.fromUpload || false;
      await vectorSetElementSearch(selectedImage, isNewElement, {});
    }
  };

  const handleBack = () => {
    setSelectedImage(null);
    setCelebrityMatch(null);
    setOtherMatches([]);
    setLastQuery('');
    setSearchFormData({});
  };

  return (
    <>
      <main className={styles.main}>
        {selectedImage ? (
          <ResultsView
            selectedImage={selectedImage}
            onSetFilters={handleSetFilters}
            onClearFilters={handleClearFilters}
            onBack={handleBack}
          />
        ) : (
          <LandingPage
            onImageSelect={handleImage}
            onImageUpload={handleImage}
          />
        )}
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-02)',
            color: 'var(--fg-default)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--primary-font)',
          },
          success: {
            iconTheme: {
              primary: '#DCFF1E',
              secondary: '#091A23',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4438',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
}

export { App };
