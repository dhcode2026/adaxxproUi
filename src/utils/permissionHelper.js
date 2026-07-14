/**
 * Get access data from localStorage
 * @returns {Object|null} Access data or null if not found
 */
export const getAccessData = () => {
  try {
    const accessDataStr = localStorage.getItem("accessData");
    return accessDataStr ? JSON.parse(accessDataStr) : null;
  } catch (error) {
    console.error("Error parsing accessData from localStorage:", error);
    return null;
  }
};

/**
 * Deduplicate menus by menuName
 * @param {Array} menus - Array of menu objects
 * @returns {Array} Deduplicated menus
 */
const deduplicateMenus = (menus) => {
  if (!menus || !Array.isArray(menus)) {
    return [];
  }

  const seen = new Set();
  const deduplicated = [];

  menus.forEach(menu => {
    const menuName = menu.menuName || menu.name;
    if (!seen.has(menuName)) {
      seen.add(menuName);
      deduplicated.push(menu);
    } else {
      console.warn(`Duplicate menu found and removed: ${menuName}`);
    }
  });

  return deduplicated;
};

/**
 * Get deduplicated access data from localStorage
 * @returns {Object|null} Deduplicated access data or null if not found
 */
const getDedupAccessData = () => {
  const accessData = getAccessData();
  if (!accessData) {
    return null;
  }

  return {
    ...accessData,
    menus: deduplicateMenus(accessData.menus || [])
  };
};

/**
 * Check if user has permission for specific action on a menu
 * @param {string} menuName - The menu name (e.g., "Brands", "Addons", "Exchange")
 * @param {string} action - The action type (e.g., "create", "view", "edit", "update", "delete")
 * @returns {boolean} True if user has permission, false otherwise
 */
export const hasPermission = (menuName, action) => {
  try {
    // Validate inputs
    if (!menuName || !action) {
      console.warn(`❌ Invalid input - menuName: "${menuName}", action: "${action}"`);
      return false;
    }

    const accessData = getDedupAccessData();

    if (!accessData || !accessData.menus || !Array.isArray(accessData.menus)) {
      console.warn("⚠️ No valid access data available in localStorage");
      return false;
    }
    const availableMenuNames = accessData.menus.map(m => m?.menuName).filter(Boolean);
    console.log(`🔍 Checking permission for menu: "${menuName}", action: "${action}". Available menus:`, availableMenuNames);

    let menu = accessData.menus.find(m => {
      if (!m || !m.menuName) return false;
      const mName = m.menuName.toLowerCase();
      const queryName = menuName.toLowerCase();
      return mName === queryName ||
             (queryName === "fund management" && mName === "add fund manager") ||
             (queryName === "add fund manager" && mName === "fund management");
    });

    if (!menu) {
      console.log(`🔍 "${menuName}" not found in top-level menus, searching in submenus...`);
      for (const topMenu of accessData.menus) {
        if (topMenu && topMenu.subMenu && Array.isArray(topMenu.subMenu)) {
          const foundSubMenu = topMenu.subMenu.find(sub => {
            if (!sub || !sub.subMenuName) return false;
            const subName = sub.subMenuName.toLowerCase();
            const queryName = menuName.toLowerCase();
            return subName === queryName ||
                   (queryName === "fund management" && subName === "add fund manager") ||
                   (queryName === "add fund manager" && subName === "fund management");
          });
          if (foundSubMenu) {
            console.log(`✓ Found "${menuName}" as submenu under "${topMenu.menuName}"`);
            menu = foundSubMenu;
            break;
          }
        }
      }
    }

    if (!menu) {
      console.warn(`❌ Menu "${menuName}" not found. Available: [${availableMenuNames.join(", ")}]`);
      return false;
    }

    const actionKey = action.toLowerCase();


    let permission = null;


    if (menu[actionKey] !== undefined && menu[actionKey] !== null) {
      permission = menu[actionKey];
    }
    else if (menu[`can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`] !== undefined && menu[`can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`] !== null) {
      permission = menu[`can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`];
    }
    else if (actionKey === "reporting" || actionKey === "report") {
      const reportPermission = [
        menu.report,
        menu.reporting,
        menu.canReport,
        menu.canReporting,
      ].find(value => value !== undefined && value !== null);
      permission = reportPermission;
    }
    else if (actionKey === "approveaccess" || actionKey === "approve") {
      const approvePermission = [
        menu.approve,
        menu.approveAccess,
        menu.canApprove,
        menu.canApproveAccess,
      ].find(value => value !== undefined && value !== null);
      permission = approvePermission;
    }
    else if (actionKey === "edit" && menu.canEdit !== undefined && menu.canEdit !== null) {
      permission = menu.canEdit;
    }


    const hasPermissionFlag = permission === true || permission === 1 || permission === "true" || permission === "1";

    console.log(`📋 Menu: "${menuName}", Action: "${actionKey}", Permission value: ${permission}, Granted: ${hasPermissionFlag}`);

    if (!hasPermissionFlag) {
      console.debug(`❌ User does not have ${actionKey} permission for menu: ${menuName}`);
    } else {
      console.log(`✅ User HAS ${actionKey} permission for menu: ${menuName}`);
    }

    return hasPermissionFlag;
  } catch (error) {
    console.error(`Error checking permission for ${menuName}.${action}:`, error);
    return false;
  }
};

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can view
 */
