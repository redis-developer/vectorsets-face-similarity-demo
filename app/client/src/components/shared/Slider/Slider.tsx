import React, { useState, useRef, useCallback } from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  label: string;
  name: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (name: string, value: number) => void;
  onChangeEnd?: (name: string, value: number) => void;
}

const THUMB_WIDTH = 16;

const Slider: React.FC<SliderProps> = ({
  label,
  name,
  min,
  max,
  step = 1,
  value,
  onChange,
  onChangeEnd,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [dragging, setDragging] = useState(false);
  const isDragging = useRef(false);

  const displayValue = isDragging.current ? localValue : value;
  const percentage = ((displayValue - min) / (max - min)) * 100;
  const thumbOffset = `calc(${percentage}% - ${(percentage / 100) * THUMB_WIDTH}px)`;

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      isDragging.current = true;
      setDragging(true);
      setLocalValue(v);
      onChange(name, v);
    },
    [name, onChange],
  );

  const handleCommit = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      setDragging(false);
      onChangeEnd?.(name, localValue);
    }
  }, [name, localValue, onChangeEnd]);

  return (
    <div className={styles.slider}>
      <label htmlFor={`slider-${name}`} className={styles.label}>
        {label}
      </label>
      <div className={styles.trackWrapper}>
        <div className={styles.trackInner}>
          <input
            id={`slider-${name}`}
            type="range"
            name={name}
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={handleInput}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            className={styles.track}
            style={{ '--fill': `${percentage}%` } as React.CSSProperties}
          />
          {dragging && (
            <span
              className={styles.bubble}
              style={{ left: thumbOffset }}
            >
              {displayValue}
            </span>
          )}
        </div>
        <span className={styles.maxLabel}>{max}</span>
      </div>
      <div className={styles.spacer} aria-hidden="true">&nbsp;</div>
    </div>
  );
};

export { Slider };
