// src/components/Layout/Layout.tsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import styles from "./Layout.module.css";
import SideMenuLoader from "../SideMenuLoader/SideMenuLoader";
import Home from "../../pages/Home/Home";
import Dataview from "../../pages/Dataview/Dataview";
import Auth from "../Auth/Auth";
import Profile from "../Profile/Profile";
import AuthRoute from "../Auth/AuthRoute";

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <SideMenuLoader />
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tabularView" element={<Dataview />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<AuthRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default Layout;