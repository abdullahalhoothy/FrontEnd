import styles from "./Loader.module.css";

function Loader() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loader}></div>
    </div>
  );
}

export default Loader;