export const canView = (menuName) => hasPermission(menuName, "view");

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can create
 */
export const canCreate = (menuName) => hasPermission(menuName, "create");

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can edit
 */
export const canEdit = (menuName) => hasPermission(menuName, "edit");

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can update
 */
export const canUpdate = (menuName) => hasPermission(menuName, "update");

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can delete
 */
export const canDelete = (menuName) => hasPermission(menuName, "delete");

/**
 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can report
 */
export const canReport = (menuName) => hasPermission(menuName, "report");

/**
 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can reporting
 */
export const canReporting = (menuName) => hasPermission(menuName, "reporting");

/**
 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can approve
 */
export const canApprove = (menuName) => hasPermission(menuName, "approve");

/**
 * @param {string} menuName - The menu name
 * @returns {boolean} True if user can approve access
 */
export const canApproveAccess = (menuName) => hasPermission(menuName, "approveAccess");

/**

 * @returns {Array} Array of accessible menu names
 */
export const getAccessibleMenus = () => {
  try {
    const accessData = getDedupAccessData();

    if (!accessData || !accessData.menus || !Array.isArray(accessData.menus)) {
      console.warn("No valid access data available");
      return [];
    }


    const accessibleMenus = accessData.menus
      .filter(menu => {
        if (!menu || !menu.menuName) {
          return false;
        }

        const hasViewPermission = menu.view === true || menu.view === 1 || menu.view === "true" || menu.view === "1";
        return hasViewPermission;
      })
      .map(menu => menu.menuName === "Add Fund Manager" ? "Fund Management" : menu.menuName);

    return accessibleMenus;
  } catch (error) {
    console.error("Error getting accessible menus:", error);
    return [];
  }
};

/**

 * @param {string} menuName - The menu name
 * @returns {boolean} True if menu should be displayed
 */
export const isMenuAccessible = (menuName) => {

  if (!menuName) {
    return false;
  }

  const accessibleMenus = getAccessibleMenus();


  if (!accessibleMenus || accessibleMenus.length === 0) {
    return false;
  }

  // Check if menu is in accessible menus list (case-insensitive)
  return accessibleMenus.some(m => m && m.toLowerCase() === menuName.toLowerCase());
};

/**

 * @param {Array} menus - Array of menu objects with menuName property
 * @returns {Array} Filtered menus (only accessible ones)
 */
export const filterAccessibleMenus = (menus) => {
  if (!menus || !Array.isArray(menus)) {
    return [];
  }

  return menus.filter(menu => {
    if (!menu || !menu.menuName) {
      return false;
    }
    return isMenuAccessible(menu.menuName);
  });
};

