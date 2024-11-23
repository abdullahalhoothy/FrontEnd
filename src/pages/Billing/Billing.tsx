import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Drawer } from "vaul";
import { useUIContext } from "../../context/UIContext";

const Billing = () => {
  const { isMobile } = useUIContext();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) nav("/auth");
  }, []);

  return (
    <>
      {isMobile ? (
        <BillingDrawer />
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
          to={"/billing"}
        >
          Internal Cost Estimator
        </Link>

        <Link
          className="text-[#115740] w-full py-2 pl-8  mb-2 font-bold hover:bg-gray-100 transition-all"
          to={"/billing"}
        >
          Price Estimator
        </Link>
      </div>
    </>
  );
}

function BillingDrawer() {
  const snapPoints = ["192", 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const location = useLocation();

  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSnap(snapPoints[0]);
  }, [location.pathname]);

  useEffect(() => {
    const drawerContent = contentRef.current;

    if (drawerContent) {
      // Remove potential focus-trap attributes
      drawerContent.removeAttribute("aria-hidden");
      drawerContent.removeAttribute("tabIndex");
    }
  }, []);

  return (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      modal={false}
      open={true}
      dismissible={false}
    >
      <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      <Drawer.Portal>
        <div ref={contentRef} tabIndex={-1} className="drawer-content">
          <Drawer.Content
            data-testid="content"
            className="z-10 fixed flex flex-col bg-white border border-gray-200 border-b-none rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px]"
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-8" />
            <div className="flex flex-col h-full overflow-hidden">
              <BillingContent />
            </div>
          </Drawer.Content>
        </div>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
export default Billing;
