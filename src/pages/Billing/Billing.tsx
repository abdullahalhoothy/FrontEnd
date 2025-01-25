import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useUIContext } from '../../context/UIContext';
import BottomDrawer from '../../components/BottomDrawer/BottomDrawer';

const Billing = () => {
  const { isMobile, isDrawerOpen, setIsDrawerOpen } = useUIContext();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) nav('/auth');
  }, []);

  return (
    <>
      {isMobile ? (
        <>
          <BillingDrawer />
          <button
            className="bg-white border p-2.5 fixed w-full bottom-0 left-0 right-0 z-[5] flex items-center gap-2 text-gray-400 font-normal"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
            >
              <path
                d="M18 15L12 9L6 15"
                stroke-width="1.5"
                stroke-miterlimit="16"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Tap to see more options
          </button>
        </>
      ) : (
        <div className="h-full w-96 bg-[#115740] px-1 py-1">
          <div className="w-full h-full bg-white rounded">
            <BillingContent />
          </div>
        </div>
      )}
    </>
  );
};

function BillingContent() {
  return (
    <>
      <div className="text-2xl pl-6 pt-4 font-semibold mb-4">Billing</div>

      <div className="flex flex-col justify-center items-center">
        <Link
          className="text-[#115740] w-full py-2 pl-8  mb-2 font-bold hover:bg-gray-100 transition-all"
          to={'/billing'}
        >
          Internal Cost Estimator
        </Link>

        <Link
          className="text-[#115740] w-full py-2 pl-8  mb-2 font-bold hover:bg-gray-100 transition-all"
          to={'/billing'}
        >
          Price Estimator
        </Link>
      </div>
    </>
  );
}

function BillingDrawer() {
  const snapPoints = ['192', 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const location = useLocation();

  const contentRef = React.useRef<HTMLDivElement>(null);
  const { isDrawerOpen, setIsDrawerOpen } = useUIContext();

  useEffect(() => {
    setSnap(snapPoints[0]);
  }, [location.pathname]);

  useEffect(() => {
    const drawerContent = contentRef.current;

    if (drawerContent) {
      // Remove potential focus-trap attributes
      drawerContent.removeAttribute('aria-hidden');
      drawerContent.removeAttribute('tabIndex');
    }
  }, []);

  return (
    <>
      <BottomDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        modal={false}
        defaultSnap={0.375}
        snapPoints={[0, 0.375, 1]}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <BillingContent />
        </div>
      </BottomDrawer>
    </>
  );
}
export default Billing;