/**

 * @param {string} menuName - The menu name
 * @returns {Object} Object with permission flags
 */
export const getMenuPermissions = (menuName) => {
  return {
    view: canView(menuName),
    create: canCreate(menuName),
    edit: canEdit(menuName),
    update: canUpdate(menuName),
    delete: canDelete(menuName),
    report: canReport(menuName),
    reporting: canReporting(menuName),
    approve: canApprove(menuName),
    approveAccess: canApproveAccess(menuName),
  };
};

/**

 * @returns {Array} Array of deduplicated menus
 */
export const getAllMenus = () => {
  try {
    const accessData = getDedupAccessData();
    return accessData && accessData.menus ? accessData.menus : [];
  } catch (error) {
    console.error("Error getting all menus:", error);
    return [];
  }
};

/**

 * This can be called manually to clean up duplicate menus
 * @returns {number} Number of duplicates removed
 */
export const forceDedupAccessData = () => {
  try {
    const accessData = getAccessData();
    if (!accessData || !accessData.menus) {
      return 0;
    }

    const originalCount = accessData.menus.length;
    const dedupData = getDedupAccessData();
    const dedupCount = dedupData.menus.length;
    const duplicatesRemoved = originalCount - dedupCount;

    if (duplicatesRemoved > 0) {
      localStorage.setItem("accessData", JSON.stringify(dedupData));
      console.log(`✓ Deduplication complete. Removed ${duplicatesRemoved} duplicate menus. Original: ${originalCount}, Now: ${dedupCount}`);
    } else {
      console.log("✓ No duplicate menus found.");
    }

    return duplicatesRemoved;
  } catch (error) {
    console.error("Error during forced deduplication:", error);
    return 0;
  }
};

/**

 * @returns {Object} Debug information about menus
 */
export const getDeduplicationDebugInfo = () => {
  try {
    const rawAccessData = getAccessData();
    const dedupAccessData = getDedupAccessData();

    const rawMenus = rawAccessData?.menus || [];
    const dedupMenus = dedupAccessData?.menus || [];

    return {
      rawMenuCount: rawMenus.length,
      dedupMenuCount: dedupMenus.length,
      duplicatesFound: rawMenus.length - dedupMenus.length,
      rawMenuNames: rawMenus.map(m => m.menuName || m.name),
      dedupMenuNames: dedupMenus.map(m => m.menuName || m.name),
    };
  } catch (error) {
    console.error("Error getting debug info:", error);
    return {
      error: error.message
    };
  }
};

/**

 * @returns {Object} Summary of cleared duplicates
 */
export const clearDuplicates = () => {
  const debugInfo = getDeduplicationDebugInfo();
  const removed = forceDedupAccessData();

  return {
    ...debugInfo,
    duplicatesRemoved: removed,
    success: removed > 0 || debugInfo.duplicatesFound === 0
  };
};

/**

 * @returns {Object} Detailed diagnostic information
 */
export const getPermissionDiagnostics = () => {
  try {
    const accessData = getAccessData();
    const dedupAccessData = getDedupAccessData();
    const allMenus = getAllMenus();
    const accessibleMenus = getAccessibleMenus();

    // Check each menu's permissions
    const menuPermissions = allMenus.map(menu => ({
      menuName: menu.menuName,
      view: menu.view,
      create: menu.create,
      edit: menu.edit,
      update: menu.update,
      delete: menu.delete,
      isAccessible: isMenuAccessible(menu.menuName)
    }));

    return {
      status: {
        hasAccessData: !!accessData,
        menuCount: allMenus.length,
        accessibleMenuCount: accessibleMenus.length,
        duplicatesFound: dedupAccessData && accessData ? (accessData.menus?.length || 0) - (dedupAccessData.menus?.length || 0) : 0
      },
      accessibleMenus: accessibleMenus,
      menuPermissions: menuPermissions,
      warnings: validateAccessData()
    };
  } catch (error) {
    console.error("Error in permission diagnostics:", error);
    return { error: error.message };
  }
};

