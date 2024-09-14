import { IoCloseCircleOutline, IoCloseOutline } from "react-icons/io5";
import { usePolygonsContext } from "../../context/PolygonsContext";
import React from "react";
import * as turf from "@turf/turf";

function CloseButton() {
  const { setSelectedPolygon } = usePolygonsContext();
  const closePopup = () => {
    setSelectedPolygon(null);
  };
  return (
    <div className=" absolute top-2 right-2">
      <button
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-all"
        onClick={closePopup}
      >
        <IoCloseOutline className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function StatisticsPopup() {
  const { selectedPolygon, sections, setSelectedPolygon } =
    usePolygonsContext();
  if (!selectedPolygon || !sections) return null;

  return (
    <div className="bg-white rounded-lg border shadow-sm max-h-96 overflow-auto min-w-[44rem] absolute bottom-12 right-56 p-4 z-10">
      <CloseButton />
      <div className="flex justify-between mr-8">
        <div className="flex-1">
          <img src="/slocator.png" alt="logo" className="w-16 h-16" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5 text-sm">
          <div className="h-12 flex items-center justify-center bg-blue-500 text-white p-2 ">
            Area {turf.area(selectedPolygon).toLocaleString()} KM²
          </div>
          <div className="flex items-center justify-between gap-0.5">
            <div className="w-full bg-blue-500 text-white p-2 text-center">
              Count
            </div>
            <div className="w-full bg-blue-500 text-white p-2 text-center">
              %
            </div>
            <div className="w-full bg-blue-500 text-white p-2 text-center">
              Avg
            </div>
            <div className="w-full bg-blue-500 text-white p-2 text-center text-nowrap">
              vs Benchmark
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm mt-4">
        {sections.map((section, index) => {
          return (
            <div className="flex flex-col">
              <div className="flex font-semibold border-b-[3px] border-blue-500 pb-1">
                <div className="flex-1 text-blue-500 text-base capitalize">
                  {section.title.split("_").join(" ")}
                </div>
                <div className="flex-1"></div>
                <div className="flex-1"></div>
                <div className="flex-1"></div>
              </div>
              <div className="flex flex-col gap-1 py-1  mr-8">
                {section.points.map((point, valueIndex) => (
                  <div
                    key={valueIndex}
                    className={`flex justify-end ${
                      valueIndex % 2 === 0 ? "" : ""
                    } text-gray-900 font-semibold py-1`}
                  >
                    <div className="flex-1 text-nowrap ">
                      {point.prdcer_layer_name}
                    </div>
                    <div className="flex-1 flex justify-between gap-0.5">
                      <div className="w-[70px] text-center">{point.count}</div>
                      <div className="w-[70px] text-center">{`${point.percentage}%`}</div>
                      <div className="w-[70px] text-center">{point.avg}</div>
                      <div className="w-[101px] text-center">
                        <span className="w-full opacity-0 text-center text-nowrap">
                          vs Benchmark
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
