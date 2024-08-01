import React, { useState } from "react";
import styles from "./CatalogueCard.module.css";
import { CatalogueCardProps } from "../../types/allTypesAndInterfaces";
import { useCatalogContext } from "../../context/CatalogContext";
import placeholderImage from "../../placeholderImage/catalogue.png";

function CatalogueCard(props: CatalogueCardProps) {
  const {
    id,
    name,
    description,
    thumbnail_url,
    records_number,
    can_access,
    onMoreInfo,
    typeOfCard,
  } = props;

  const { selectedContainerType: containerType } = useCatalogContext();
  const [isImageError, setIsImageError] = useState(false);

  function handleImageError() {
    setIsImageError(true);
  }

  function renderActionItems() {
    if (containerType !== "Home") {
      return (
        <li className={styles.actionItem}>
          <div
            onClick={onMoreInfo}
            className={`${styles.moreInfo} ${styles.add}`}
          >
            + Add
          </div>
        </li>
      );
    } else {
      return (
        <>
          <li className={styles.actionItem}>
            <div onClick={onMoreInfo} className={styles.moreInfo}>
              Load Data
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
            <li className={styles.actionItem}>
              <div onClick={onMoreInfo} className={styles.moreInfo}>
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
    <div className={styles.catalogueWrapper}>
      <div className={styles.ribbonWrapper}>
        <span className={styles.ribbonChild}>
          <span>{can_access ? "Free" : "Paid"}</span>
        </span>
      </div>
      <div className={styles.card}>
        <div className={styles.cardCover}>
          <img
            alt={name}
            src={isImageError ? placeholderImage : thumbnail_url}
            onError={handleImageError}
            className={`${styles.cardImage} ${
              isImageError ? styles.placeholderImage : ""
            }`}
          />
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <div className={styles.cardMetaDetail}>
              <div className={styles.cardMetaTitle}>{name}</div>
            </div>
          </div>
          <div className={styles.metaDataWrapper}>
            <span className={styles.catalogueRow}>
              {records_number || 0} rows
            </span>
            <p className={styles.catalogueDesc}>{description}</p>
          </div>
        </div>
        <ul className={styles.cardActions}>{renderActionItems()}</ul>
      </div>
    </div>
  );
}

export default CatalogueCard;
