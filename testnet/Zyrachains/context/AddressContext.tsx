"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeLabeledAddresses, isAddressesInitialized, LabledAddress, AddressData } from '@/utils/addresses';

interface AddressContextType {
  isInitialized: boolean;
  isLoading: boolean;
  addresses: { [key: string]: AddressData };
}

const AddressContext = createContext<AddressContextType>({
  isInitialized: false,
  isLoading: true,
  addresses: {},
});

export const useAddressContext = () => useContext(AddressContext);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<{ [key: string]: AddressData }>({});

  useEffect(() => {
    const initializeAddresses = async () => {
      try {
        if (!isAddressesInitialized()) {
          await initializeLabeledAddresses();
        }
        // Update addresses state to trigger re-renders
        setAddresses({ ...LabledAddress });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize addresses:', error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAddresses();
  }, []);

  return (
    <AddressContext.Provider value={{ isInitialized, isLoading, addresses }}>
      {children}
    </AddressContext.Provider>
  );
}; 