import React, { useState, useCallback, useRef, useEffect } from 'react';

import { isValidUrl } from '../engine/urlUtils';

import { DURATION } from '../utils/animations';

interface UrlInputProps {
  /** Callback when a valid URL is submitted */
  onSubmit: (url: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show in large/landing mode */
  large?: boolean;
  /** Callback when the submit button hover state changes (only fires when input is valid) */
  onButtonHover?: (hovered: boolean) => void;
}

/**
 * URL input field with inline validation
 * @param props - Input configuration
 * @returns URL input with validation
 */
export const UrlInput: React.FC<UrlInputProps> = ({
  onSubmit,
  disabled = false,
  large = false,
  onButtonHover,
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (large && inputRef.current) {
      inputRef.current.focus();
    }
  }, [large]);

  const validate = useCallback((url: string): boolean => {
    if (!url.trim()) {
      setError(null);
      return false;
    }
    let testUrl = url.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl;
    }
    if (!isValidUrl(testUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (touched) {
      validate(newValue);
    }
  }, [touched, validate]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (value.trim()) {
      validate(value);
    }
  }, [value, validate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    let url = value.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (validate(url)) {
      onSubmit(url);
    }
  }, [value, validate, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex ${large ? 'flex-col sm:flex-row' : 'flex-row'} gap-2.5`}>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Enter a URL..."
            className={`w-full rounded-lg transition-all ease-out
              bg-bg-secondary border text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
              disabled:opacity-50 disabled:cursor-not-allowed
              ${large ? 'px-4 py-3 text-sm' : 'px-4 py-2.5 text-sm'}
              ${error && touched ? 'border-status-broken' : 'border-border'}`}
            style={{ transitionDuration: `${DURATION.fast}ms` }}
            aria-label="Website URL to crawl"
            aria-invalid={!!error && touched}
            aria-describedby={error ? 'url-error' : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          onMouseEnter={() => {
            if (onButtonHover && value.trim()) onButtonHover(true);
          }}
          onMouseLeave={() => {
            if (onButtonHover) onButtonHover(false);
          }}
          className={`rounded-lg bg-brand font-medium text-white
            hover:brightness-110 active:scale-[0.97]
            focus:outline-none focus:ring-2 focus:ring-brand/30
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all ease-out whitespace-nowrap
            ${large ? 'px-6 py-3 text-sm' : 'px-5 py-2.5 text-sm'}`}
          style={{ transitionDuration: `${DURATION.fast}ms` }}
        >
          Krawl
        </button>
      </div>
      {error && touched && (
        <p
          id="url-error"
          className="mt-2.5 text-xs text-status-broken transition-opacity duration-150"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
};
