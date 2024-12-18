import { Layer } from "../../types/allTypesAndInterfaces";
import { formatSubcategoryName } from "../../utils/helperFunctions";
import { IoSync, IoClose } from "react-icons/io5";

interface LayerDisplaySubCategoriesProps {
  layer: Layer;
  layerIndex: number;
  onRemoveType: (type: string, layerId: number, isExcluded: boolean) => void;
  onToggleTypeInLayer: (type: string, layerId: number, setAsExcluded: boolean) => void;
  onNameChange: (index: number, newName: string) => void;
}

const LayerDisplaySubCategories = ({
  layer,
  layerIndex,
  onRemoveType,
  onToggleTypeInLayer,
  onNameChange,
}: LayerDisplaySubCategoriesProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full">
      <div className="flex flex-col w-full">
        <div className="px-4 py-2 border-b border-gray-300">
          <label
            className="flex items-center gap-2 text-md font-medium text-black"
            htmlFor={`selectedCategories-${layer.id}`}
          >
            <span className="text-center font-bold rounded-full text-sm bg-gray-200/50 border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-6 h-6 flex items-center justify-center">
              {layer.id}
            </span>
            <input 
              type="text" 
              className="w-24 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1" 
              defaultValue={`Layer ${layerIndex + 1}`} 
              onChange={(e) => onNameChange(layerIndex, e.target.value)}
            />
          </label>
        </div>
        <div className="p-2.5 flex gap-2 flex-wrap">
          {layer.includedTypes.map((type: string) => (
            <div
              key={type}
              className="flex items-center py-2 px-4 bg-[rgb(40,167,69)] border-[#167a1b] text-white rounded text-[14px] relative"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleTypeInLayer(type, layer.id, true);
                }}
                className="flex items-center justify-center text-[#f44336] bg-white/60 hover:bg-white/80 rounded-md mr-2 p-1"
              >
                <IoSync className="w-3.5 h-3.5" />
              </button>

              <span className="mx-2">
                {formatSubcategoryName(type)}
              </span>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveType(type, layer.id, false);
                }}
                className="flex items-center justify-center hover:opacity-75 ml-2"
              >
                <IoClose className="w-4 h-4" />
              </button>
            </div>
          ))}

          {layer.excludedTypes.map((type: string) => (
            <div
              key={type}
              className="flex items-center py-2 px-4 bg-[#ffebee] border-[#f44336] text-[#c62828] rounded text-[14px] relative"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleTypeInLayer(type, layer.id, false);
                }}
                className="flex items-center justify-center text-[rgb(40,167,69)] bg-black/10 hover:bg-black/20 rounded-md mr-2 p-1"
              >
                <IoSync className="w-3.5 h-3.5" />
              </button>

              <span className="mx-2">
                {formatSubcategoryName(type)}
              </span>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveType(type, layer.id, true);
                }}
                className="flex items-center justify-center hover:opacity-75 ml-2"
              >
                <IoClose className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayerDisplaySubCategories; 