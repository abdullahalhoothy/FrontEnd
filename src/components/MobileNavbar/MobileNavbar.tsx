import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { BiCloset, BiMenu, BiX } from "react-icons/bi";
import { MdPerson } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SideBarContent } from "../SideBar/SideBar";

export default function MobileNavbar() {
  const { isAuthenticated, authResponse } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);
  return (
    <div className="lg:hidden bg-white ">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/slocator.png" alt="Google Logo" className="w-7" />
          </div>
        </Link>
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 ">
                  <span className="text-gray-500 text-sm font-medium">JD</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth" className="text-base">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-2">
        <button
          className="flex items-center gap-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <BiMenu className="text-2xl" />
        </button>
      </div>
      <>
        {isSidebarOpen && (
          <div
            className={`fixed inset-0 z-10 bg-black transition-opacity duration-300 ${isSidebarOpen ? "opacity-40" : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <div
          className={`fixed left-0 top-0 bottom-2 z-10 outline-none h-full bg-primary w-[310px] flex transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-[-100%]"
            }`}
        >
          <div className="grow py-4 mt-4 flex flex-col bg-primary text-white">
            <SideBarContent />
          </div>
        </div>
      </>


    </div>
  );
}
