import React from 'react';
import { Outlet } from 'react-router';

const ProfileLayout = () => {
  return (
    <div className="flex-1 lg:h-full lg:w-[80%]">
      <Outlet />
    </div>
  );
};

export default ProfileLayout;
