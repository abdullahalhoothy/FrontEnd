import { Feature } from '.';

export interface PopulationInsights {
  total: number;
  male: number;
  female: number;
  femalePercentage: number;
  malePercentage: number;
}

export interface PopulationDensityInsights {
  average: number;
  median: number;
}

export interface AgeInsights {
  medianOfMediansTotal: number;
  medianOfMediansFemale: number;
}

export interface ViewportInsights {
  population: PopulationInsights;
  populationDensity: PopulationDensityInsights;
  age: AgeInsights;
  featureCount: number;
}

export interface Insights {
  mostPopulous: Feature;
  highestDensity: Feature;
  youngestPopulation: Feature;
  oldestPopulation: Feature;
  others: any[];
}
