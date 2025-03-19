import React from 'react';
import FirstPage from './FirstPage';
import SecondPage from './SecondPage';
import { useSignUp } from '../../../context/SignUpContext';

const SignUpForm: React.FC = () => {
  const { currentPage, handleNext, handlePrevious, handleSubmit } = useSignUp();

  return (
    <div className="rounded-lg shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)] p-8 lg:w-1/3">
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentPage === 0 ? <FirstPage /> : <SecondPage />}

        <div className="flex sm:flex-col gap-2 justify-between mt-6">
          {currentPage === 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Previous
            </button>
          )}

          <button
            type={currentPage === 1 ? 'submit' : 'button'}
            onClick={currentPage === 0 ? handleNext : undefined}
            className="w-auto flex-grow px-4 py-2 text-sm font-medium text-white bg-secondary border border-transparent rounded-md hover:bg-focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {currentPage === 1 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
