import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Profile = () => {
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  const [isExpanded, setIsExpanded] = useState({
    billing: false,
  });

  const toggleExpand = (section: keyof typeof isExpanded) => {
    setIsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isAuthenticated) {
    nav("/auth");
  }

  return (
    <div className="h-full w-96 bg-[#115740] px-1 py-1">
      <div className="w-full h-full bg-white rounded">
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
            <SubMenuItem
              label="Payment methods"
              to="/profile/payment-methods"
            />
          </ExpandableMenuItem>
        </div>
      </div>
    </div>
  );
};

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
