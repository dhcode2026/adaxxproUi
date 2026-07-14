import React from "react";
import PropTypes from "prop-types";

export default function Tab({ children }) {
  return <div>{children}</div>;
}

Tab.propTypes = {
  value: PropTypes.string,
  header: PropTypes.node.isRequired,
  route: PropTypes.string,
  state: PropTypes.object,
  children: PropTypes.node
};