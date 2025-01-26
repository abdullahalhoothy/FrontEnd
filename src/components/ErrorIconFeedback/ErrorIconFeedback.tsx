// src/components/ErrorIconFeedback/ErrorIconFeedback.tsx

import React from 'react';
import { MdOutlineErrorOutline } from 'react-icons/md';
import styles from './ErrorIconFeedback.module.css';

// Component to display error feedback
function ErrorIconFeedback() {
  return (
    <div className="flex h-full items-center justify-center flex-col text-center mt-5 text-2xl font-sans">
      <MdOutlineErrorOutline className="text-[50px] mb-[10px] text-red-500" />
      <p>Failed. Please relogin and try again.</p>
    </div>
  );
}

export default ErrorIconFeedback;
