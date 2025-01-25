import React from 'react';
import { MdCheckCircleOutline } from 'react-icons/md';
import styles from './SavedIconFeedback.module.css';

function SavedIconFeedback() {
  return (
    <div className="flex h-full items-center justify-center flex-col text-center mt-5 text-2xl font-sans text-[#333]">
      <MdCheckCircleOutline className="text-[rgb(17,87,64)] text-[50px] mb-2.5" />
      <p>Saved successfully!</p>
    </div>
  );
}

export default SavedIconFeedback;
