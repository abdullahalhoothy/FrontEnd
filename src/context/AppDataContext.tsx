import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppDataContextType {
  appData: Record<string, any>;
  setData: (key: string, data: any) => void;
}

const defaultAppDataContextValue: AppDataContextType = {
  appData: {
    user: { name: "Alice", age: 30 },
    theme: "dark",
    notifications: ["email", "SMS"],
  },
  setData: function (key: string, data: any) {},
};

const AppDataContext = createContext<AppDataContextType>(defaultAppDataContextValue);

interface AppDataProviderProps {
  children: ReactNode;  
}


export function AppDataProvider(props: AppDataProviderProps) {
  const [appData, setAppData] = useState<Record<string, any>>(defaultAppDataContextValue.appData);

  function setData(key: string, data: any) {
    /**
     * Update state with a function to merge previous state and new data
     * 
     * @param previousState The current state before this update
     * @returns The new state object with updated or added key-value pair
     */
    function mergeWithPrevious(previousState: Record<string, any>) {
      /**
       * React automatically passes the current state to this function.
       * previousState contains the state before this update.
       * React just provides the current state as the first argument to the function.
       * 
       * Create a new state object (newState) by copying all properties from the previousState object
       * and updating or adding a specific property indicated by key with the value data.
       * "..." Spread operator is used to include all previous state properties.
       * The new key-value pair is updated or added to the newState object.
       */
      const newState: Record<string, any> = { ...previousState, [key]: data };
      return newState;
    }

    setAppData(mergeWithPrevious);
  }
  

  // function setData(key: string, data: any) {
  //   function updateState(previousState: Record<string, any>) {
  //     const newState: Record<string, any> = {};
  
  //     // Copy all properties from the previous state to the new state
  //     for (const prop in previousState) {
  //       if (Object.prototype.hasOwnProperty.call(previousState, prop)) {
  //         newState[prop] = previousState[prop];
  //       }
  //     }
  
  //     // Update or add the specified key-value pair in the new state
  //     newState[key] = data;
  
  //     return newState;
  //   }
  
  //   setAppData(updateState);
  // }

  return (
    <AppDataContext.Provider value={{ appData, setData }}>
      {props.children}
    </AppDataContext.Provider>
  );
};

/**
 * Custom hook to use the context data
 * 
 * @throws {Error} If used outside of an AppDataProvider
 * @returns The AppDataContextType object containing appData and setData
 */
export function useAppDataContext(){
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within an AppDataProvider');
  }
  return context;
}

/**
 * Custom hook to get specific data by key
 * 
 * @param key The key to retrieve data for
 * @returns The data associated with the provided key
 */
export function useGetData(key: string){
  const { appData } = useAppDataContext();
  return appData[key];
}

// Export the setData function
export function useSetData() {
  const appDataContext = useAppDataContext();
  return appDataContext.setData;
}


// // Custom hook to use the context data
// export const useAppDataContext = () => {
  // const context = useContext(AppDataContext);
  // if (!context) {
  //   throw new Error('useAppDataContext must be used within an AppDataProvider');
  // }
  // return context;
// };

// // Custom hook to get specific data by key
// export const useData = (key: string) => {
//   const { appData } = useAppDataContext();
//   return appData[key];
// };


// // Custom hook to set specific data by key
// export const useSetData = () => {
//   const { setData } = useAppDataContext();
//   return (key: string, data: any) => setData(key, data);
// };


