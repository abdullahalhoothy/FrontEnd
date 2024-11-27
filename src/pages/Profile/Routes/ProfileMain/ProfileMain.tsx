import React, { useEffect, useState } from "react";
import styles from "./ProfileMain.module.css";
import {
  FaTimes,
  FaSignOutAlt,
  FaUser,
  FaEnvelope,
  FaDatabase,
  FaLayerGroup,
  FaBook,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import urls from "../../../../urls.json";
import { useAuth } from "../../../../context/AuthContext";
import { HttpReq } from "../../../../services/apiService";
import apiRequest from "../../../../services/apiRequest";

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  prdcer?: {
    prdcer_dataset: Record<string, any>;
    prdcer_lyrs: Record<string, any>;
    prdcer_ctlgs: Record<string, any>;
  };
}

interface PopupInfo {
  type: "dataset" | "layer" | "catalog";
  name: string;
  data: any;
}

const ProfileMain: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const { isAuthenticated, authResponse, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      if (!authResponse || !("idToken" in authResponse)) {
        setError(new Error("Authentication information is missing."));
        setIsLoading(false);
        navigate("/auth");
        return;
      }

      try {
        // await HttpReq<UserProfile>(
        //   urls.user_profile,
        //   setProfile,
        //   setResponseMessage,
        //   setRequestId,
        //   setIsLoading,
        //   setError,
        //   "post",
        //   { user_id: authResponse.localId },
        //   authResponse.idToken
        // );
        const res = await apiRequest({
          url: urls.user_profile,
          method: "POST",
          isAuthRequest: true,
          body: { user_id: authResponse.localId },
        });
        setProfile(res.data.data);
      } catch (err) {
        console.error("Unexpected error:", err);
        logout();
        setError(new Error("An unexpected error occurred. Please try again."));
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, authResponse, navigate]);

  const renderValue = (key: string, value: any): JSX.Element => {
    if (value === null || value === undefined) {
      return <span>N/A</span>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className={styles.nestedList}>
          {value.map((item, index) => (
            <li key={index}>{renderValue(`${key}_${index}`, item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <div className={styles.nestedObject}>
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className={styles.nestedItem}>
              <span className={styles.nestedLabel}>{nestedKey}:</span>
              {renderValue(nestedKey, nestedValue)}
            </div>
          ))}
        </div>
      );
    }

    return <span>{value.toString()}</span>;
  };

  const handleItemClick = (
    type: "dataset" | "layer" | "catalog",
    name: string,
    data: any
  ) => {
    setPopupInfo({ type, name, data });
  };

  const renderPopup = () => {
    if (!popupInfo) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <button
            className={styles.closeButton}
            onClick={() => setPopupInfo(null)}
          >
            <FaTimes />
          </button>
          <h3>{popupInfo.name}</h3>
          <div className={styles.popupContent}>
            {renderValue(popupInfo.name, popupInfo.data)}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: JSX.Element,
    items: Record<string, any>,
    type: "dataset" | "layer" | "catalog"
  ) => {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {icon} {title}
        </h3>
        {Object.entries(items).length > 0 ? (
          <ul className={styles.itemList}>
            {Object.entries(items).map(([key, value]) => (
              <li
                key={key}
                className={styles.itemName}
                onClick={() => handleItemClick(type, key, value)}
              >
                {value.prdcer_layer_name || value.prdcer_ctlg_name || key}
              </li>
            ))}
          </ul>
        ) : (
          <p>No {title.toLowerCase()} available</p>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    setTimeout(() => navigate("/auth"), 500);
    return null;
  }
  if (isLoading)
    return <div className={styles.loading}>Loading profile...</div>;

  if (error) {
    setTimeout(() => navigate("/auth"), 500);
    return null;
  }

  if (!profile) {
    setTimeout(() => navigate("/auth"), 500);
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-scroll lg:px-10 px-4 text-sm">
      <div className="m-5 mx-auto p-5 bg-[#f0f8f0] rounded-lg lg:shadow-md shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="lg:text-2xl text-lg text-[#006400] mb-5 text-center">
            User Profile
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 h-9 lg:text-lg text-base bg-red-600 text-white rounded cursor-pointer  hover:bg-red-700"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
        <div className="bg-white p-5 rounded-lg mb-5">
          <div className="flex items-start mb-2">
            <FaUser className="mr-2 text-[#006400]" />
            <span className="font-bold mr-1 min-w-[100px]">Username:</span>
            {profile.username}
          </div>
          <div className="flex items-start mb-2">
            <FaEnvelope className="mr-2 text-[#006400]" />
            <span className="font-bold mr-1 min-w-[100px]">Email:</span>
            {profile.email}
          </div>
          {profile.prdcer && (
            <div>
              <h3 className="text-lg text-[#006400] mt-5 mb-2">
                Producer Information
              </h3>
              {renderSection(
                "Datasets",
                <FaDatabase />,
                profile.prdcer.prdcer_dataset,
                "dataset"
              )}
              {renderSection(
                "Layers",
                <FaLayerGroup />,
                profile.prdcer.prdcer_lyrs,
                "layer"
              )}
              {renderSection(
                "Catalogs",
                <FaBook />,
                profile.prdcer.prdcer_ctlgs,
                "catalog"
              )}
            </div>
          )}
        </div>
        {renderPopup()}
      </div>
    </div>
  );
};

export default ProfileMain;
