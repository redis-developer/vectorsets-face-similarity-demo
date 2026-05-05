'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon } from 'lucide-react';
import styles from './DropZone.module.scss';
import { apiImageUpload } from '../../../utils/api';
import { showErrorToast } from '../../../utils/toast';
import type { ImageDoc } from '../../../types';

type Props = {
  onFileUploaded: (image: ImageDoc) => void;
  fileSizeMax?: number;
};

const DropZone: React.FC<Props> = ({ onFileUploaded, fileSizeMax }) => {
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (fileSizeMax && file.size > fileSizeMax) {
        const errorMessage =
          file.name +
          ' is larger than ' +
          (fileSizeMax / 1024 / 1024).toFixed(2) +
          ' MB';
        showErrorToast(errorMessage);
        return;
      }

      setBusy(true);
      try {
        const uploaded = await apiImageUpload(file);
        if (uploaded.data) {
          onFileUploaded({
            id: uploaded.data?.id || '',
            src: uploaded.data?.url || '',
            filename: uploaded.data?.filename || '',
          });
        }
      } catch (err: unknown) {
        console.error('Unexpected error in DropZone upload:', err);
      } finally {
        setBusy(false);
      }
    },
    [fileSizeMax, onFileUploaded],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''} ${busy ? styles.busy : ''}`}
    >
      <input {...getInputProps({ id: 'dropzone-input' })} />

      {busy ? (
        <div className={styles.uploadingState}>
          <div className={styles.spinner} />
          <span className={styles.uploadingText}>Uploading...</span>
        </div>
      ) : (
        <div className={styles.content}>
          <ImageIcon className={styles.icon} size={64} strokeWidth={1} />
          <p className={styles.text}>
            Drag your image here, or{' '}
            <button type="button" className={styles.browseLink} onClick={open}>
              browse
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export { DropZone };
