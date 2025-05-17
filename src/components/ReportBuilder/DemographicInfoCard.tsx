import { FaUsers, FaLayerGroup, FaChild, FaFemale } from 'react-icons/fa';
import { useLayerContext } from '../../context/LayerContext';
import { ViewportInsights } from '../../types';

const DemographicInfoCard = () => {
  const { currentViewportInsights } = useLayerContext() as {
    currentViewportInsights: ViewportInsights | null;
  };

  if (
    !currentViewportInsights ||
    !currentViewportInsights.population ||
    !currentViewportInsights.age
  ) {
    return (
      <div className="bg-[#1E293B] text-white p-6 rounded-lg shadow-lg max-w-xs mx-auto">
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-400">No demographic data available for current view</p>
        </div>
      </div>
    );
  }

  const { population, populationDensity, age, featureCount } = currentViewportInsights;

  const formatPopulation = (num: number): string => {
    if (num >= 1000000) {
      return `${Number(num / 1000000).toFixed(1)} مليون`;
    } else if (num >= 1000) {
      return `${Number(num / 1000).toFixed(1)} ألف`;
    }
    return num.toString();
  };

  return (
    <div className="bg-gem-gradient text-white p-4 rounded-lg shadow-lg max-w-sm mx-auto">
      <div className="text-center mb-4">
        <p className="text-lg font-semibold">إحصائيات المنطقة</p>
        {featureCount > 0 && (
          <p className="text-xs text-gray-300"> منطقة جغرافية ({featureCount})</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Total Population */}
        <div className="flex flex-col items-center p-3 bg-slate-100/90 rounded-md">
          <FaUsers className="w-8 h-8 text-primary mb-2" />
          <div className="text-3xl font-bold text-primary">
            {formatPopulation(population.total).split(' ')[0]}
          </div>
          <div className="text-sm text-gray-900">إجمالي السكان</div>
          <div className="text-xs text-gray-600">
            {formatPopulation(population.total).split(' ')[1]}
          </div>
        </div>

        {/* Female Population */}
        <div className="flex flex-col items-center p-3 bg-slate-100/90 rounded-md">
          <FaFemale className="w-8 h-8 text-gem mb-2" />
          <div className="text-3xl font-bold text-gem">
            {Math.round(population.femalePercentage)}%
          </div>
          <div className="text-sm text-gray-900">نسبة الإناث</div>
          <div className="text-xs text-gray-600">{formatPopulation(population.female)}</div>
        </div>

        {/* Population Density */}
        <div className="flex flex-col items-center p-3 bg-slate-100/90 rounded-md">
          <FaLayerGroup className="w-8 h-8 text-secondary mb-2" />
          <div className="text-3xl font-bold text-secondary">
            {Math.round(populationDensity.average)}
          </div>
          <div className="text-sm text-gray-900">الكثافة السكانية</div>
          <div className="text-xs text-gray-600">نسمة/كم²</div>
        </div>

        {/* Median Age Total & Female */}
        <div className="flex text-center flex-col items-center p-3 bg-slate-100/90 rounded-md">
          <FaChild className="w-8 h-8 text-primary mb-1" />
          <div className="text-2xl font-bold text-primary">
            {age.medianOfMediansTotal} <span className="text-sm">سنة</span>
          </div>
          <div className="text-xs text-gray-900 mb-1">متوسط العمر (الإجمالي)</div>

          <div className="text-xl font-bold text-gem">
            {age.medianOfMediansFemale} <span className="text-sm">سنة</span>
          </div>
          <div className="text-xs text-gray-900">متوسط العمر (إناث)</div>
        </div>
      </div>
    </div>
  );
};

export default DemographicInfoCard;
