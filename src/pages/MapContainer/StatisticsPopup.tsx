import React, { useEffect, useState } from "react";
import { usePolygonsContext } from "../../context/PolygonsContext";
import * as turf from "@turf/turf";

function calculatePercentageDifference(number, benchmark) {
  if (!number || !benchmark) return 0;
  if (typeof number !== "number" || typeof benchmark !== "number") return 0;
  const difference = Math.abs(number - benchmark);
  const average = (number + benchmark) / 2;
  const percentageDifference = (difference / average) * 100;
  return percentageDifference.toFixed(0);
}

function CloseButton({ polygon }) {
  const { polygons, setPolygons } = usePolygonsContext();
  const closePopup = () => {
    const updatedPolygons = polygons.map((p) => {
      if (p.id === polygon.id) {
        return { ...p, isStatisticsPopupOpen: false };
      }
      return p;
    });
    setPolygons(updatedPolygons);
  };
  return (
    <button
      className="flex items-center justify-center rounded-md hover:text-gray-950 text-gray-700"
      onClick={closePopup}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.0002 4.99994L5.00024 18.9999M5.00024 4.99994L19.0002 18.9999"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function StatisticsPopup({ polygon }) {
  const {
    sections,
    benchmarks,
    isBenchmarkControlOpen,
    setIsBenchmarkControlOpen,
  } = usePolygonsContext();
  const [popupPosition, setPopupPosition] = useState({
    x: polygon.pixelPosition ? polygon.pixelPosition.x : 0,
    y: polygon.pixelPosition ? polygon.pixelPosition.y : 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Make the popup draggable by clicking on the body of the popup and dragging it
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.movementX;
      const deltaY = e.movementY;
      setPopupPosition((prevPosition) => ({
        x: prevPosition.x + deltaX,
        y: prevPosition.y + deltaY,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (polygon.pixelPosition) {
      setPopupPosition({
        x: polygon.pixelPosition.x,
        y: polygon.pixelPosition.y,
      });
    }
  }, [polygon]);

  if (!polygon || !polygon.isStatisticsPopupOpen || !sections) return null;

  const polygonSections = sections.find(
    (section) => section.polygon.id === polygon.id
  );

  if (!polygonSections) return null;

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm lg:max-h-96 overflow-auto absolute p-4 z-10 ${
        polygonSections.polygon.properties.shape === "circle"
          ? "min-w-[64rem]"
          : "min-w-[32rem]"
      }`}
      style={{
        position: "absolute",
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        cursor: "move",
        zIndex: 1000, // Ensure the popup is above the map
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white mx-auto font-sans">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div className="flex space-x-1">
            <CloseButton polygon={polygon} />
          </div>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th
                className="text-left font-normal text-blue-600 w-1/4"
                colSpan={2}
              >
                <img
                  src="/slocator.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-16 h-16 rounded"
                />
              </th>
              <th className="w-3/4 p-0" colSpan={9}>
                <div
                  className={`flex ${
                    polygonSections.polygon.properties.shape === "circle"
                      ? "justify-between"
                      : "justify-end"
                  }`}
                >
                  {polygonSections.areas.map((area, index) => {
                    return (
                      <div
                        key={area}
                        className={`font-normal space-y-0.5 overflow-hidden ${
                          polygonSections.polygon.properties.shape === "circle"
                            ? "w-[32%]"
                            : "w-[64%]"
                        }`}
                      >
                        <div className="bg-blue-600 text-white text-center mb-1 h-12 w-full flex items-center justify-center ">
                          {area === "Unknown"
                            ? `Area ${(turf.area(polygon) / 100000).toFixed(
                                3
                              )} km²`
                            : area}
                        </div>
                        <div className="flex justify-between text-xs gap-0.5">
                          <span className="bg-blue-600 text-white p-1.5 w-1/4 text-center">
                            Count
                          </span>
                          <span className="bg-blue-600 text-white p-1.5 w-1/4 text-center">
                            %
                          </span>
                          <span className="bg-blue-600 text-white p-1.5 w-1/4 text-center">
                            Avg
                          </span>
                          <span className="bg-blue-600 text-white p-1.5 w-auto text-center text-nowrap">
                            vs Benchmark
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {polygonSections.sections.map((section, sectionIndex) => {
              const benchmark = benchmarks.find(
                (benchmark) => benchmark.title === section.title
              );
              return (
                <React.Fragment key={section.category}>
                  <tr className="border-b-[3px] border-blue-600 mb-2">
                    <td
                      colSpan={11}
                      className="font-bold text-blue-600 py-1 px-1 text-base capitalize"
                    >
                      {section.title.split("_").join(" ")}
                    </td>
                  </tr>
                  {section.points.map((point, itemIndex) => (
                    <tr
                      key={`${section.title}-${point.layer_name}`}
                      className={`${
                        itemIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="py-1 px-1 w-1/4" colSpan={2}>
                        {point.layer_name}
                      </td>
                      <td className="w-3/4 p-0" colSpan={9}>
                        <div
                          className={`flex overflow-hidden ${
                            polygonSections.polygon.properties.shape ===
                            "circle"
                              ? "justify-between"
                              : "justify-end"
                          }`}
                        >
                          {point.data.map((data) => (
                            <div
                              key={`${point.layer_name}-${data.area}km`}
                              className={`flex items-center ${
                                polygonSections.polygon.properties.shape ===
                                "circle"
                                  ? "w-[32%]"
                                  : "w-[64%]"
                              }`}
                            >
                              <div className="text-right py-1 px-1.5 w-1/4">
                                {data.count}
                              </div>
                              <div className="text-right py-1 px-1.5 w-1/4">
                                {data.percentage}%
                              </div>
                              <div className="text-right py-1 px-2 w-1/4">
                                {data.avg}
                              </div>
                              <div className="text-right min-w-[84px] w-auto h-full">
                                {benchmark?.value === "" && (
                                  <button
                                    className="text-nowrap h-full"
                                    onClick={() =>
                                      setIsBenchmarkControlOpen(
                                        !isBenchmarkControlOpen
                                      )
                                    }
                                  >
                                    Set Benchmark
                                  </button>
                                )}
                                {benchmark?.value !== "" && (
                                  <div
                                    className={`text-center h-full flex items-center justify-center p-1 ${
                                      benchmark?.value > data.avg
                                        ? "bg-red-50 text-red-500"
                                        : "bg-blue-50 text-blue-500"
                                    }`}
                                  >
                                    {calculatePercentageDifference(
                                      data.avg,
                                      benchmark?.value
                                    )}
                                    %
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
