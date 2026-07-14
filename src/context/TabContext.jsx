import React, { createContext, useState, useCallback, useRef, useEffect } from "react";
import { edituser } from "../views/api/Api";


export const TabContext = createContext();

export const TabHeaderName = () => {
  const context = React.useContext(TabContext);
  if (!context) return null;
  const { firstName, lastName } = context;
  
  const displayName = (firstName || lastName)
    ? `${firstName || ""} ${lastName || ""}`.trim()
    : (localStorage.getItem("username") || localStorage.getItem("email") || "");
    
  return <i>{displayName}</i>;
};

export const TabProvider = ({ children }) => {
  const [firstName, setFirstName] = useState(
    localStorage.getItem("firstName") || ""
  );

  const [lastName, setLastName] = useState(
    localStorage.getItem("lastName") || ""
  );

  const refreshUser = useCallback(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      edituser(userId)
        .then((response) => {
          const user = response?.data?.data?.informationUsers?.[0];
          if (user) {
            const fName = user.firstName || "";
            const lName = user.lastName || "";
            setFirstName(fName);
            setLastName(lName);
            localStorage.setItem("firstName", fName);
            localStorage.setItem("lastName", lName);
          }
        })
        .catch((err) => console.error("Error refreshing user:", err));
    }
  }, []);

  const [globalTabsList, setGlobalTabsList] = useState([
    {
      value: "default",
      header: (
        <>
          <i className="tim-icons icon-badge me-2"></i>
          Brands - <TabHeaderName />
        </>
      ),
      content: "Default Tab",
      route: "/admin/brands",
    },
  ]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);


  const [activeTabValue, setActiveTabValue] = useState("default");

  // Use a ref to always have the latest activeTabValue for useCallback without adding it to dependencies
  const activeTabValueRef = useRef(activeTabValue);
  activeTabValueRef.current = activeTabValue;

  const addTab = useCallback((pageInfo = {}) => {
    setGlobalTabsList(() => {
      const newTab = {
        value: "default",
        header: pageInfo.header || (
          <>
            <i className="tim-icons icon-badge me-2"></i>
            New Tab
          </>
        ),
        content: "Content",
        route: pageInfo.route || "/login1",
        state: pageInfo.state || null,
      };
      setActiveTabValue(newTab.value);
      return [newTab];
    });
  }, []);

  const removeTab = useCallback((valueToRemove) => {
    setGlobalTabsList((prevTabs) => {
      if (prevTabs.length > 1) {
        return prevTabs.filter((tab) => tab.value !== valueToRemove);
      }
      return prevTabs;
    });
  }, []);

  const updateTab = useCallback((valueToUpdate, updatedTabData) => {
    setGlobalTabsList((prevTabs) => {
      // If targeting 'default' but we are actually in a specific tab, redirect update to the current active tab.
      // This supports legacy components hardcoded to 'default'.
      const targetValue = (valueToUpdate === "default" || !valueToUpdate)
        ? activeTabValueRef.current
        : valueToUpdate;

      return prevTabs.map((tab) =>
        tab.value === targetValue ? { ...tab, ...updatedTabData } : tab
      );
    });
  }, []);

  const initializePageTab = useCallback((pageName, pageIcon = "tim-icons icon-badge", pageRoute, tabValue = null, pageState = null) => {
    const headerContent = (
      <>
        <i className={`${pageIcon} me-2`}></i>
        {pageName} - <TabHeaderName />
      </>
    );

    updateTab(tabValue, {
      header: headerContent,
      route: pageRoute,
      state: pageState
    });
  }, [updateTab]);


  const value = {
    globalTabsList,
    setGlobalTabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
    refreshUser,
    activeTabValue,
    setActiveTabValue,
    firstName,
    lastName
  };


  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};

export const useGlobalTabs = () => {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error("useGlobalTabs must be used within a TabProvider");
  }
  return context;
};
