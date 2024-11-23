import { useState } from "react";
import { FaAngleRight, FaNetworkWired } from "react-icons/fa";
import {
  MdInfo,
  MdLogout,
  MdMap,
  MdPerson,
  MdTableChart,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { HiCurrencyDollar } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const SideBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isColabsed, setIsColabsed] = useState(true);
  const navigate = useNavigate();

  return (
    <>
      <div
        className={
          "lg:flex justify-start flex-col hidden relative bg-[#115740] transition-all " +
          (isColabsed ? "w-14" : "w-48")
        }
      >
        {/* Sidebar Collabs Button */}
        <div
          className="sidebar-icon w-fit"
          onClick={() => {
            setIsColabsed(!isColabsed);
          }}
        >
          <FaAngleRight
            className={
              "w-6 h-6 transition-all delay-100 fill-white " +
              (!isColabsed && " rotate-180")
            }
          />
        </div>

        {/* Map Button */}
        <div
          className="sidebar-icon"
          onClick={() => {
            setIsColabsed(true);
            setTimeout(() => {
              navigate("/");
            }, 100);
          }}
        >
          <div>
            <MdMap className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && <span className="ml-2 text-white truncate">Map</span>}
        </div>

        {/* Tabluar View Button */}
        <Link to={"/tabularView"} className="sidebar-icon">
          <div>
            <MdTableChart className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && (
            <span className="ml-2 text-white truncate">Tabular View</span>
          )}
        </Link>

        {/* Organization View Button */}
        <Link to={"/organization"} className="sidebar-icon">
          <div>
            <FaNetworkWired className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && <span className="ml-2 text-white">Organization</span>}
        </Link>

        {/* Billing View Button */}
        <Link to={"/billing"} className="sidebar-icon">
          <div>
            <HiCurrencyDollar className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && (
            <span className="ml-2 text-white">Billing and Cost Management</span>
          )}
        </Link>

        {/* Bottom Icons */}
        <div className="absolute bottom-5 w-full">
          <Link to={"/profile"} className="sidebar-icon">
            <div>
              <MdPerson className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isColabsed && (
              <span className="ml-2 text-white truncate">Account</span>
            )}
          </Link>

          <a className="sidebar-icon" href="https://northernacs.com/">
            <div>
              <MdInfo className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isColabsed && (
              <span className="ml-2 text-white truncate">About Us</span>
            )}
          </a>

          <div
            className="sidebar-icon"
            onClick={() => {
              logout();
              setIsColabsed(true);
              navigate("/auth");
            }}
          >
            <div>
              <MdLogout className="w-6 h-6 transition-all fill-white" />
            </div>
            {!isColabsed && (
              <span className="ml-2 text-white truncate">
                {!isAuthenticated ? <>Login</> : <>Logout</>}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const SideBarContent = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Map Button */}
      <div className="sidebar-icon" onClick={() => navigate("/")}>
        <div>
          <MdMap className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 truncate">Map</span>
      </div>

      {/* Tabluar View Button */}
      <Link to={"/tabularView"} className="sidebar-icon">
        <div>
          <MdTableChart className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 truncate">Tabular View</span>
      </Link>

      {/* Organization View Button */}
      <Link to={"/organization"} className="sidebar-icon">
        <div>
          <FaNetworkWired className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 ">Organization</span>{" "}
      </Link>

      {/* Billing View Button */}
      <Link to={"/billing"} className="sidebar-icon">
        <div>
          <HiCurrencyDollar className="w-6 h-6 transition-all " />
        </div>
        <span className="ml-2 ">Billing and Cost Management</span>
      </Link>

      {/* Bottom Icons */}
      <div className="absolute bottom-5 w-full">
        <Link to={"/profile"} className="sidebar-icon">
          <div>
            <MdPerson className="w-6 h-6 transition-all " />
          </div>
          <span className="ml-2 truncate">Account</span>
        </Link>

        <a className="sidebar-icon" href="https://northernacs.com/">
          <div>
            <MdInfo className="w-6 h-6 transition-all " />
          </div>
          <span className="ml-2 truncate">About Us</span>
        </a>

        {/* <div
          className="sidebar-icon"
          onClick={() => {
            logout();
            setIsColabsed(true);
            navigate("/auth");
          }}
        >
          <div>
            <MdLogout className="w-6 h-6 transition-all fill-white" />
          </div>
          {!isColabsed && (
            <span className="ml-2 text-white truncate">
              {!isAuthenticated ? <>Login</> : <>Logout</>}
            </span>
          )}
        </div> */}
      </div>
    </>
  );
};

export default SideBar;
