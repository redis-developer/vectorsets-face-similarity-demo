import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './ResultsView.module.scss';
import { SearchBar } from '../MainPanel/SearchBar/SearchBar';
import { DatabaseQuery } from '../MainPanel/DatabaseQuery/DatabaseQuery';
import { NearestMatchResult } from '../MainPanel/NearestMatchResult/NearestMatchResult';
import { OtherMatchResults } from '../MainPanel/OtherMatchResults/OtherMatchResults';
import { useAppContext } from '../../contexts/AppContext';
import { FILTER_INPUT_FIELDS } from '../../utils/constants';
import type { ImageDoc, SearchFormData } from '../../types';

interface ResultsViewProps {
  selectedImage: ImageDoc;
  onSetFilters: (searchData: SearchFormData) => void;
  onClearFilters: () => void;
  onBack: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  selectedImage,
  onSetFilters,
  onClearFilters,
  onBack,
}) => {
  const { isSearching, celebrityMatch, otherMatches } = useAppContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.resultsView}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back to search"
        >
          <ArrowLeft size={20} />
        </button>
        <span className={styles.datasetLabel}>Face Similarity</span>
      </div>

      <SearchBar
        inputFields={FILTER_INPUT_FIELDS}
        onSearch={onSetFilters}
        onClear={onClearFilters}
        mode="auto"
        labelPosition="placeholder"
      />
      <DatabaseQuery />
      <NearestMatchResult
        selectedImage={selectedImage}
        celebrityMatch={celebrityMatch}
        isSearching={isSearching}
      />
      <OtherMatchResults otherMatches={otherMatches} />
    </div>
  );
};

export { ResultsView };
