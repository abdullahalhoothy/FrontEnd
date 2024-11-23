import React, { useLayoutEffect, useState } from "react";
import SideBar from "../SideBar/SideBar";
import { Route, Routes } from "react-router";
import NotFound from "../../pages/NotFound/NotFound";
import Dataview from "../../pages/Dataview/Dataview";
import Auth from "../../pages/Auth/Auth";
import MapContainer from "../../pages/MapContainer/MapContainer";
import Home, { HomeContent } from "../../pages/Home/Home";
import Profile from "../../pages/Profile/Profile";
import ProfileLayout from "../../pages/Profile/ProfileLayout";
import OrganizationLayout from "../../pages/Organization/OrganizationLayout";
import Organization from "../../pages/Organization/Organization";
import BillingLayout from "../../pages/Billing/BillingLayout";
import Billing from "../../pages/Billing/Billing";
import ProfileMain from "../../pages/Profile/Routes/ProfileMain/ProfileMain";
import InternalCostEstimator from "../../pages/Billing/Routes/InternalCostEstimator/InternalCostEstimator";
import ChangeEmail from "../../pages/ChangeEmail/ChangeEmail";
import ChangePassword from "../../pages/ChangePassword/ChangePassword";
import PaymentMethods from "../../pages/PaymentMethods/PaymentMethods";
import PaymentMethod from "../../pages/PaymentMethod/PaymentMethod";
import MobileNavbar from "../MobileNavbar/MobileNavbar";
import { Drawer } from "vaul";
import clsx from "clsx";

const Layout = () => {
  return (
    <div className="flex flex-col">
      <MobileNavbar />

      <div className="flex lg:flex-row flex-col w-screen h-screen">
        <SideBar />

        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path={"/tabularView"} element={<></>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Home />} />
          <Route path={"/profile/*"} element={<Profile />} />
          <Route path={"/organization/*"} element={<Organization />} />
          <Route path={"/billing/*"} element={<Billing />} />
        </Routes>

        <Routes>
          <Route path={"/"} element={<MapContainer />} />
          <Route path="/tabularView" element={<Dataview />} />

          <Route path={"/profile"} element={<ProfileLayout />}>
            <Route path="" element={<ProfileMain />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="change-email" element={<ChangeEmail />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="payment-methods/add" element={<PaymentMethod />} />
          </Route>
          <Route path={"/organization"} element={<OrganizationLayout />}>
            <Route
              path=""
              element={<CommingSoon data={"Organization Features"} />}
            />
          </Route>
          <Route path={"/billing"} element={<BillingLayout />}>
            <Route path="" element={<InternalCostEstimator />} />
            <Route path="price" element={<CommingSoon data={"Price"} />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default Layout;

const CommingSoon = ({ data }: { data: string }) => {
  return (
    <p className="h-full flex justify-center items-center text-4xl">
      {data} Comming Soon...
    </p>
  );
};
