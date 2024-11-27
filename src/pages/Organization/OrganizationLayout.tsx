import React from 'react';
import { Outlet } from 'react-router';

const OrganizationLayout = () => {
    return (
        <div className='h-full lg:w-[80%]'>
            <Outlet />
        </div>
    );
}

export default OrganizationLayout;
