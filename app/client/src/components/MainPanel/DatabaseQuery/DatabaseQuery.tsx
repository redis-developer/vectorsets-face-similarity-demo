import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import styles from './DatabaseQuery.module.scss';

const DatabaseQuery: React.FC = () => {
  const { lastQuery } = useAppContext();

  return (
    <div className={styles.queryContent}>
      <code className={styles.queryText}>
        {lastQuery || 'No query yet'}
      </code>
    </div>
  );
};

export { DatabaseQuery };
