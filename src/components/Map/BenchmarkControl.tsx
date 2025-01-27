import { useLayoutEffect, useState } from 'react';
import { usePolygonsContext } from '../../context/PolygonsContext';

const BenchmarkControl = () => {
  const { benchmarks, setBenchmarks, polygons, isBenchmarkControlOpen, setIsBenchmarkControlOpen } =
    usePolygonsContext();

  const [controlHeight, setControlHeight] = useState(0);

  useLayoutEffect(() => {
    const checkControlHeight = () => {
      const mapboxControlContainer = document.querySelector('.mapboxgl-ctrl-top-left');
      // If the container is found, get its height
      if (mapboxControlContainer) {
        const height = mapboxControlContainer.getBoundingClientRect().height;
        setControlHeight(height);
      } else {
        // Retry after a short delay if the element is not found
        setTimeout(checkControlHeight, 100); // Retry every 100ms until the element is found
      }
    };

    checkControlHeight();
  }, []);

  const benchmarkStyle = {
    top: `${controlHeight + 10}px`, // 10px margin for some spacing
  };

  if (polygons.length === 0) return null;

  const handleBenchmarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setBenchmarks(prev => {
      const updated = prev.map(benchmark => {
        if (benchmark && benchmark?.title && benchmark.title === name) {
          return { ...benchmark, value: parseFloat(value) };
        }
        return benchmark;
      });
      return updated;
    });
  };
  return (
    <div className="" style={benchmarkStyle}>
      <button
        className="!bg-white !w-auto !h-auto !rounded-md !p-2 hover:bg-gray-100 transition-colors shadow-sm !border !border-gray-200"
        onClick={() => {
          setIsBenchmarkControlOpen(!isBenchmarkControlOpen);
        }}
      >
        Set Benchmark
      </button>
      {isBenchmarkControlOpen && (
        <div className="min-w-48 w-auto mt-2 flex flex-col rounded-md shadow-sm bg-white p-4 gap-4">
          {benchmarks
            .filter(benchmark => !!benchmark?.title)
            .map(benchmark => {
              return (
                <div className="flex justify-between items-center gap-6" key={benchmark?.title}>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {benchmark?.title?.split('_')?.join(' ')}
                  </label>
                  <input
                    type="number"
                    className="w-32 p-1 border border-gray-300 rounded-md"
                    value={benchmark?.value}
                    name={benchmark?.title}
                    onChange={handleBenchmarkChange}
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
export default BenchmarkControl;
