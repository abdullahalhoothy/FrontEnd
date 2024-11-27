import React, { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { useUIContext } from "../../context/UIContext";
import BottomDrawer from "../../components/BottomDrawer/BottomDrawer";

const Profile = () => {
  const { isMobile, isDrawerOpen, setIsDrawerOpen } = useUIContext();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    nav("/auth");
  }

  return (
    <div className="relative lg:h-full flex flex-col">
      {isMobile ? (
        location.pathname === '/profile' && (
          <>
            <ProfileDrawer />
            <button className="bg-white border p-2.5 fixed w-full bottom-0 left-0 right-0 z-[5] flex items-center gap-2 text-gray-400 font-normal" onClick={() => setIsDrawerOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                <path d="M18 15L12 9L6 15" stroke-width="1.5" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Tap to see more options
            </button>
          </>
        )
      ) : (
        <div className="h-full w-96 bg-[#115740] px-1 py-1">
          <div className="w-full h-full bg-white rounded">
            <ProfileContent />
          </div>
        </div>
      )}

    </div>
  );
};

function ProfileContent() {
  const [isExpanded, setIsExpanded] = useState({
    billing: false,
  });

  const toggleExpand = (section: keyof typeof isExpanded) => {
    setIsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      <div className="text-2xl pl-6 pt-4 font-semibold mb-4">Account</div>
      <div className="flex flex-col justify-center items-center">
        <MenuItem label="Account" to="/profile" />
        <MenuItem label="Change Password" to="/profile/change-password" />
        <MenuItem label="Change Email" to="/profile/change-email" />
        <ExpandableMenuItem
          label="Billing"
          isExpanded={isExpanded.billing}
          onClick={() => toggleExpand("billing")}
        >
          <SubMenuItem label="Payment methods" to="/profile/payment-methods" />
        </ExpandableMenuItem>
      </div>
    </>
  );
}

function ProfileDrawer() {
  const snapPoints = ["192", 1];
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
      drawerContent.removeAttribute("aria-hidden");
      drawerContent.removeAttribute("tabIndex");
    }
  }, []);

  return (
    <>
      <BottomDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={false} defaultSnap={0.375} snapPoints={[0, 0.375, 1]}>
        <div className="flex flex-col h-full overflow-hidden">
          <ProfileContent />
        </div>
      </BottomDrawer>
    </>
  );
}

function MenuItem({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="text-primary w-full py-2 pl-8  mb-2 font-bold hover:bg-gray-100 transition-all"
    >
      {label}
    </Link>
  );
}

function ExpandableMenuItem({
  label,
  isExpanded,
  onClick,
  children,
}: {
  label: string;
  isExpanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full px-4 text-base text-primary py-2 pl-8 font-bold mb-2 hover:bg-gray-200"
      >
        {label}
        <span className="ml-2">
          {isExpanded ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.99977 9.00005L11.9998 15L17.9998 9"
                strokeWidth="1.5"
                strokeMiterlimit="16"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00005 6L15 12L9 18"
                strokeWidth="1.5"
                strokeMiterlimit="16"
              />
            </svg>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="flex flex-col justify-between w-full text-base mb-2">
          {children}
        </div>
      )}
    </>
  );
}

function SubMenuItem({ label, to }: { label: string; to: string }) {
  return (
    <Link to={to} className="block px-4 pl-12 py-2 text-sm hover:bg-gray-200">
      {label}
    </Link>
  );
}

export default Profile;
