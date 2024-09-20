import React, { useEffect } from "react";
import styles from "./UserLayerCard.module.css";
import placeHolderImage from "../../placeholderImage/layer.png";
import { UserLayerCardProps } from "../../types/allTypesAndInterfaces";
import { useCatalogContext } from "../../context/CatalogContext";

function UserLayerCard(props: UserLayerCardProps) {
  const { geoPoints } = useCatalogContext();

  function handleMoreInfo() {
    props.onMoreInfo({
      id: props.id,
      name: props.name,
      typeOfCard: props.typeOfCard,
    });
  }

  return (
    <div className={styles.catalogueWrapper + " transition-all"}>
      <div className={styles.ribbonWrapper}></div>
      <div className={styles.card}>
        <div className={styles.cardCover}>
          <img
            alt="Placeholder"
            src={placeHolderImage}
            className={styles.cardImage}
          />
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <div className={styles.cardMetaDetail}>
              <div className={styles.cardMetaTitle}>{props.name}</div>
            </div>
          </div>
          <div className={styles.metaDataWrapper}>
            <span className={styles.catalogueRow}>Legend: {props.legend}</span>
            <p className={styles.catalogueDesc}>
              Description: {props.description}
            </p>
          </div>
        </div>
        <ul className={styles.cardActions}>
          <li className={styles.actionItem}>
            <div
              onClick={handleMoreInfo}
              className={`${styles.moreInfo} ${styles.add}`}
            >
              + Add
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserLayerCard;
