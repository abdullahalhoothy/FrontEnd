import React from 'react';
import { usePolygonsContext } from '../../context/PolygonsContext';
import StatisticsPopup from './StatisticsPopup';

export default function StatisticsPopups() {
  const { polygons } = usePolygonsContext();
  if (!polygons) return null;

  const polygonsStatisticsPopups = polygons.filter(polygon => polygon.isStatisticsPopupOpen);
  return (
    <>
      {polygonsStatisticsPopups.map((polygon, index) => (
        <StatisticsPopup key={`statistics-popup-${polygon.id}`} polygon={polygon} />
      ))}
    </>
  );
}
