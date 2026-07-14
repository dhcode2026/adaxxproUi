import React, { useState, useEffect, Children } from "react";
import PropTypes from "prop-types";
import _ from "underscore";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalTabs } from "../../context/TabContext.jsx";

export default function Tabs(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTabValue: value, setActiveTabValue: setValue } = useGlobalTabs();
  const userNavigated = React.useRef(false);
  const tabs = React.Children.toArray(props.children);

  useEffect(() => {
    if (tabs.length > 0 && value === null) {
      setValue(tabs[0].props.value);
    }
  }, [tabs.length, value, setValue]);

  useEffect(() => {
    const activeTabExists = tabs.some(tab => tab.props.value === value);
    if (!activeTabExists && tabs.length > 0) {
      setValue(tabs[0].props.value);
    }
  }, [tabs, value, setValue]);

  useEffect(() => {
    // If user explicitly clicked a tab, skip route-based switching
    if (userNavigated.current) {
      userNavigated.current = false;
      return;
    }
    // Only use exact route matching to avoid one tab's route matching another
    const matchingTab = tabs.find(tab => {
      if (!tab.props.route) return false;
      return tab.props.route === location.pathname;
    });
    if (matchingTab && matchingTab.props.value !== value) {
      setValue(matchingTab.props.value);
    }
  }, [location.pathname, tabs, value, setValue]);

  const isSelected = (tab) => {
    return tab.props.value === value;
  };

  const selectTab = (e, tabValue, route, state) => {
    userNavigated.current = true;
    setValue(tabValue);
    props.onChange(e, tabValue);
    if (route) {
      navigate(route, { state: state });
    }
  };

  const handleRemoveTab = (e, tabValue) => {
    e.stopPropagation();
    if (tabValue === value && tabs.length > 1) {
      const currentIndex = tabs.findIndex(tab => tab.props.value === tabValue);
      const fallbackTab = currentIndex > 0 ? tabs[currentIndex - 1] : tabs[1];
      if (fallbackTab) {
        userNavigated.current = true;
        setValue(fallbackTab.props.value);
        if (fallbackTab.props.route) {
          navigate(fallbackTab.props.route, { state: fallbackTab.props.state });
        }
      }
    }

    if (props.onRemove) {
      props.onRemove(tabValue);
    }
  };

  const getHeader = (tabs) => {
    return tabs.map((tab, i) => {
      const isSelectedTab = isSelected(tab);
      const style = isSelectedTab ? activeTabHeaderStyle : tabHeaderStyle;
      const route = tab.props.route || null;
      const state = tab.props.state || null;

      return (
        <div
          key={tab.props.value}
          onClick={e => selectTab(e, tab.props.value, route, state)}
          style={style}
          className="tab-header-item"
        >
          <div style={headerTextWrapperStyle}>
            {tab.props.header}
          </div>
          {tabs.length > 1 && (
            <span
              style={closeIconStyle}
              onClick={e => handleRemoveTab(e, tab.props.value)}
            >
              ×
            </span>
          )}
        </div>
      );
    });
  };

  const { children, onAdd } = props;

  return (
    <div style={tabsStyle}>
      <div style={tabsHeaderStyle}>
        <div style={tabItemsWrapperStyle}>
          {getHeader(tabs)}
        </div>
        {onAdd && (
          <div style={addTabButtonStyle} onClick={onAdd} title="Add New Tab">
            +
          </div>
        )}
      </div>
      <div style={tabsContentStyle}>
        {tabs.find(tab => isSelected(tab))}
      </div>
    </div>
  );
}

Tabs.defaultProps = {
  onChange: _.noop
};

Tabs.propTypes = {
  children: PropTypes.node,
  onChange: PropTypes.func,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func
};

// Style
const borderStyle = "1px solid #d1d1d1";

const tabsStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  backgroundColor: "#fff",
  borderTop: borderStyle
};

const tabsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#f0f0f0",
  borderBottom: borderStyle,
  height: "36px",
  padding: "0"
};

const tabItemsWrapperStyle = {
  display: "flex",
  overflowX: "auto",
  flexGrow: 1,
  height: "100%"
};

const tabHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 15px",
  backgroundColor: "transparent",
  borderRight: borderStyle,
  cursor: "pointer",
  flex: 1,
  fontSize: "12px",
  color: "#444",
  height: "100%",
  transition: "background-color 0.15s ease",
  position: "relative",
  minWidth: 0
};

const activeTabHeaderStyle = Object.assign({}, tabHeaderStyle, {
  backgroundColor: "#fff",
  color: "#222",
  fontWeight: "500",
  borderBottom: "1px solid #fff",
  marginTop: "-1px",
  height: "calc(100% + 1px)",
  zIndex: 2
});

const headerTextWrapperStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flexGrow: 1,
  marginRight: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11.5px"
};

const closeIconStyle = {
  fontSize: "14px",
  color: "#888",
  padding: "2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "2px",
  width: "18px",
  height: "18px",
  transition: "all 0.2s",
  position: "absolute",
  right: "8px"
};

const addTabButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "100%",
  cursor: "pointer",
  fontSize: "18px",
  color: "#666",
  backgroundColor: "transparent",
  borderLeft: borderStyle,
  transition: "background-color 0.15s"
};

const tabsContentStyle = {
  flexGrow: 1,
  //overflow: "auto",
  position: "relative"
};

