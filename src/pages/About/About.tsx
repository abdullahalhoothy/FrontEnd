import React, { ReactNode } from 'react';
import { useGetData, useAppDataContext } from '../../context/AppDataContext';


interface AboutProps {
  children?: ReactNode;
}
const AboutComponent: React.FC<AboutProps> = ({ children }) => {

  // const x = useGetData('something');
  // const newx = { "something": 999 };
  // useAppDataContext().setData('something',999)
  // const y = useGetData('something');
  return (
    <div>
      <p>This is a simple React component with some text.</p>
    </div>
  );
};

export default AboutComponent;

