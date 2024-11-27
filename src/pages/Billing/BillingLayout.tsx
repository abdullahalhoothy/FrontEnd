import React from "react";
import { Outlet } from "react-router";

const BillingLayout = () => {
  return (
    <>
      <div className="lg:w-[80%] flex-1 h-full overflow-auto">
        <Outlet />
      </div>
      <div className="lg:hidden block w-full pt-36"></div>
    </>
  );
};

export default BillingLayout;
