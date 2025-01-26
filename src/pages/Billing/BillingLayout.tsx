import React from 'react';
import { Outlet } from 'react-router';

const BillingLayout = () => {
  return (
    <>
      <div className="lg:w-[80%] flex-1 lg:h-full lg:overflow-auto lg:mb-0 mb-14">
        <Outlet />
      </div>
    </>
  );
};

export default BillingLayout;
