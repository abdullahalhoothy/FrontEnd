import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { CategoryData } from "../../types/allTypesAndInterfaces";
import { formatSubcategoryName } from "../../utils/helperFunctions";

interface CategoriesBrowserSubCategoriesProps {
    categories: CategoryData;
    openedCategories: string[];
    onToggleCategory: (category: string) => void;
    getTypeCounts: (type: string) => {
        includedCount: number[];
        excludedCount: number[];
    };
    onRemoveType: (type: string, layerId: number, isExcluded: boolean) => void;
    onAddToIncluded: (type: string) => void;
    onAddToExcluded: (type: string) => void;
}

const CategoriesBrowserSubCategories = ({
    categories,
    openedCategories,
    onToggleCategory,
    getTypeCounts,
    onRemoveType,
    onAddToIncluded,
    onAddToExcluded,
}: CategoriesBrowserSubCategoriesProps) => {
    return (
        <div className="flex flex-col gap-2.5">
            {Object.entries(categories).map(([category, types]) => (
                <div key={category} className="flex-1 min-w-[200px] whitespace-nowrap">
                    <button
                        className="font-semibold text-lg cursor-pointer flex justify-start items-center w-full hover:bg-gray-200 transition-all rounded"
                        onClick={() => onToggleCategory(category)}
                    >
                        <span>
                            {openedCategories.includes(category) ? (
                                <FaCaretDown />
                            ) : (
                                <FaCaretRight />
                            )}
                        </span>
                        {category}
                    </button>

                    <div
                        className={
                            "w-full basis-full overflow-hidden transition-all" +
                            (!openedCategories.includes(category) && " h-0")
                        }
                    >
                        <div className="flex flex-wrap gap-3 mt-3">
                            {(types as string[]).map((type: string) => {
                                const counts = getTypeCounts(type);
                                const included = counts.includedCount.length > 0;
                                const excluded = counts.excludedCount.length > 0;
                                const isMixed = included && excluded;

                                const colors =
                                    isMixed
                                        ? "bg-[#FFE8D6] border-[#C86B31] text-[#CD5C08]"
                                        : included
                                            ? "bg-[rgb(40,167,69)] border-[#167a1b] text-white"
                                            : excluded
                                                ? "bg-[#ffebee] border-[#f44336] text-[#c62828]"
                                                : "";


                                return (
                                    <div
                                        key={type}
                                        className={`flex items-center justify-between py-2 px-4 bg-[#f0f0f0] border border-[#ccc] rounded text-[14px] ${colors}`}
                                    >
                                        <div className="flex items-center">
                                            {counts.excludedCount.map((layerId) => (
                                                <button
                                                    key={`excluded-${layerId}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onRemoveType(type, layerId, true);
                                                    }}
                                                    className="text-xs opacity-75 hover:opacity-100 mr-1 bg-black/10 px-1.5 rounded-md"
                                                >
                                                    {layerId}
                                                </button>
                                            ))}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onAddToExcluded(type);
                                                }}
                                                className={`font-bold hover:opacity-75 transition-all cursor-pointer w-6 h-6 flex items-center justify-center rounded ${included || excluded ? 'bg-black/10' : 'bg-black/5'
                                                    }`}
                                            >
                                                −
                                            </button>
                                        </div>

                                        <span className="mx-2">{formatSubcategoryName(type)}</span>

                                        <div className="flex items-center">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onAddToIncluded(type);
                                                }}
                                                className={`font-bold hover:opacity-75 transition-all cursor-pointer w-6 h-6 flex items-center justify-center rounded ${included || excluded ? 'bg-black/10' : 'bg-black/5'
                                                    }`}
                                            >
                                                +
                                            </button>
                                            {counts.includedCount.map((layerId) => (
                                                <button
                                                    key={`included-${layerId}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onRemoveType(type, layerId, false);
                                                    }}
                                                    className="text-xs opacity-75 hover:opacity-100 ml-1 bg-black/10 px-1.5 rounded-md"
                                                >
                                                    {layerId}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CategoriesBrowserSubCategories; 