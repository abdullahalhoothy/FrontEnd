import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigationHandler } from '../../services/apiRequest';
import { NavigationSetupProps } from '../../types/allTypesAndInterfaces';

const NavigationSetup = ({ children }: NavigationSetupProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigationHandler((path: string) => navigate(path));
  }, [navigate]);

  return <>{children}</>;
};

export default NavigationSetup;
