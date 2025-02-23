import { useCallback } from 'react';
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

/**
 * Interface for performance monitoring results
 */
interface PerformanceResult {
  functionName: string;
  executionTime: number;
  cpuTime?: number;
  memoryUsage?: {
    usedHeapSize: number;
    totalHeapSize: number;
    heapLimit: number;
    usagePercentage: number;
    source: string;
  };
}

/**
 * Type for the performance monitoring callback
 */
type PerformanceCallback = (result: PerformanceResult) => void;

/**
 * Type guard to check if a value is a Promise
 */
function isPromise<T>(value: any): value is Promise<T> {
  return value && typeof value.then === 'function';
}

/**
 * Get detailed memory usage information using available APIs
 */
function getMemoryInfo() {
  try {
    // Try browser Performance Memory API first
    const memory = (performance as any).memory;
    if (memory) {
      const usedHeapSize = memory.usedJSHeapSize / (1024 * 1024); // MB
      const totalHeapSize = memory.totalJSHeapSize / (1024 * 1024); // MB
      const heapLimit = memory.jsHeapSizeLimit / (1024 * 1024); // MB
      const usagePercentage = (usedHeapSize / heapLimit) * 100;

      return {
        usedHeapSize,
        totalHeapSize,
        heapLimit,
        usagePercentage,
        source: 'performance.memory',
      };
    }

    // Fallback to window.performance timing
    const perfEntries = performance.getEntriesByType('resource');
    if (perfEntries.length > 0) {
      const totalTransferSize = perfEntries.reduce(
        (total, entry) => total + (entry as any).transferSize,
        0
      );
      const totalSize = perfEntries.reduce(
        (total, entry) => total + ((entry as any).decodedBodySize || 0),
        0
      );

      return {
        usedHeapSize: totalSize / (1024 * 1024),
        totalHeapSize: totalTransferSize / (1024 * 1024),
        heapLimit: window.navigator.hardwareConcurrency * 1024, // Rough estimate
        usagePercentage: (totalSize / totalTransferSize) * 100,
        source: 'performance.resource',
      };
    }

    return null;
  } catch (error) {
    console.debug('Memory metrics unavailable:', error);
    return null;
  }
}

/**
 * Wraps a function to monitor its performance
 * @param fn Function to monitor
 * @param name Optional name for the function
 * @param callback Optional callback for performance results
 */
export function performanceMonitor<T extends (...args: any[]) => any>(
  fn: T,
  name: string = fn.name,
  callback?: PerformanceCallback
): T {
  return function (this: any, ...args: Parameters<T>) {
    const startTime = performance.now();
    const startMemory = getMemoryInfo();
    const startMark = `${name}-start-${startTime}`;
    const endMark = `${name}-end-${startTime}`;

    // Start performance measurement
    performance.mark(startMark);

    const recordMetrics = () => {
      const endTime = performance.now();
      const endMemory = getMemoryInfo();
      performance.mark(endMark);

      // Measure between marks
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const lastEntry = entries[entries.length - 1];

      const performanceResult: PerformanceResult = {
        functionName: name,
        executionTime: endTime - startTime,
        cpuTime: lastEntry?.duration || 0,
      };

      if (startMemory && endMemory) {
        performanceResult.memoryUsage = endMemory;
      }

      if (callback) {
        callback(performanceResult);
      } else {
        logPerformance(performanceResult);
      }

      // Cleanup performance marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    };

    try {
      const result = fn.apply(this, args);

      if (isPromise(result)) {
        return result.finally(recordMetrics);
      }

      recordMetrics();
      return result;
    } catch (error) {
      recordMetrics();
      throw error;
    }
  } as T;
}

/**
 * React hook for performance monitoring
 * @param fn Function to monitor
 * @param name Optional name for the function
 * @param callback Optional callback for performance results
 */
export function usePerformanceMonitor<T extends (...args: any[]) => any>(
  fn: T,
  name: string = fn.name,
  callback?: PerformanceCallback
) {
  return useCallback(
    performanceMonitor(fn, name, callback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name]
  );
}

/**
 * Initialize web vitals monitoring
 * @param onMetric Optional callback for metric results
 */
export function initWebVitals(
  onMetric?: (metric: { name: string; value: number; id: string }) => void
) {
  const defaultCallback = (metric: { name: string; value: number; id: string }) => {
    console.log(`Web Vital [${metric.name}]:`, metric.value.toFixed(2));
  };

  const callback = onMetric || defaultCallback;

  getCLS(callback);
  getFID(callback);
  getLCP(callback);
  getFCP(callback);
  getTTFB(callback);
}

/**
 * Example usage with the map initialization:
 *
 * const monitoredMapInitialization = performanceMonitor(
 *   useMapInitialization,
 *   'mapInitialization'
 * );
 *
 * // In React components:
 * const monitoredFunction = usePerformanceMonitor(
 *   someFunction,
 *   'functionName'
 * );
 */

// Update the console output in performanceMonitor
const logPerformance = (result: PerformanceResult) => {
  const memoryInfo = result.memoryUsage
    ? `\n🧮 Memory (${result.memoryUsage.source}):` +
      `\n   Used: ${result.memoryUsage.usedHeapSize.toFixed(2)}MB` +
      `\n   Total: ${result.memoryUsage.totalHeapSize.toFixed(2)}MB` +
      `\n   Limit: ${result.memoryUsage.heapLimit.toFixed(2)}MB` +
      `\n   Usage: ${result.memoryUsage.usagePercentage.toFixed(2)}%`
    : '\n🧮 Memory: Not available';

  console.log(
    `Performance [${result.functionName}]:`,
    `\n🕒 Execution: ${result.executionTime.toFixed(2)}ms`,
    `\n💻 CPU Time: ${result.cpuTime ? result.cpuTime.toFixed(2) : 'N/A'}ms`,
    memoryInfo
  );
};
