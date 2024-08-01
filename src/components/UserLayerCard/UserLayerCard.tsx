import React from "react";
import styles from "./UserLayerCard.module.css";
import placeHolderImage from "../../placeholderImage/layer.png";
import { UserLayerCardProps } from "../../types/allTypesAndInterfaces";

function UserLayerCard(props: UserLayerCardProps) {

  function handleMoreInfo() {
    props.onMoreInfo({
      id: props.id,
      name: props.name,
      typeOfCard: props.typeOfCard,
    });
  }


  return (
    <div className={styles.catalogueWrapper}>
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
            <span className={styles.catalogueRow}>{props.legend}</span>
            <p className={styles.catalogueDesc}>{props.description}</p>
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