/**

 * @returns {Array} Array of warnings/issues found
 */
export const validateAccessData = () => {
  const warnings = [];

  try {
    const accessData = getAccessData();

    if (!accessData) {
      warnings.push("⚠️ No access data found in localStorage");
      return warnings;
    }

    if (!accessData.menus || !Array.isArray(accessData.menus)) {
      warnings.push("⚠️ Access data has no menus array");
      return warnings;
    }

    if (accessData.menus.length === 0) {
      warnings.push("⚠️ Menus array is empty - no menus available");
      return warnings;
    }

    // Check for missing or invalid menu entries
    accessData.menus.forEach((menu, index) => {
      if (!menu.menuName || !menu.name) {
        warnings.push(`⚠️ Menu at index ${index} has no menuName or name property`);
      }

      if (typeof menu.view === "undefined" || menu.view === null) {
        warnings.push(`⚠️ Menu "${menu.menuName}" has no view permission defined`);
      }
    });

    // Check for duplicates
    const menuNames = accessData.menus.map(m => m.menuName);
    const duplicates = menuNames.filter((name, index) => menuNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      warnings.push(`⚠️ Found duplicate menus: ${[...new Set(duplicates)].join(", ")}`);
    }

    if (warnings.length === 0) {
      warnings.push("✓ Access data looks good");
    }

    return warnings;
  } catch (error) {
    warnings.push(`✗ Error validating access data: ${error.message}`);
    return warnings;
  }
};

/**
 * Check if access control is properly initialized
 * @returns {boolean} True if access control is ready
 */
export const isAccessControlReady = () => {
  try {
    const accessData = getAccessData();

    if (!accessData || !accessData.menus || !Array.isArray(accessData.menus) || accessData.menus.length === 0) {
      return false;
    }

    // Check that at least one menu has view permission
    const hasAccessibleMenus = accessData.menus.some(menu =>
      menu.view === true || menu.view === 1 || menu.view === "true" || menu.view === "1"
    );

    return hasAccessibleMenus;
  } catch (error) {
    console.error("Error checking access control readiness:", error);
    return false;
  }
};

/**
 * Get a summary of which menus user can and cannot access
 * @returns {Object} Summary with accessible and inaccessible menus
 */
export const getMenuAccessSummary = () => {
  try {
    const allMenus = getAllMenus();
    const accessible = [];
    const inaccessible = [];

    allMenus.forEach(menu => {
      if (menu.view === true || menu.view === 1 || menu.view === "true" || menu.view === "1") {
        accessible.push(menu.menuName);
      } else {
        inaccessible.push(menu.menuName);
      }
    });

    return {
      total: allMenus.length,
      accessible: accessible,
      inaccessible: inaccessible,
      accessPercentage: allMenus.length > 0 ? Math.round((accessible.length / allMenus.length) * 100) : 0
    };
  } catch (error) {
    console.error("Error getting menu access summary:", error);
    return { error: error.message };
  }
};

/**
 * Check if the user has any access at all across menus/submenus
 * @returns {boolean} True if at least one permission flag is enabled
 */
export const hasAnyAccess = () => {
  try {
    const allMenus = getAllMenus();

    return allMenus.some((menu) => {
      if (!menu) return false;

      return [
        menu.view,
        menu.create,
        menu.edit,
        menu.update,
        menu.delete,
        menu.report,
        menu.reporting,
        menu.approve,
        menu.approveAccess,
        menu.canView,
        menu.canCreate,
        menu.canEdit,
        menu.canUpdate,
        menu.canDelete,
        menu.canReport,
        menu.canReporting,
        menu.canApprove,
        menu.canApproveAccess,
      ].some((value) => value === true || value === 1 || value === "true" || value === "1");
    });
  } catch (error) {
    console.error("Error checking if user has any access:", error);
    return false;
  }
};
