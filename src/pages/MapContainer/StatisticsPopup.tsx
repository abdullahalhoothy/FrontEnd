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
  const { selectedPolygon, filteredGeoPoints, setSelectedPolygon } =
    usePolygonsContext();

  if (!selectedPolygon || !filteredGeoPoints) return null;

  interface ValueItem {
    category: string;
    values: string[];
  }

  interface CategoryItem {
    category: string;
    values: ValueItem[];
  }

  const data: CategoryItem[] = [
    {
      category: "Market Size",
      values: [
        {
          category: "2019 Total Households",
          values: ["18,421", "68,461", "114,061"],
        },
        {
          category: "2019 Total Population",
          values: ["21,635", "183,211", "338,996"],
        },
      ],
    },
    {
      category: "Daytime Population",
      values: [
        {
          category: "Daytime Population at Work",
          values: ["22,854", "63,736", "159,214"],
        },
      ],
    },
    {
      category: "Age",
      values: [
        {
          category: "Generation Z",
          values: ["4,750", "33,263", "43,194"],
        },
        {
          category: "Millennials",
          values: ["7,943", "62,480", "79,873"],
        },
        {
          category: "Generation X",
          values: ["11,664", "48,315", "88,635"],
        },
        {
          category: "Baby Boomers",
          values: ["6,937", "41,299", "78,473"],
        },
      ],
    },
    {
      category: "Expenditures",
      values: [
        {
          category: "Total Household Expenditure",
          values: ["$1,007,413", "$3,475,380", "$5,637,195"],
        },
      ],
    },
    {
      category: "Shopping",
      values: [
        {
          category: "IKEA",
          values: ["18,901", "70,936", "138,756"],
        },
        {
          category: "Urban Barn",
          values: ["2,095", "6,851", "8,551"],
        },
        {
          category: "Online furniture & appliance stores",
          values: ["2,367", "8,273", "13,740"],
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm min-h-96 overflow-auto min-w-[44rem] absolute bottom-12 right-56 p-4 z-10">
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
        <div className="flex flex-col">
          <div className="flex font-semibold border-b-[3px] border-blue-500 pb-1">
            <div className="flex-1 text-blue-500 text-base">Ratings</div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
          </div>
          <div className="flex flex-col gap-1 py-1  mr-8">
            {filteredGeoPoints.map((point, valueIndex) => (
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
                  <div className="w-[70px] text-center">
                    {point.features.length}
                  </div>
                  <div className="w-[70px] text-center">{`${point.percentageInside}%`}</div>
                  <div className="w-[70px] text-center">{point.avgRating}</div>
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
        <div className="flex flex-col">
          <div className="flex font-semibold border-b-[3px] border-blue-500 pb-1">
            <div className="flex-1 text-blue-500 text-base">
              Total User Ratings
            </div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
          </div>
          <div className="flex justify-end flex-col gap-1 py-1 mr-8">
            {filteredGeoPoints.map((point, valueIndex) => (
              <div
                key={valueIndex}
                className={`flex ${
                  valueIndex % 2 === 0 ? "" : ""
                } text-gray-900 font-semibold py-1`}
              >
                <div className="flex-1 text-nowrap ">
                  {point.prdcer_layer_name}
                </div>
                <div className="flex-1 flex justify-between gap-0.5">
                  <div className="w-[70px] text-center">
                    {point.totalUserRatings}
                  </div>
                  <div className="w-[70px] text-center">{`${point.percentageInside}%`}</div>
                  <div className="w-[70px] text-center">{point.avgRating}</div>
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
      </div>
    </div>
  );
}
