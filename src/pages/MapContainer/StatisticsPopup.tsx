import { IoCloseCircleOutline, IoCloseOutline } from "react-icons/io5";
import { usePolygonsContext } from "../../context/PolygonsContext";

export default function StatisticsPopup() {
  const { selectedPolygon, pointsInsidePolygon, setSelectedPolygon } =
    usePolygonsContext();

  if (!selectedPolygon || !pointsInsidePolygon) return null;

  const closePopup = () => {
    setSelectedPolygon(null);
  };

  if (true) {
    return;
  }
  return (
    <div className="bg-white rounded-lg border shadow-sm min-h-64 min-w-96 absolute bottom-12 right-56 p-4 z-10">
      Statistics
      <div className=" absolute top-2 right-2">
        <button
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-all"
          onClick={closePopup}
        >
          <IoCloseOutline className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
