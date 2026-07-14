import React, { useState } from "react";
import {
  Button,
  Row,
  Col,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
} from "reactstrap";
import { FaCaretDown, FaCaretRight, FaCheck } from "react-icons/fa";

const AudienceEditor = () => {
  const customStyles = `
    .action-btn {
      border-radius: 0px !important;
      padding: 8px 16px !important;
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 40px !important;
      font-weight: 500 !important;
    }
  `;
  const audienceData = {
    steps: [
      // { key: "my", label: "My Audiences" },
      // { key: "crm", label: "CRM Audiences" },
      // { key: "third", label: "Party Audiences" },
      // { key: "sets", label: "My Sets" },
    ],
    searchPlaceholder: {
      my: "Search My Audiences...",
      crm: "Search CRM Audiences...",
      third: "Search Third Party Audiences...",
      sets: "Search My Sets...",
    },
    tableData: {
      my: [
        // { name: "testing" },
        // { name: "testing (demo)" },
        // { name: "XY Ads" },
        // { name: "XYZ" },
      ],
      crm: [{ name: "XY" }],
      third: [
        {
          name: "Adstra",
          children: [
            {
              name: "Adstra - Business",
              children: [
                {
                  name: "B2B Companies by Annual Revenue",
                  children: [
                    { name: "$1,000,000 - $2,500,000", count: "122,795,312", price: "$2.00" },
                    { name: "$1,000,000,000+", count: "68,102,496", price: "$2.00" },
                    { name: "$10,000,000 - $50,000,000", count: "87,844,760", price: "$2.00" },
                    { name: "$100,000,000 - $500,000,000", count: "68,938,528", price: "$2.00" },
                    { name: "$2,500,000 - $5,000,000", count: "55,715,980", price: "$2.00" },
                    { name: "$5,000,000 - $10,000,000", count: "104,635,952", price: "$2.00" },
                    { name: "$50,000,000 - $100,000,000", count: "53,283,076", price: "$2.00" },
                    { name: "$500,000 - $1,000,000", count: "239,696,608", price: "$2.00" },
                    { name: "$500,000,000 - $1,000,000,000", count: "44,766,408", price: "$2.00" },
                    { name: "<$500,000", count: "461,916,000", price: "$2.00" },
                    { name: "Fortune 1000 Companies", count: "26,857,754", price: "$2.00" },
                    { name: "Fortune 500 Companies", count: "31,527,020", price: "$2.00" },
                  ],
                },
                { name: "B2B Companies by Employee Size", children: [] },
                { name: "B2B Companies by Growth Trends", children: [] },
                { name: "B2B Companies by Ownership", children: [] },
              ],
            },
          ],
        },
      ],
      sets: [], // Will be overridden by state
    },
  };

  const [mySets, setMySets] = useState([]);

  const [activeSteps, setActiveSteps] = useState("my");
  const [checkedItems, setCheckedItems] = useState({
    my: {},
    crm: {},
    third: {},
    sets: {},
  });
  const [audienceexpanded, audiencesetExpanded] = useState({});
  const [targetGroups, setTargetGroups] = useState([]); // Array of { id, items }
  const [segmentChecked, setSegmentChecked] = useState(false);
  const [categoryChecked, setCategoryChecked] = useState(false);

  // Apply Rules States (Global for new groups, but we can make them per-group if needed)
  const [ruleDropdownOpen, setRuleDropdownOpen] = useState(null); // stores group index
  const [selectedRuleType, setSelectedRuleType] = useState("indefinitely");
  const [ruleDays, setRuleDays] = useState({ from: 0, to: 14, onwards: 0 });

  // Pixel Access States
  const [pixelDropdownOpen, setPixelDropdownOpen] = useState(null); // stores group index
  const [selectedPixelType, setSelectedPixelType] = useState("first");

  // Operators (And/Or)
  const [interOperator, setInterOperator] = useState("and"); // Between groups (boxes)

  // Advanced Targeting State
  const [isAdvancedTargeting, setIsAdvancedTargeting] = useState(false);

  // Targeting Menu State
  const [activeTargetMenu, setActiveTargetMenu] = useState(null); // stores index of open dropdown

  // Save as Set States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");

  const getRuleLabel = () => {
    if (selectedRuleType === "range") return `Apply rules from day ${ruleDays.from} to ${ruleDays.to}`;
    if (selectedRuleType === "onwards") return `Apply rules from day ${ruleDays.onwards} onwards`;
    return "Apply rules indefinitely";
  };

  // 🔹 Expand/Collapse handler
  const toggleExpand = (key) => {
    audiencesetExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 🔹 Checkbox handler
  const handleAudienceCheckboxChange = (step, key) => {
    setCheckedItems((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        [key]: !prev[step][key],
      },
    }));
  };

  const addSelectedToSet = (mode) => {
    const newItems = [];

    Object.keys(checkedItems).forEach((category) => {
      Object.entries(checkedItems[category]).forEach(([key, value]) => {
        if (value) {
          const pathIndices = key.split("-").map(Number);
          let item = audienceData.tableData[category][pathIndices[0]];
          const fullPathNames = [item.name];

          for (let i = 1; i < pathIndices.length; i++) {
            if (item.children && item.children[pathIndices[i]]) {
              item = item.children[pathIndices[i]];
              fullPathNames.push(item.name);
            }
          }

          const audienceTypes = [];
          if (segmentChecked) audienceTypes.push("Web (Cookie)");
          if (categoryChecked) audienceTypes.push("Mobile App (IFA)");

          const forceType = (mode === "exclude") ? "exclude" : "target";

          if (category === "third") {
            newItems.push({
              ...item,
              category,
              type: forceType,
              fullPath: fullPathNames.slice(0, -1).join(" > "),
              name: fullPathNames[fullPathNames.length - 1],
              audienceTypes: audienceTypes.join(", "),
            });
          } else {
            newItems.push({
              ...item,
              category,
              type: forceType,
              name: item.name,
              audienceTypes: audienceTypes.join(", "),
            });
          }
        }
      });
    });

    if (newItems.length === 0) return;

    if (mode === "new" || mode === "target" || mode === "exclude" || targetGroups.length === 0) {
      setTargetGroups((prev) => [
        ...prev,
        {
          id: Date.now(),
          items: newItems,
          ruleType: selectedRuleType,
          ruleDays: { ...ruleDays },
          pixelType: selectedPixelType,
          operator: "or"
        }
      ]);
    } else {

      setTargetGroups((prev) => {
        const lastGroup = prev[prev.length - 1];
        const otherGroups = prev.slice(0, -1);
        return [
          ...otherGroups,
          { ...lastGroup, items: [...lastGroup.items, ...newItems] }
        ];
      });
    }

    setCheckedItems({ my: {}, crm: {}, third: {}, sets: {} });
  };

  const saveAsSet = () => {
    if (!newSetName.trim()) return;
    const newSet = {
      name: newSetName,
      groups: [...targetGroups],
      interOperator: interOperator
    };
    setMySets((prev) => [...prev, newSet]);
    setIsSaveModalOpen(false);
    setNewSetName("");
  };

  const updateSetItemType = (groupIndex, itemIndex, type) => {
    setTargetGroups((prev) =>
      prev.map((group, gIdx) => {
        if (gIdx !== groupIndex) return group;
        return {
          ...group,
          items: group.items.map((item, iIdx) =>
            iIdx === itemIndex ? { ...item, type: type } : item
          )
        };
      })
    );
    setActiveTargetMenu(null);
  };

  const setGroupOperator = (groupIdx, op) => {
    setTargetGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIdx] = { ...newGroups[groupIdx], operator: op };
      return newGroups;
    });
  };

  const removeSetItem = (groupIndex, itemIndex) => {
    setTargetGroups((prev) => {
      const updatedGroups = prev.map((group, gIdx) => {
        if (gIdx !== groupIndex) return group;
        return {
          ...group,
          items: group.items.filter((_, iIdx) => iIdx !== itemIndex)
        };
      });
      return updatedGroups.filter(group => group.items.length > 0);
    });
  };

  const renderAudienceRows = (data, step, parentKey = "", level = 0) => {
    return data.map((item, index) => {
      const key = parentKey ? `${parentKey}-${index}` : `${index}`;
      const hasChildren = Array.isArray(item.children);
      const indent = 30 + level * 20;

      return (
        <React.Fragment key={key}>
          <div className="audience-row">
            <div className="align-middle">
              <div
                className="d-flex align-items-center justify-content-between"
                style={{
                  paddingLeft: `${indent}px`,
                  fontSize: "11px",
                  marginBottom: "6px",
                  paddingRight: "15px"
                }}
              >
                <div className="d-flex align-items-center">
                  {hasChildren ? (
                    <span
                      style={{
                        cursor: "pointer",
                        marginRight: "6px",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                      onClick={() => toggleExpand(key)}
                    >
                      {audienceexpanded[key] ? <FaCaretDown /> : <FaCaretRight />}
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      id={`audience-${activeSteps}-${key}`}
                      className="form-check-input me-2"
                      checked={checkedItems[activeSteps][key] || false}
                      onChange={() =>
                        handleAudienceCheckboxChange(activeSteps, key)
                      }
                    />
                  )}
                  <label
                    htmlFor={`audience-${step}-${key}`}
                    className="audience-label m-0"
                  >
                    {item.name}
                  </label>
                </div>
                {!hasChildren && (item.count || item.price) && (
                  <div className="d-flex gap-3 text-muted">
                    <span>{item.count}</span>
                    <span>{item.price}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasChildren &&
            audienceexpanded[key] &&
            renderAudienceRows(item.children, step, key, level + 1)}
        </React.Fragment>
      );
    });
  };

  const renderStepContent = () => {
    const stepData = activeSteps === 'sets' ? mySets : audienceData.tableData[activeSteps];

    return (
      <>
        {activeSteps === "third" && (
          <Row className="mb-2 ms-2 me-1">
            <Col
              lg="12"
              className="d-flex align-items-center gap-2 p-0 ms-2 mt-2"
            >
              <div className="sq-checkbox">
                <label className="appdomaintype" htmlFor="segmentCheck">
                  Audience Types :
                </label>
              </div>

              <div className="sq-checkbox">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="segmentCheck"
                  checked={segmentChecked}
                  onChange={(e) => setSegmentChecked(e.target.checked)}
                />
                <label className="appdomaintype" htmlFor="segmentCheck">
                  Web (Cookie)
                </label>
              </div>

              <div className="sq-checkbox">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="categoryCheck"
                  checked={categoryChecked}
                  onChange={(e) => setCategoryChecked(e.target.checked)}
                />
                <label className="appdomaintype" htmlFor="categoryCheck">
                  Mobile App (IFA)
                </label>
              </div>
            </Col>
          </Row>
        )}

        <Row className="mb-2 ms-3 me-1 mt-2">
          <Col lg="12" className="p-0">
            <Input
              className="audience-input"
              type="text"
              placeholder={audienceData.searchPlaceholder[activeSteps]}
            />
          </Col>
        </Row>

        <Row className="p-0 row-margins">
          <table className="audience-table">
            <tbody>
              {activeSteps === "third" ? (
                segmentChecked || categoryChecked ? (
                  renderAudienceRows(stepData, activeSteps)
                ) : (
                  <tr>
                    <td className="text-center py-5 text-muted">
                      No data found.
                    </td>
                  </tr>
                )
              ) : (
                stepData.map((item, index) => (
                  <tr key={index} className="audience-row">
                    <td className="align-middle">
                      <div className="d-flex align-items-center sq-checkbox ms-4">
                        <input
                          type="checkbox"
                          id={`audience-${activeSteps}-${index}`}
                          className="form-check-input me-2"
                          checked={checkedItems[activeSteps][index] || false}
                          onChange={() =>
                            handleAudienceCheckboxChange(activeSteps, index)
                          }
                        />
                        <label
                          htmlFor={`audience-${activeSteps}-${index}`}
                          className="audience-label"
                        >
                          {item.name}
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Row>
      </>
    );
  };

  return (
    <div className="step-scroll">
      <style>{customStyles}</style>
      <Row className="p-0">
        <Col xs="3" className="text-center border p-0">
          <Row className=" border row-left">
            {audienceData.steps.map((step) => (
              <Col
                key={step.key}
                lg="auto"
                className="m-0 p-0 step-column"
                onClick={() => setActiveSteps(step.key)}
              >
                <div className="m-0 p-0 mb-1 ms-3">
                  <strong
                    className={`step-label ${activeSteps === step.key
                      ? "active-step"
                      : ""
                      }`}
                  >
                    {step.label}
                  </strong>
                </div>
              </Col>
            ))}
          </Row>

          {renderStepContent()}

          <Row className="mb-2 mt-3 justify-content-center">
            <Col lg="8">
              <div className="d-flex gap-2 justify-content-center">
                <Button
                  className="action-btn"
                  onClick={() => addSelectedToSet(isAdvancedTargeting ? "new" : "target")}
                  style={{ fontSize: '12px', textTransform: 'none' }}
                >
                  {isAdvancedTargeting ? "Add as New Group" : "Target"}
                </Button>

                <Button
                  className="action-btn"
                  onClick={() => addSelectedToSet(isAdvancedTargeting ? "add" : "exclude")}
                  style={{ fontSize: '12px', textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  {isAdvancedTargeting ? "Add to Selected Group" : "Exclude"}
                </Button>
              </div>
            </Col>
          </Row>
        </Col>

        <Col xs="7" className="p-3 border bg-light">
          {/* Global Operator Toggle Removed from top - now between sets */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              color="secondary"
              outline
              size="sm"
              className="new-set-btn"
              disabled={targetGroups.length === 0}
              onClick={() => setIsSaveModalOpen(true)}
            >
              New Set
            </Button>
            <div className="d-flex align-items-center gap-3">
              <div className="form-check m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="advTarget"
                  checked={isAdvancedTargeting}
                  onChange={(e) => setIsAdvancedTargeting(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="advTarget" style={{ cursor: 'pointer' }}>Advanced targeting</label>
              </div>
              <span className="small text-muted">Max Audience Data CPM <strong className="text-dark">$2.00</strong></span>
            </div>
          </div>

          <div className="selected-groups-container">
            {targetGroups.length > 0 ? (
              targetGroups.map((group, groupIdx) => (
                <React.Fragment key={group.id}>
                  <div className="set-box bg-white p-0 rounded mb-4 border" style={{ borderColor: '#e9ebec', borderRadius: '4px' }}>
                    {isAdvancedTargeting && (
                      <div className="d-flex align-items-center px-4 py-3 border-bottom position-relative" style={{ backgroundColor: '#fff' }}>
                        <div className="rule-dropdown-container">
                          <span
                            style={{ cursor: 'pointer', userSelect: 'none', color: '#999', fontSize: '13px', fontStyle: 'italic' }}
                            onClick={() => setRuleDropdownOpen(ruleDropdownOpen === groupIdx ? null : groupIdx)}
                          >
                            {getRuleLabel()} <FaCaretDown style={{ fontSize: '10px' }} />
                          </span>

                          {ruleDropdownOpen === groupIdx && (
                            <div className="rule-dropdown-menu position-absolute bg-white border shadow-sm p-3" style={{
                              zIndex: 1000,
                              top: '100%',
                              left: '0',
                              minWidth: '250px',
                              color: '#333',
                              fontStyle: 'normal'
                            }}>
                              <div className="d-flex align-items-center mb-3">
                                <input
                                  type="radio"
                                  name={`ruleType-${groupIdx}`}
                                  id={`rule-range-${groupIdx}`}
                                  className="form-check-input mt-0"
                                  checked={selectedRuleType === 'range'}
                                  onChange={() => setSelectedRuleType('range')}
                                />
                                <label htmlFor={`rule-range-${groupIdx}`} className="ms-2 mb-0 d-flex align-items-center gap-2">
                                  Apply rules from day
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: '40px', padding: '2px' }}
                                    value={ruleDays.from}
                                    onChange={(e) => setRuleDays({ ...ruleDays, from: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  to
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: '40px', padding: '2px' }}
                                    value={ruleDays.to}
                                    onChange={(e) => setRuleDays({ ...ruleDays, to: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </label>
                              </div>

                              <div className="d-flex align-items-center mb-3">
                                <input
                                  type="radio"
                                  name={`ruleType-${groupIdx}`}
                                  id={`rule-onwards-${groupIdx}`}
                                  className="form-check-input mt-0"
                                  checked={selectedRuleType === 'onwards'}
                                  onChange={() => setSelectedRuleType('onwards')}
                                />
                                <label htmlFor={`rule-onwards-${groupIdx}`} className="ms-2 mb-0 d-flex align-items-center gap-2">
                                  Apply rules from day
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: '40px', padding: '2px' }}
                                    value={ruleDays.onwards}
                                    onChange={(e) => setRuleDays({ ...ruleDays, onwards: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  onwards
                                </label>
                              </div>

                              <div className="d-flex align-items-center mb-2">
                                <input
                                  type="radio"
                                  name={`ruleType-${groupIdx}`}
                                  id={`rule-indefinitely-${groupIdx}`}
                                  className="form-check-input mt-0"
                                  checked={selectedRuleType === 'indefinitely'}
                                  onChange={() => setSelectedRuleType('indefinitely')}
                                />
                                <label htmlFor={`rule-indefinitely-${groupIdx}`} className="ms-2 mb-0">Apply rules indefinitely</label>
                              </div>

                              <div className="text-end border-top pt-2">
                                <Button color="link" size="sm" className="text-muted p-0" onClick={() => setRuleDropdownOpen(null)}>Close</Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pixel-dropdown-container ms-4">
                          <span
                            style={{ cursor: 'pointer', userSelect: 'none', color: '#b3b3b3', fontSize: '13px', fontStyle: 'italic', opacity: 0.8 }}
                            onClick={() => setPixelDropdownOpen(pixelDropdownOpen === groupIdx ? null : groupIdx)}
                          >
                            after {selectedPixelType} pixel access or data provider update <FaCaretDown style={{ fontSize: '10px' }} />
                          </span>

                          {pixelDropdownOpen === groupIdx && (
                            <div className="pixel-dropdown-menu position-absolute bg-white border shadow-sm" style={{
                              zIndex: 1000,
                              top: '100%',
                              right: '0',
                              minWidth: '220px',
                              color: '#333',
                              fontStyle: 'normal',
                              marginRight: '450px',
                            }}>
                              <div className="p-3">
                                <div className="d-flex align-items-center mb-3">
                                  <input
                                    type="radio"
                                    name={`pixelType-${groupIdx}`}
                                    id={`pixel-first-${groupIdx}`}
                                    className="form-check-input mt-0"
                                    checked={selectedPixelType === 'first'}
                                    onChange={() => setSelectedPixelType('first')}
                                  />
                                  <label htmlFor={`pixel-first-${groupIdx}`} className="ms-2 mb-0">after first pixel access</label>
                                </div>

                                <div className="d-flex align-items-center">
                                  <input
                                    type="radio"
                                    name={`pixelType-${groupIdx}`}
                                    id={`pixel-last-${groupIdx}`}
                                    className="form-check-input mt-0"
                                    checked={selectedPixelType === 'last'}
                                    onChange={() => setSelectedPixelType('last')}
                                  />
                                  <label htmlFor={`pixel-last-${groupIdx}`} className="ms-2 mb-0">after last pixel access</label>
                                </div>
                              </div>

                              <div className="text-end border-top px-3 py-2">
                                <Button color="link" size="sm" className="text-muted p-0" onClick={() => setPixelDropdownOpen(null)}>Close</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {group.items.map((item, itemIdx) => (
                      <React.Fragment key={itemIdx}>
                        {itemIdx > 0 && (
                          <div className="intra-group-operator px-4 position-relative d-flex align-items-center" style={{ margin: '15px 0' }}>
                            <div className="flex-grow-1" style={{ borderTop: '1px solid #f2f2f2' }}></div>
                            {isAdvancedTargeting ? (
                              <div className="btn-group border rounded bg-white mx-1" style={{ padding: '0px', height: '24px', overflow: 'hidden', borderColor: '#e1e1e1' }}>
                                <Button
                                  color="white"
                                  size="sm"
                                  className={`py-0 px-2 d-flex align-items-center justify-content-center shadow-none`}
                                  style={{
                                    fontSize: '11px',
                                    borderRadius: '0',
                                    backgroundColor: group.operator === 'and' ? '#5b9331' : '#fff',
                                    color: group.operator === 'and' ? '#fff' : '#999',
                                    border: 'none',
                                    borderRight: '1px solid #e1e1e1',
                                    minWidth: '40px'
                                  }}
                                  onClick={() => setGroupOperator(groupIdx, 'and')}
                                >
                                  And
                                </Button>
                                <Button
                                  color="white"
                                  size="sm"
                                  className={`py-0 px-2 d-flex align-items-center justify-content-center shadow-none`}
                                  style={{
                                    fontSize: '11px',
                                    borderRadius: '0',
                                    backgroundColor: group.operator === 'or' ? '#5b9331' : '#fff',
                                    color: group.operator === 'or' ? '#fff' : '#999',
                                    border: 'none',
                                    minWidth: '40px'
                                  }}
                                  onClick={() => setGroupOperator(groupIdx, 'or')}
                                >
                                  Or
                                </Button>
                              </div>
                            ) : (
                              <span className="mx-3 text-dark" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                {group.operator || 'Or'}
                              </span>
                            )}
                            <div className="flex-grow-1" style={{ borderTop: '1px solid #f2f2f2' }}></div>
                          </div>
                        )}
                        <div className="set-item-row px-4 py-3 position-relative">
                          <div className="d-flex align-items-start">
                            <div className="target-dropdown-wrap me-3 position-relative" style={{ minWidth: '80px', marginTop: isAdvancedTargeting ? '4px' : '0' }}>
                              <div className="dropdown">
                                <span
                                  className={isAdvancedTargeting ? "fw-normal" : "fw-normal"}
                                  style={{
                                    cursor: isAdvancedTargeting ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    color: isAdvancedTargeting ? '#3ea9f5' : '#444',
                                    fontSize: isAdvancedTargeting ? '11px' : '11px'
                                  }}
                                  onClick={() => isAdvancedTargeting && setActiveTargetMenu(activeTargetMenu === `${groupIdx}-${itemIdx}` ? null : `${groupIdx}-${itemIdx}`)}
                                >
                                  {item.type === 'target' ? 'Target' : 'Exclude'} {isAdvancedTargeting && <FaCaretDown style={{ fontSize: '10px' }} />}
                                </span>

                                {activeTargetMenu === `${groupIdx}-${itemIdx}` && (
                                  <div className="dropdown-menu show position-absolute shadow-sm p-0 overflow-hidden" style={{
                                    zIndex: 1000,
                                    top: '100%',
                                    left: '0',
                                    minWidth: '100px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                  }}>
                                    <div
                                      className={`px-2 py-1 small d-flex align-items-center gap-2 ${item.type === 'target' ? 'text-white' : 'text-dark'}`}
                                      style={{
                                        cursor: 'pointer',
                                        backgroundColor: item.type === 'target' ? '#0096FF' : 'transparent',
                                        fontWeight: item.type === 'target' ? 'bold' : 'normal'
                                      }}
                                      onClick={() => updateSetItemType(groupIdx, itemIdx, 'target')}
                                    >
                                      {item.type === 'target' ? <FaCheck size={10} /> : <div style={{ width: 10 }}></div>}
                                      Target
                                    </div>
                                    <div
                                      className={`px-2 py-1 small d-flex align-items-center gap-2 ${item.type === 'exclude' ? 'text-white' : 'text-dark'}`}
                                      style={{
                                        cursor: 'pointer',
                                        backgroundColor: item.type === 'exclude' ? '#0096FF' : 'transparent',
                                        fontWeight: item.type === 'exclude' ? 'bold' : 'normal'
                                      }}
                                      onClick={() => updateSetItemType(groupIdx, itemIdx, 'exclude')}
                                    >
                                      {item.type === 'exclude' ? <FaCheck size={10} /> : <div style={{ width: 10 }}></div>}
                                      Exclude
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="item-details flex-grow-1 overflow-hidden" style={{ paddingLeft: '20px' }}>
                              {item.category === "third" ? (
                                <div className="third-party-details">
                                  <span className="breadcrumb-small d-block mb-1 text-truncate" style={{ fontSize: '11px', color: '#b3b3b3' }}>
                                    Third-Party Audiences &gt; {item.fullPath} &gt;
                                  </span>
                                  <span className="item-name fw-bold d-block mb-2" style={{ fontSize: '16px', color: '#444' }}>
                                    {item.name}
                                  </span>
                                  <div className="d-flex gap-5" style={{ fontSize: '11px', color: '#999' }}>
                                    <div>
                                      Audience Type <span className="text-dark ms-1 fw-bold">{item.audienceTypes || "Any"}</span>
                                    </div>
                                    <div className="ms-auto">
                                      Reach <span className="text-dark ms-1 fw-bold">{item.count}</span>
                                    </div>
                                    <div className="ms-auto" style={{ minWidth: '100px', textAlign: 'right' }}>
                                      CPM <span className="text-dark ms-1 fw-bold">{item.price}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="my-audience-details">
                                  <span className="breadcrumb-small d-block mb-1 text-truncate" style={{ fontSize: '11px', color: '#b3b3b3' }}>
                                    {item.category === "my"
                                      ? "My Audiences >"
                                      : item.category === "crm"
                                        ? "CRM Audiences >"
                                        : "My Sets >"}
                                  </span>
                                  <span className="item-name fw-bold" style={{ fontSize: '16px', color: '#444' }}>
                                    {item.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-close btn-sm p-0 m-0 border-0 shadow-none op-50"
                              style={{ fontSize: '10px', width: '10px', height: '10px', color: '#ccc', marginTop: '5px' }}
                              onClick={() => removeSetItem(groupIdx, itemIdx)}
                            ></button>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  {groupIdx < targetGroups.length - 1 && (
                    <div className="d-flex justify-content-center my-3">
                      {isAdvancedTargeting ? (
                        <div className="btn-group border rounded bg-white shadow-sm" style={{ padding: '2px' }}>
                          <Button
                            color={interOperator === 'and' ? 'success' : 'link'}
                            size="sm"
                            className={`py-0 px-3 ${interOperator === 'and' ? 'text-white' : 'text-muted'}`}
                            style={{ fontSize: '12px', textDecoration: 'none', borderRadius: '4px', fontWeight: interOperator === 'and' ? 'bold' : 'normal' }}
                            onClick={() => setInterOperator('and')}
                          >
                            And
                          </Button>
                          <Button
                            color={interOperator === 'or' ? 'success' : 'link'}
                            size="sm"
                            className={`py-0 px-3 ${interOperator === 'or' ? 'text-white' : 'text-muted'}`}
                            style={{ fontSize: '12px', textDecoration: 'none', borderRadius: '4px', fontWeight: interOperator === 'or' ? 'bold' : 'normal' }}
                            onClick={() => setInterOperator('or')}
                          >
                            Or
                          </Button>
                        </div>
                      ) : (
                        <span className="text-dark" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {interOperator}
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="text-center p-5 bg-white border rounded text-muted">
                No sets created. Select audiences on the left and click "Add as New Group".
              </div>
            )}
          </div>
        </Col>

        <Col xs="2" className="text-center border p-3">
          <Row>
            <h5>How To Use Audience Targeting</h5>
            <p>
              Select My Audiences or Third-Party Audiences
              tab on the left and then choose audiences from
              the list beneath to either Target or Exclude.
            </p>
            <p>
              Mousing over a Third-Party Audience name in
              the list will display cost, reach, and
              descriptions where available.
            </p>
          </Row>
        </Col>
      </Row>

      <Modal isOpen={isSaveModalOpen} toggle={() => setIsSaveModalOpen(false)} centered size="md">
        <div className="px-4 py-3 border-bottom">
          <h5 className="save-set-header-title">Save As New Set</h5>
        </div>
        <ModalBody className="px-4 py-4">
          <FormGroup className="mb-0">
            <Label for="setName" className="save-set-label">
              Name <span className="text-danger">*</span>
            </Label>
            <Input
              type="text"
              id="setName"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              className="save-set-input shadow-none"
            />
          </FormGroup>
        </ModalBody>
        <div className="px-4 py-2 border-top text-end d-flex justify-content-end gap-2">
          <Button
            className="save-set-cancel-btn shadow-none"
            onClick={() => setIsSaveModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="save-set-save-btn shadow-none"
            onClick={saveAsSet}
          >
            Save Set
          </Button>
        </div>
      </Modal>
    </div >
  );
};

export default AudienceEditor;
