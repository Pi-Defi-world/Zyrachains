"use client";
import React, { createContext, useContext, useEffect, useState } from "react";


interface PageMetadataContextProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  updateTime: string;
  setUpdateTime: (updateTime: string) => void;
  heading: string;
  setHeading: (heading: string) => void;
}

const PageMetadataContext = createContext<PageMetadataContextProps | undefined>(undefined);

export const PageMetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [title, setTitleState] = useState("Zyrachain");
  const [description, setDescription] = useState("Pi Network Data Center");
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleString());
  const [heading, setHeading] = useState("Welcome to Zyrachain");
  const setTitle = (newTitle: string) => {
    document.title = newTitle; 
    setTitleState(newTitle);
  };

  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [description]);

  return (
    <PageMetadataContext.Provider
      value={{ title, setTitle, description, setDescription, updateTime, setUpdateTime, heading, setHeading }}
    >
      {children}
    </PageMetadataContext.Provider>
  );
};

export const usePageMetadata = () => {
  const context = useContext(PageMetadataContext);
  if (!context) {
    throw new Error("usePageMetadata must be used within a PageMetadataProvider");
  }
  return context;
};
