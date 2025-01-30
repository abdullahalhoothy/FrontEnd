import React, { useEffect, useState } from 'react';
import styles from './ProfileMain.module.css';
import {
  FaTimes,
  FaSignOutAlt,
  FaUser,
  FaEnvelope,
  FaDatabase,
  FaLayerGroup,
  FaBook,
  FaTrash 
} from 'react-icons/fa';
import { useNavigate } from 'react-router';
import urls from '../../../../urls.json';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import { UserProfile, PopupInfo } from '../../../../types/allTypesAndInterfaces';

const ProfileMain: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    user_id: '',
    username: '',
    email: '',
    account_type: '',
    settings: {
      show_price_on_purchase: false,
    },
    prdcer: {
      prdcer_dataset: {},
      prdcer_lyrs: {},
      prdcer_ctlgs: {},
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPrice,setShowPrice]=useState<boolean|undefined>(false)
  const [error, setError] = useState<Error | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const { isAuthenticated, authResponse, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }


    fetchProfile();
  }, [isAuthenticated, authResponse, navigate]);

  const fetchProfile = async () => {
    if (!authResponse || !('idToken' in authResponse)) {
      setError(new Error('Authentication information is missing.'));
      setIsLoading(false);
      navigate('/auth');
      return;
    }

    try {
      const res = await apiRequest({
        url: urls.user_profile,
        method: 'POST',
        isAuthRequest: true,
        body: { user_id: authResponse.localId },
      });
      setProfile(res.data.data);
      setShowPrice(res.data.data.settings.show_price_on_purchase)
    } catch (err) {
      console.error('Unexpected error:', err);
      logout();
      setError(new Error('An unexpected error occurred. Please try again.'));
      navigate('/auth');
    } finally {
      setIsLoading(false);
    }
  };
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

    if (typeof value === 'object') {
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

  const handleItemClick = (type: 'dataset' | 'layer' | 'catalog', name: string, data: any) => {
    setPopupInfo({ type, name, data });
  };

  const renderPopup = () => {
    if (!popupInfo) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <button className={styles.closeButton} onClick={() => setPopupInfo(null)}>
            <FaTimes />
          </button>
          <h3>{popupInfo.name}</h3>
          <div className={styles.popupContent}>{renderValue(popupInfo.name, popupInfo.data)}</div>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: JSX.Element,
    items: Record<string, any>,
    type: 'dataset' | 'layer' | 'catalog'
  ) => {
    // Function to handle delete icon click
    const handleDeleteClick = async(
      type: 'dataset' | 'layer' | 'catalog', // Add type parameter
      key: string,
      value: any
    ) => {
      if(type==='layer'){
        await apiRequest({
          url: urls.delete_layer,
          method: 'DELETE',
          isAuthRequest: true,
          body: { user_id: authResponse.localId ,prdcer_lyr_id:value.prdcer_lyr_id},
        })
      }else if(type==='catalog'){
        await apiRequest({
          url: urls.delete_producer_catalog,
          method: 'DELETE',
          isAuthRequest: true,
          body: { user_id: authResponse.localId ,prdcer_ctlg_id:value.prdcer_ctlg_id},
        })
        
      }
      fetchProfile()
      console.log('Item details:', { type, key, value });
      // You can add your delete logic here
    };
  
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {icon} {title}
        </h3>
        {Object.entries(items).length > 0 ? (
          <ul className={styles.itemList}>
            {Object.entries(items).map(([key, value]) => (
              <li key={key} className={styles.itemName}>
                <span onClick={() => handleItemClick(type, key, value)}>
                  {value.prdcer_layer_name || value.prdcer_ctlg_name || key}
                </span>
                {/* Conditionally render the delete icon */}
                {type !== 'dataset' && (
                 <div className={styles.iconContainer}>
                 <div className={styles.verticalDivider} />
                 <FaTrash
                   className={styles.deleteIcon}
                   onClick={() => handleDeleteClick(type, key, value)} // Pass type here
                 />
               </div>
                )}
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
    navigate('/');
  };

  if (!isAuthenticated) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }
  if (isLoading) return <div className={styles.loading}>Loading profile...</div>;

  if (error) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }

  if (!profile) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-auto lg:px-10 px-4 text-sm">
      <div className="m-5 mx-auto p-5 bg-[#f0f8f0] rounded-lg lg:shadow-md shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="lg:text-2xl text-lg text-[#006400] mb-5 text-center">User Profile</h2>
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
          <div className="flex items-start mb-2">
            <label className="flex items-center mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={async(e) => {
                  await setShowPrice(e.target.checked)
                  if (profile.account_type==='admin') {
                    if (!authResponse || !("idToken" in authResponse)) {
                      setError(new Error("Authentication information is missing."));
                      setIsLoading(false);
                      navigate("/auth");
                      return;
                    }
                    const res = await apiRequest({
                      url: urls.update_user_profile,
                      method: "POST",
                      isAuthRequest: true,
                      body: { 
                        user_id: authResponse.localId,
                        show_price_on_purchase:e.target.checked,
                        username:profile.username,
                        email:profile.email,
                      },
                    });
                  }
                }}
                disabled={profile.account_type!=='admin'}
                className={`mr-2 h-4 w-4 border-gray-300 rounded focus:ring-green-600 ${
                  profile.account_type!=='admin' ? "opacity-50 cursor-not-allowed" : "text-green-700"
                }`}
              />
              <span
                className={`text-gray-700 font-medium ${
                  (profile.account_type!=='admin') ? "text-gray-400" : ""
                }`}
              >
                Show Price
              </span>
            </label>
          </div>
          {profile.prdcer && (
            <div>
              <h3 className="text-lg text-[#006400] mt-5 mb-2">Producer Information</h3>
              {renderSection('Datasets', <FaDatabase />, profile.prdcer.prdcer_dataset, 'dataset')}
              {renderSection('Layers', <FaLayerGroup />, profile.prdcer.prdcer_lyrs, 'layer')}
              {renderSection('Catalogs', <FaBook />, profile.prdcer.prdcer_ctlgs, 'catalog')}
            </div>
          )}
        </div>
        {renderPopup()}
      </div>
    </div>
  );
};

export default ProfileMain;
