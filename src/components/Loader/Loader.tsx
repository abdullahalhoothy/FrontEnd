import styles from './Loader.module.css';

function Loader() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-[40px] p-2 aspect-square rounded-full bg-[#25b09b] animate-spin"></div>
    </div>
  );
}

export default Loader;
