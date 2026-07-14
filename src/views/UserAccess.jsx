import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Label,
  Input,
} from "reactstrap";
import { FaCaretDown, FaCheck, FaSave, FaShieldAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./editors/campcreate.css";
import { getAllRole, getAllMenu, getroleaccess, updategetrollaccess } from "./api/Api";

const UserAccess = ({ defaultRoleId }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [roleDropdownPosition, setRoleDropdownPosition] = useState({ top: 0, left: 0, width: 250 });
  const roleSelectRef = useRef(null);
  const rolePortalRef = useRef(null);

  const campaignConfirmClasses = {
    popup: "campaign-save-swal-popup",
    title: "campaign-save-swal-title",
    htmlContainer: "campaign-save-swal-message",
    actions: "campaign-save-swal-actions",
    confirmButton: "campaign-save-swal-confirm",
    cancelButton: "campaign-save-swal-cancel",
  };

  const showCampaignAlert = async (title, text, icon) => {
    await Swal.fire({
      title,
      text,
      icon,
      iconColor: icon === "error" ? "#ef4444" : "#22c55e",
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    });
  };

  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  useEffect(() => {
    if (defaultRoleId && allMenus.length > 0) {
      setSelectedRole(defaultRoleId);
      loadPermissionsForRole(defaultRoleId);
    }
  }, [defaultRoleId, allMenus]);

  useEffect(() => {
    if (!isRoleOpen) return;

    const updateRoleDropdownPosition = () => {
      const rect = roleSelectRef.current?.getBoundingClientRect();
      if (!rect) return;

      setRoleDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        roleSelectRef.current?.contains(target) ||
        rolePortalRef.current?.contains(target)
      ) {
        return;
      }
      setIsRoleOpen(false);
    };

    updateRoleDropdownPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updateRoleDropdownPosition);
    window.addEventListener("scroll", updateRoleDropdownPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateRoleDropdownPosition);
      window.removeEventListener("scroll", updateRoleDropdownPosition, true);
    };
  }, [isRoleOpen]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await getAllRole();
      if (response.data && response.status === 200) {
        const informationRoles = response.data.data.informationRoles;
        const mappedRoles = informationRoles.map((role) => ({
          id: role.roleId,
          name: role.roleName,
          status: role.status,
        }));
        setRoles(mappedRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      await showCampaignAlert("Error", "Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await getAllMenu();
      if (response.data && response.status === 200) {
        const menus = response.data.data.informationMenu;
        setAllMenus(menus);
        const initialPerms = [];

        menus.forEach(menu => {
          // Add main menu
          initialPerms.push({
            id: `menu_${menu.menuId}`,
            moduleName: menu.menuName,
            type: 'menu',
            menuId: menu.menuId,
            subMenuId: null,
            parentMenuName: null,
            view: false,
            edit: false,
            update: false,
            create: false,
            delete: false,
            reporting: false,
            approve: false,
          });
          if (menu.subMenu && Array.isArray(menu.subMenu) && menu.subMenu.length > 0) {
            menu.subMenu.forEach(subMenu => {
              initialPerms.push({
                id: `submenu_${subMenu.subMenuId}`,
                moduleName: subMenu.subMenuName,
                type: 'submenu',
                menuId: menu.menuId,
                subMenuId: subMenu.subMenuId,
                parentMenuName: menu.menuName,
                view: false,
                edit: false,
                update: false,
                create: false,
                delete: false,
                reporting: false,
                approve: false,
              });
            });
          }
        });

        const sortedPerms = sortPermissions(initialPerms);
        setPermissions(sortedPerms);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      await showCampaignAlert("Error", "Failed to load menus", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (selectedOption) => {
    const roleId = selectedOption ? selectedOption.value : "";
    setSelectedRole(roleId);
    setIsRoleOpen(false);

    if (roleId) {
      loadPermissionsForRole(roleId);
    } else {
      setPermissions([]);
    }
  };

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name
  }));

  const currentSelectedOption = roleOptions.find(opt => String(opt.value) === String(selectedRole)) || null;

  const loadPermissionsForRole = async (roleId) => {
    setLoading(true);
    try {
      const payload = { roleId: parseInt(roleId) };
      const response = await getroleaccess(payload);
      const rolePermissionsMap = new Map();

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item) => {
          const key = item.subMenuId ? `submenu_${item.subMenuId}` : `menu_${item.menuId}`;
          rolePermissionsMap.set(key, {
            view: item.canView === 1,
            edit: item.canEdit === 1,
            update: item.canUpdate === 1,
            create: item.canCreate === 1,
            delete: item.canDelete === 1,
            reporting: item.canReport === 1,
            approve: item.canApprove === 1,
          });
        });
      }

      const permissionsFromAllMenus = [];

      allMenus.forEach(menu => {
        const menuKey = `menu_${menu.menuId}`;
        const roleMenuPerms = rolePermissionsMap.get(menuKey) || {
          view: false,
          edit: false,
          update: false,
          create: false,
          delete: false,
          reporting: false,
          approve: false,
        };

        permissionsFromAllMenus.push({
          id: menuKey,
          moduleName: menu.menuName,
          type: 'menu',
          menuId: menu.menuId,
          subMenuId: null,
          parentMenuName: null,
          view: roleMenuPerms.view,
          edit: roleMenuPerms.edit,
          update: roleMenuPerms.update,
          create: roleMenuPerms.create,
          delete: roleMenuPerms.delete,
          reporting: roleMenuPerms.reporting,
          approve: roleMenuPerms.approve,
        });
        if (menu.subMenu && Array.isArray(menu.subMenu) && menu.subMenu.length > 0) {
          menu.subMenu.forEach(subMenu => {
            const subMenuKey = `submenu_${subMenu.subMenuId}`;
            const roleSubMenuPerms = rolePermissionsMap.get(subMenuKey) || {
              view: false,
              edit: false,
              update: false,
              create: false,
              delete: false,
              reporting: false,
              approve: false,
            };

            permissionsFromAllMenus.push({
              id: subMenuKey,
              moduleName: subMenu.subMenuName,
              type: 'submenu',
              menuId: menu.menuId,
              subMenuId: subMenu.subMenuId,
              parentMenuName: menu.menuName,
              view: roleSubMenuPerms.view,
              edit: roleSubMenuPerms.edit,
              update: roleSubMenuPerms.update,
              create: roleSubMenuPerms.create,
              delete: roleSubMenuPerms.delete,
              reporting: roleSubMenuPerms.reporting,
              approve: roleSubMenuPerms.approve,
            });
          });
        }
      });

      const sortedPermissions = sortPermissions(permissionsFromAllMenus);
      setPermissions(sortedPermissions);
      setLoading(false);
    } catch (error) {
      console.error("Error loading permissions:", error);
      await showCampaignAlert("Error", "Failed to load permissions", "error");
      setLoading(false);
    }
  };

  const handlePermissionChange = (moduleId, permissionType, value) => {
    const updatedPermissions = permissions.map((perm) =>
      perm.id === moduleId ? { ...perm, [permissionType]: value } : perm
    );
    setPermissions(updatedPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      await showCampaignAlert("Warning", "Please select a role first", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update permissions for this role?",
      icon: "question",
      iconColor: "#fbbf24",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const permissionsData = permissions
        .filter(perm => perm.type === 'menu' || perm.type === 'submenu')
        .map(perm => ({
          view: perm.view ? 1 : 0,
          create: perm.create ? 1 : 0,
          edit: perm.edit ? 1 : 0,
          update: perm.update ? 1 : 0,
          report: perm.reporting ? 1 : 0,
          delete: perm.delete ? 1 : 0,
          menuId: perm.menuId,
          subMenuId: perm.subMenuId || "",
          roleId: parseInt(selectedRole),
          approve: perm.approve ? 1 : 0,
        }));

      const payload = {
        roleId: parseInt(selectedRole),
        data: permissionsData
      };

      console.log("Saving permissions for role:", selectedRole);
      console.log("Payload being sent:", payload);

      const response = await updategetrollaccess(payload);

      if (response && response.status === 200) {
        await showCampaignAlert("Success", "Permissions updated successfully", "success");
        await loadPermissionsForRole(selectedRole);
      } else {
        await showCampaignAlert("Error", "Failed to update permissions", "error");
      }

    } catch (error) {
      console.error("Error saving permissions:", error);
      await showCampaignAlert("Error", error?.response?.data?.message || "Failed to update permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const sortPermissions = (permsToSort) => {
    // Sort menus by menuId
    const menus = permsToSort.filter(p => p.type === 'menu').sort((a, b) => a.menuId - b.menuId);
    const submenus = permsToSort.filter(p => p.type === 'submenu');

    const result = [];

    menus.forEach(menu => {
      result.push(menu);

      // Add submenus for this menu immediately after the menu, sorted by subMenuId
      const menuSubmenus = submenus
        .filter(sub => sub.menuId === menu.menuId)
        .sort((a, b) => a.subMenuId - b.subMenuId);

      result.push(...menuSubmenus);
    });

    return result;
  };

  return (
    <div className="ua-container">
      <div className="ua-header-grid">
        <div className="ua-form-group">
          <Label for="roleSelect">Select Role</Label>
          <div
            id="roleSelect"
            ref={roleSelectRef}
            style={{ position: "relative", minWidth: "250px", zIndex: 100 }}
          >
            <div className="campaign-select-wrapper">
              <Input
                readOnly
                value={currentSelectedOption ? currentSelectedOption.label : "-- Select a role --"}
                className="campaign-select-input"
                style={{
                  height: "30px",
                  minHeight: "30px",
                  borderRadius: "13px",
                  padding: "10px 34px 10px 12px",
                  cursor: "pointer",
                }}
                onClick={() => setIsRoleOpen((prev) => !prev)}
                tabIndex={0}
              />
              <FaCaretDown
                className={`custom-select-icon campaign-select-icon ${isRoleOpen ? "open" : ""}`}
              />
            </div>
          </div>
          {isRoleOpen &&
            typeof document !== "undefined" &&
            ReactDOM.createPortal(
              <div
                ref={rolePortalRef}
                className="custom-dropdown-menu biddeript-b"
                style={{
                  position: "absolute",
                  top: `${roleDropdownPosition.top}px`,
                  left: `${roleDropdownPosition.left}px`,
                  zIndex: 9999,
                  minWidth: `${roleDropdownPosition.width}px`,
                  pointerEvents: "auto",
                }}
              >
                <div
                  onClick={() => handleSelectChange(null)}
                  className={`custom-dropdown-option ${!selectedRole ? "selected" : ""}`}
                  style={{
                    height: "40px",
                    cursor: "pointer",
                    pointerEvents: "auto",
                  }}
                >
                  <span className="tick-icon">
                    {!selectedRole && <FaCheck />}
                  </span>
                  <span>-- Select a role --</span>
                </div>
                {roleOptions.map((option) => {
                  const isSelected = String(selectedRole) === String(option.value);
                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelectChange(option)}
                      className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                      style={{
                        height: "40px",
                        cursor: "pointer",
                        pointerEvents: "auto",
                      }}
                    >
                      <span className="tick-icon">
                        {isSelected && <FaCheck />}
                      </span>
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>,
              document.body,
            )}
        </div>
        <div className="ua-button-container">
          <button className="ua-save-btn" onClick={handleSavePermissions} disabled={!selectedRole || loading}>
            <FaSave />
            Save Permissions
          </button>
        </div>
      </div>

      {selectedRole && (
        <>
          <div className="ua-table-wrapper">
            <table className="ua-table">
              <thead>
                <tr>
                  <th>Module / Feature</th>
                  <th className="center">View</th>
                  <th className="center">Edit</th>
                  <th className="center">Update</th>
                  <th className="center">Create</th>
                  <th className="center">Delete</th>
                  <th className="center">Reporting</th>
                  <th className="center">Approve</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      {loading ? "Loading permissions..." : "No permissions data available"}
                    </td>
                  </tr>
                ) : (
                  permissions.map((row) => (
                    <tr key={row.id} className={row.type === 'menu' ? 'ua-row-menu' : 'ua-row-submenu'}>
                      <td>
                        {row.type === 'submenu' && <span className="ua-submenu-indent">└─</span>}
                        {row.moduleName}
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.view || false} onChange={(e) => handlePermissionChange(row.id, "view", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.edit || false} onChange={(e) => handlePermissionChange(row.id, "edit", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.update || false} onChange={(e) => handlePermissionChange(row.id, "update", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.create || false} onChange={(e) => handlePermissionChange(row.id, "create", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.delete || false} onChange={(e) => handlePermissionChange(row.id, "delete", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.reporting || false} onChange={(e) => handlePermissionChange(row.id, "reporting", e.target.checked)} />
                      </td>
                      <td className="center">
                        <input type="checkbox" className="ua-checkbox" checked={row.approve || false} onChange={(e) => handlePermissionChange(row.id, "approve", e.target.checked)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedRole && (
        <div className="ua-empty-state">
          <FaShieldAlt style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
          <h4>Please select a role to view and manage permissions</h4>
          <p>Select a role from the dropdown above to get started</p>
        </div>
      )}
    </div>
  );
};

export default UserAccess;
