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
        await HttpReq<UserProfile>(
          urls.user_profile,
          setProfile,
          setResponseMessage,
          setRequestId,
          setIsLoading,
          setError,
          "post",
          { user_id: authResponse.localId },
          authResponse.idToken
        );
      } catch (err) {
        console.error("Unexpected error:", err);
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
    <div className="w-full h-full overflow-y-scroll px-10">
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h2 className={styles.profileTitle}>User Profile</h2>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.profileItem}>
            <FaUser className={styles.icon} />
            <span className={styles.label}>Username:</span> {profile.username}
          </div>
          <div className={styles.profileItem}>
            <FaEnvelope className={styles.icon} />
            <span className={styles.label}>Email:</span> {profile.email}
          </div>
          {profile.prdcer && (
            <div className={styles.producerInfo}>
              <h3 className={styles.sectionTitle}>Producer Information</h3>
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
