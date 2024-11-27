import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import BottomDrawer from '../../components/BottomDrawer/BottomDrawer';
import { useUIContext } from '../../context/UIContext';

const Organization = () => {
    const { isMobile, isDrawerOpen, setIsDrawerOpen } = useUIContext();
    const { isAuthenticated } = useAuth();
    const nav = useNavigate();

    if (!isAuthenticated) {
        nav("/auth");
    }
    return (
        <>
            {isMobile ? (
                <>
                    <OrganizationDrawer />
                    <button className="bg-white border p-2.5 fixed w-full bottom-0 left-0 right-0 z-[5] flex items-center gap-2 text-gray-400 font-normal" onClick={() => setIsDrawerOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                            <path d="M18 15L12 9L6 15" stroke-width="1.5" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Tap to see more options
                    </button>
                </>
            ) : (
                <div className='h-full w-96 bg-[#115740] px-1 py-1'>
                    <OrganizationContent />
                </div>
            )}
        </>
    );
}

function OrganizationContent() {
    return (
        <>
            <div className='w-full h-full bg-white rounded'>
                <div className='text-2xl pl-6 pt-4 font-semibold mb-4'>
                    Organization
                </div>
                <div className='flex flex-col justify-center items-center'>

                    <Link className='text-[#115740] w-full py-2 pl-8  mb-2 font-bold hover:bg-gray-100 transition-all'
                        to={'/organization'}>Organization</Link>

                </div>
            </div>
        </>
    );
}


function OrganizationDrawer() {
    const { isDrawerOpen, setIsDrawerOpen } = useUIContext();
    return (
        <BottomDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={false} defaultSnap={0.375} snapPoints={[0, 0.375, 1]}>
            <OrganizationContent />
        </BottomDrawer>
    );
}

export default Organization;
