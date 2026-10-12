/**
 * ThalCare Custom Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// useApi - Generic hook for API calls
// ============================================
export function useApi(apiFunc, { immediate = false, ...initialParams } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const execute = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunc({ ...initialParams, ...params });
      if (mountedRef.current) {
        setData(result);
      }
      return { success: true, data: result };
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
      }
      return { success: false, error: err.message };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiFunc]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}

// ============================================
// usePagination - Hook for paginated data
// ============================================
export function usePagination(apiFunc, { initialPage = 1, initialLimit = 10 } = {}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunc({
        page: params.page || page,
        limit: params.limit || limit,
        ...params,
      });

      setData(result.data || result.items || []);
      setTotalPages(result.total_pages || result.totalPages || 0);
      setTotalItems(result.total || result.totalItems || 0);
      
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunc, page, limit]);

  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  return {
    data,
    page,
    limit,
    totalPages,
    totalItems,
    isLoading,
    error,
    fetchData,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ============================================
// useDebounce - Debounce value changes
// ============================================
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// useLocalStorage - Persist state in localStorage
// ============================================
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// ============================================
// useModal - Modal state management
// ============================================
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, data, open, close, toggle };
}

// ============================================
// useClickOutside - Detect clicks outside element
// ============================================
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================
// useMediaQuery - Responsive design hook
// ============================================
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// ============================================
// useCountdown - Countdown timer hook
// ============================================
export function useCountdown(targetDate, interval = 1000) {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isComplete: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, interval);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

// Export all hooks
export default {
  useApi,
  usePagination,
  useDebounce,
  useLocalStorage,
  useModal,
  useClickOutside,
  useMediaQuery,
  useCountdown,
};
