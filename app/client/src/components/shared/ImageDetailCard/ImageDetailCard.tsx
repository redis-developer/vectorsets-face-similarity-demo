import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { ImageCard } from '../../../components/shared/ImageCard/ImageCard';
import styles from './ImageDetailCard.module.scss';
import type { ImageDoc } from '../../../types';

type Props = {
  image: ImageDoc;
  selected?: boolean;
  onSelect?: (img: ImageDoc) => void;
  width?: number;
  showLabel?: boolean;
  expandable?: boolean;
  defaultExpanded?: boolean;
};

type TooltipPlacement = 'right' | 'left';

type TooltipPosition = {
  top: number;
  left: number;
  placement: TooltipPlacement;
};

const TOOLTIP_GAP = 8;
const TOOLTIP_VIEWPORT_MARGIN = 8;
const TOOLTIP_MIN_WIDTH = 220;
const TOOLTIP_MAX_WIDTH = 300;

const ImageDetailCard: React.FC<Props> = ({
  image,
  selected = false,
  onSelect,
  width = 120,
  showLabel = true,
  expandable = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const handleImageSelect = (img: ImageDoc) => {
    onSelect?.(img);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleCardClick = () => {
    onSelect?.(image);
  };

  const showInlineLabel = showLabel && Boolean(image.label);
  const showInlineScore = showLabel && image.score !== undefined;
  const hasMeta = Boolean(image.meta) && Object.keys(image.meta ?? {}).length > 0;
  const showTooltip = expandable && isExpanded && hasMeta;

  const updateTooltipPosition = useCallback(() => {
    const button = infoButtonRef.current;
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth ?? TOOLTIP_MIN_WIDTH;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 0;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceRight = viewportWidth - buttonRect.right - TOOLTIP_GAP;
    const spaceLeft = buttonRect.left - TOOLTIP_GAP;

    let placement: TooltipPlacement = 'right';
    if (spaceRight < tooltipWidth && spaceLeft > spaceRight) {
      placement = 'left';
    }

    const left =
      placement === 'right'
        ? buttonRect.right + TOOLTIP_GAP
        : buttonRect.left - TOOLTIP_GAP - tooltipWidth;

    const buttonCenter = buttonRect.top + buttonRect.height / 2;
    let top = buttonCenter - tooltipHeight / 2;

    const maxTop = viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN;
    if (top > maxTop) top = maxTop;
    if (top < TOOLTIP_VIEWPORT_MARGIN) top = TOOLTIP_VIEWPORT_MARGIN;

    setTooltipPosition({ top, left, placement });
  }, []);

  useLayoutEffect(() => {
    if (!showTooltip) {
      setTooltipPosition(null);
      return;
    }
    updateTooltipPosition();
  }, [showTooltip, updateTooltipPosition]);

  useEffect(() => {
    if (!showTooltip) return;

    const handleReposition = () => updateTooltipPosition();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (tooltipRef.current?.contains(target)) return;
      if (infoButtonRef.current?.contains(target)) return;
      setIsExpanded(false);
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showTooltip, updateTooltipPosition]);

  return (
    <div className={styles.container} style={{ width: `${width}px` }}>

      <div
        className={`${styles.imageCardWrapper}${onSelect ? ` ${styles.clickable}` : ''}`}
        onClick={handleCardClick}
      >

        <ImageCard
          image={image}
          selected={selected}
          onSelect={handleImageSelect}
          width={width}
          showLabel={false}
        />
      </div>

      {(showInlineLabel || (expandable && showLabel)) && (
        <div className={styles.labelRow}>
          {showInlineLabel && (
            <span className={styles.labelText} title={image.label}>
              {image.label}
            </span>
          )}
          {expandable && (
            <button
              ref={infoButtonRef}
              type="button"
              className={`${styles.infoButton} ${isExpanded ? styles.active : ''}`}
              onClick={handleExpandToggle}
              aria-label={isExpanded ? 'Hide match details' : 'Show match details'}
              aria-expanded={isExpanded}
            >
              <Info size={14} />
            </button>
          )}
        </div>
      )}

      {showInlineScore && (
        <div className={styles.scoreText}>Score: {image.score}</div>
      )}

      {showTooltip &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`${styles.metaPanel} ${tooltipPosition?.placement === 'left' ? styles.metaPanelLeft : styles.metaPanelRight
              }`}
            style={{
              top: tooltipPosition?.top ?? 0,
              left: tooltipPosition?.left ?? 0,
              visibility: tooltipPosition ? 'visible' : 'hidden',
              minWidth: TOOLTIP_MIN_WIDTH,
              maxWidth: TOOLTIP_MAX_WIDTH,
            }}
          >
            {Object.entries(image.meta ?? {}).map(([key, value]) => (
              <div key={key} className={styles.metaField}>
                <span className={styles.metaKey}>{key}:</span>
                <span className={styles.metaValue}>{String(value)}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export { ImageDetailCard };
