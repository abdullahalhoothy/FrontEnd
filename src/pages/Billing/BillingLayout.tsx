import React from "react";
import { Outlet } from "react-router";

const BillingLayout = () => {
  return (
    <>
      <div className="lg:w-[80%] flex-1 lg:h-full">
        <Outlet />
      </div>
      <div className="lg:hidden block w-full pt-48"></div>
    </>
  );
};

export default BillingLayout;
