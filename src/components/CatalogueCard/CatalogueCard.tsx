import React, { useState } from "react";
import styles from "./CatalogueCard.module.css";
import { CatalogueCardProps } from "../../types/allTypesAndInterfaces";
import { useCatalogContext } from "../../context/CatalogContext";
import placeholderImage from "../../placeholderImage/catalogue.png";

function Component({
  id,
  name,
  description,
  thumbnail_url,
  records_number,
  can_access,
  onMoreInfo,
  typeOfCard,
}: CatalogueCardProps) {
  const { selectedContainerType: containerType } = useCatalogContext();
  const [isImageError, setIsImageError] = useState(false);

  function handleImageError() {
    setIsImageError(true);
  }

  function renderActionItems() {
    if (containerType !== "Home") {
      return (
        <li className="flex items-center justify-center gap-x-[5px] font-medium text-[#1677ff]">
          <div
            onClick={onMoreInfo}
            className="cursor-pointer inline-flex items-center text-[#1890ff] hover:text-[#40a9ff]"
          >
            + Add
          </div>
        </li>
      );
    } else {
      return (
        <>
          <li className="flex items-center justify-center gap-x-[5px] font-medium text-[#1677ff]">
            <div
              onClick={onMoreInfo}
              className="cursor-pointer inline-flex items-center text-[#1890ff]"
            >
              {can_access ? <>Load Data</> : <>Subscribe</>}
            </div>
            <span
              role="img"
              aria-label="info-circle"
              className="anticon anticon-info-circle"
            >
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="info-circle"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372-166.6 372 372-166.6 372-372 372z"></path>
                <path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path>
              </svg>
            </span>
          </li>
          {!can_access && (
            <li className="flex items-center justify-center gap-x-[5px] font-medium text-[#1677ff]">
              <div
                onClick={onMoreInfo}
                className="cursor-pointer inline-flex items-center text-[#1890ff] hover:text-[#40a9ff]"
              >
                Request Access
              </div>
              <span
                role="img"
                aria-label="info-circle"
                className="anticon anticon-info-circle"
              >
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="info-circle"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372-166.6 372 372-166.6 372-372 372z"></path>
                  <path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path>
                </svg>
              </span>
            </li>
          )}
        </>
      );
    }
  }

  return (
    <div className="relative transition-all">
      <div className="absolute top-0 left-0 z-10 bg-[#ff0000] text-white py-1.5 px-3 rounded-tl rounded-br">
        <span>{can_access ? "Free" : "Paid"}</span>
      </div>
      <div className="border border-[#f0f0f0] rounded overflow-hidden bg-white flex flex-col h-full">
        <div className="overflow-hidden flex justify-center items-center h-[200px]">
          <img
            alt={name}
            fetchpriority="low"
            src={isImageError ? placeholderImage : thumbnail_url}
            onError={handleImageError}
            className={`w-full h-full object-cover ${
              isImageError ? "w-full h-[200px] object-contain scale-[0.8]" : ""
            }`}
            loading="lazy"
          />
        </div>
        <div className="p-4 flex flex-col justify-between flex-grow">
          <div className="mb-4">
            <div className="flex flex-col">
              <div className="text-base font-bold">{name}</div>
            </div>
          </div>
          <div className="mt-2 flex-grow">
            <span className="block text-sm text-[#888]">
              {records_number || 0} points
            </span>
            <p className="m-0 text-sm text-[#555]">{description}</p>
          </div>
        </div>
        <ul className="list-none py-[10px] px-[5px] m-0 flex justify-around bg-[#f0f2f5] border-t border-[#dbdbdb] gap-x-[10px]">
          {renderActionItems()}
        </ul>
      </div>
    </div>
  );
}

const CatalogueCard = React.memo(Component);

export default CatalogueCard;
