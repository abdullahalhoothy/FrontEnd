import ReactDOM from 'react-dom';
import { ModalProps } from '../../types';
import { useUIContext } from '../../context/UIContext';

function Modal(props: ModalProps) {
  const { children, darkBackground = false, isSmaller = false, hasAutoSize = false } = props;
  const { closeModal, isModalOpen } = useUIContext();

  if (!isModalOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      id={'overlay'}
      className={`z-20 fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center ${
        darkBackground ? 'bg-black/50' : ''
      } ${isSmaller ? 'pointer-events-none' : ''}`}
      onClick={e => {
        e.stopPropagation();
        if ((e.target as HTMLElement).id === 'overlay') {
          closeModal();
        }
      }}
    >
      <div
        className={`bg-white p-5 max-w-[950px] relative ${hasAutoSize ? 'w-auto' : 'w-full lg:h-5/6 h-full'} lg:rounded-lg border shadow overflow-y-auto ${
          isSmaller
            ? 'flex justify-center items-center max-w-[400px] absolute inset-x-0 md:left-[140px]'
            : ''
        } pointer-events-auto`}
      >
        <button
          className="transition-all text-xl w-10 h-10 hover:text-white font-bold hover:bg-red-600 absolute top-0 right-0 rounded-tr-lg"
          onClick={closeModal}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
