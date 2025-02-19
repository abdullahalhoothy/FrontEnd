import { useEffect, MutableRefObject } from 'react';
import axios, { CancelTokenSource } from 'axios';

interface CancellationConfig {
  cancelSourcesRef: MutableRefObject<CancelTokenSource[]>;
  conditions?: {
    dependencies: any[];
    shouldCancel: (...deps: any[]) => boolean;
    message?: string;
  };
  cleanupOnUnmount?: boolean;
}

export const useRequestCancellation = ({
  cancelSourcesRef,
  conditions,
  cleanupOnUnmount = true
}: CancellationConfig) => {
  // Handle conditional cancellation
  useEffect(() => {
    if (conditions) {
      const { dependencies, shouldCancel, message = 'Requests cancelled due to condition change' } = conditions;
      
      if (shouldCancel(...dependencies)) {
        cancelAllRequests(message);
      }
    }
  }, conditions ? conditions.dependencies : []);

  // Cleanup on unmount
  useEffect(() => {
    if (cleanupOnUnmount) {
      return () => {
        cancelAllRequests('Component unmounted');
      };
    }
  }, []);

  const createCancelToken = () => {
    const source = axios.CancelToken.source();
    cancelSourcesRef.current?.push(source);
    return source;
  };

  const cancelRequest = (source: CancelTokenSource, message: string = 'Request cancelled') => {
    source.cancel(message);
    if (cancelSourcesRef.current) {
      cancelSourcesRef.current = cancelSourcesRef.current.filter(s => s !== source);
    }
  };

  const cancelAllRequests = (message: string = 'All requests cancelled') => {
    if (cancelSourcesRef.current) {
      cancelSourcesRef.current.forEach(source => source.cancel(message));
      cancelSourcesRef.current = [];
    }
  };
  const isCancellationError = (error: any) => {
   return  axios.isCancel(error);
  };
  return {
    createCancelToken,
    cancelRequest,
    cancelAllRequests,
    isCancellationError
  };
};