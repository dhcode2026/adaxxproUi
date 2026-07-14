import axios from "axios";
const API_BASE = "https://api.adaxxpro.com/api"; // http://api.audsight.co:8080  // https://api.adaxxpro.com/api   https://api.audsight.co/api  // http://localhost:8080/api
axios.defaults.baseURL = API_BASE;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.put["Content-Type"] = "application/json";
axios.defaults.headers.patch["Content-Type"] = "application/json";
axios.defaults.headers.delete["Content-Type"] = "application/json";

const initToken = localStorage.getItem("token");
if (initToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${initToken}`;
}
function getCurrentToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  try {
    return localStorage.getItem("userId");
  } catch {
    return null;
  }
}

function getUserRoles() {
  try {
    const rolesStr = localStorage.getItem("roles");
    return rolesStr ? JSON.parse(rolesStr) : [];
  } catch {
    return [];
  }
}

function isReadOnlyUser() {
  const roles = getUserRoles();
  return roles.includes("ROLE_READ_ONLY");
}
function getAdvertiserId() {
  try {
    const val = localStorage.getItem("advertiserId");
    return (val === "null" || !val) ? null : val;
  } catch {
    return "0";
  }
}

function getAgencyId() {
  try {
    const val = localStorage.getItem("agencyId");
    return (val === "null" || !val) ? null : val;
  } catch {
    return "0";
  }
}

axios.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    if (url.includes("/user/signin")) {
      return config;
    }

    const userId = getCurrentUserId();
    const token = getCurrentToken();
    const advertiserId = getAdvertiserId();
    const agencyId = getAgencyId();

    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("✓ Token set in Authorization header for:", config.method?.toUpperCase(), url);
    } else {
      console.error("✗ NO TOKEN FOUND in localStorage for request:", config.method?.toUpperCase(), url);
    }

    if (userId) {
      config.headers["userid"] = userId;
    }
    config.headers["advertiserId"] = advertiserId || "0";

    config.headers["agencyId"] = agencyId || "0";
     config.headers["test"] = agencyId || "0";
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    const bodyMethods = ["post", "put", "patch"];
    const excludeUserIdInjectUrls = [
      "/user/createUser",
      "/manageUser/updateManageUserById",
      "/billings/updateBilling",
      "/billings/updatestatusbilling",
      "/billings/createbilling"
    ];
    const shouldInjectUserId = !excludeUserIdInjectUrls.some((exUrl) => url.includes(exUrl));

    if (bodyMethods.includes(config.method) && userId && shouldInjectUserId) {
      try {
        let data = config.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (data && typeof data === "object" && !Array.isArray(data)) {
          data.userId = userId;
          data.advertiserId = advertiserId || "0";
          data.agencyId = agencyId || "0";
          config.data = data;
        }
        console.log("✓ userId added to", config.method?.toUpperCase(), "request body");
      } catch (e) {
        console.error("Failed to inject userId into request body:", e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.response) {
      const status = error.response.status;
      const readOnly = isReadOnlyUser();
      if ((status === 401 || status === 403) && !readOnly) {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("tokenSavedAt");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("roles");
          localStorage.removeItem("email");
          localStorage.removeItem("roleId");
          localStorage.removeItem("accessData");
        } catch (ex) {
          console.error("Error clearing localStorage:", ex);
        }
        console.warn("Token expired (401/403). Redirecting to login.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const syncTokenToAxios = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("✓ Token synced to axios headers");
  } else {
    delete axios.defaults.headers.common["Authorization"];
    console.warn("Token not found, Authorization header removed");
  }
};
export const syncHeadersToAxios = () => {
  const token = localStorage.getItem("token");
  const advertiserId = localStorage.getItem("advertiserId");
  const agencyId = localStorage.getItem("agencyId");

  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  axios.defaults.headers.common["advertiserId"] = (advertiserId && advertiserId !== "null") ? advertiserId : "0";

  axios.defaults.headers.common["agencyId"] = agencyId || null;
};

syncTokenToAxios();
syncHeadersToAxios();

export const saveAddon = (payload) => {
  return axios.post(`${API_BASE}/addons/createAddons`, payload);
};

export const updateAddon = (addonsId, payload) => {
  return axios.put(`${API_BASE}/addons/updateAddonsById/${addonsId}`, payload);
};

export const getAllAddons = () => {
  return axios.get(`${API_BASE}/addons/getAllAddons`);
};

export const deleteAddon = (addonsId) => {
  return axios.delete(`${API_BASE}/addons/deleteAddonsBYId/${addonsId}`);
};

export const editAddon = (addonsId) => {
  return axios.get(`${API_BASE}/addons/getAddonsById/${addonsId}`);
};

export const saveBrand = (payload) => {
  return axios.post(`${API_BASE}/brand/createBrand`, payload);
};

export const getAllBrand = () => {
  return axios.get(`${API_BASE}/brand/getAllBrand`);
};

export const editbrand = (brandId) => {
  return axios.get(`${API_BASE}/brand/getBrandById/${brandId}`);
};

export const deletebrand = (brandId) => {
  return axios.delete(`${API_BASE}/brand/deleteBrandById/${brandId}`);
};

export const updateBrand = (brandId, payload) => {
  return axios.put(`${API_BASE}/brand/updateBrandById/${brandId}`, payload);
};

export const getBrandsByDateRange = (startDate, endDate, range = null) => {
  let url = `${API_BASE}/brand/getBYDateRange?startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const Brandsearch = (brandId, brandName) => {
  return axios.get(`${API_BASE}/brand/searchBrand`, {
    params: {
      brandId,
      brandName,
    },
  });
};

export const saveGroup = async (brandId, groupData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/group/createGroup?brandId=${brandId}`,
      groupData
    );
    return response;
  } catch (error) {
    console.error('Error saving crm audience:', error);
    throw error;
  }
};

export const upadtestatusBrand = (brandId, status) => {
  return axios.put(`${API_BASE}/brand/updateStatus/${brandId}`, null, {
    params: { status }
  });
};

export const getAllGroup = () => {
  return axios.get(`${API_BASE}/group/getAllGroups`);
};

export const getgroupByDateRange = (brandId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/group/getBYDateRange?brandId=${brandId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const editGroup = (groupId) => {
  return axios.get(`${API_BASE}/group/getGroupById/${groupId}`);
};

export const copyGroup = (groupId) => {
  return axios.get(`${API_BASE}/group/getGroupById/${groupId}`);
};

export const updateGroup = (groupId, payload) => {
  return axios.put(`${API_BASE}/group/updateGroupById/${groupId}`, payload);
};

export const deletegroup = (groupId) => {
  return axios.delete(`${API_BASE}/group/deleteGroupById/${groupId}`);
};

export const upadtestatusGroup = (groupId, status) => {
  return axios.put(`${API_BASE}/group/updateStatus/${groupId}`, null, {
    params: { status }
  });
};

export const getAllCategory = () => {
  return axios.get(`${API_BASE}/category/getAllCategory`);
};

export const savecrmaudience = async (brandId, crmaudienceData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/CRMAudience/createCRMAudience?brandId=${brandId}`,
      crmaudienceData
    );
    return response;
  } catch (error) {
    console.error('Error saving crm audience:', error);
    throw error;
  }
};

export const editcrmAudience = (crmaudienceId) => {
  return axios.get(`${API_BASE}/CRMAudience/getCRMAudienceById/${crmaudienceId}`);
};

export const getAllCRMaudience = () => {
  return axios.get(`${API_BASE}/CRMAudience/getCRMAudience`);
};

export const upadtestatuscrmaudience = (crmaudienceId, status) => {
  return axios.put(`${API_BASE}/CRMAudience/updateStatus/${crmaudienceId}`, null, {
    params: { status }
  });
};

export const updateCrmAudience = (crmaudienceId, payload) => {
  return axios.put(`${API_BASE}/CRMAudience/updateCRMAudienceById/${crmaudienceId}`, payload);
};

export const getcrmaudienceByDateRange = (brandId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/CRMAudience/getBYDateRange?brandId=${brandId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const getCRMAudienceStatus = (status = 3) => {
  let url = `${API_BASE}/CRMAudience/getStatus`;
  url += `?status=${status}`;
  return axios.get(url);
};

export const getuniversalStatus = (status = 3) => {
  let url = `${API_BASE}/UniversalPixels/getStatus`;
  url += `?status=${status}`;
  return axios.get(url);
};

export const getGroupStatus = (status = 3) => {
  let url = `${API_BASE}/group/getStatus`;
  url += `?status=${status}`;
  return axios.get(url);
};

export const getAllExchange = () => {
  return axios.get(`${API_BASE}/exchange/getAllExchange`);
};

export const getExchangeId = () => {
  return axios.get(`${API_BASE}/exchange/getExchangeId`);
};

export const getalllog = (payload) => {
  return axios.post(`${API_BASE}/getalllog`, payload);
};

export const saveExchange = (payload) => {
  return axios.post(`${API_BASE}/exchange/createExchange`, payload);
};

export const updateExchange = (exchangeId, payload) => {
  return axios.put(`${API_BASE}/exchange/updateExchangeById/${exchangeId}`, payload);
};

export const deleteExchange = (exchangeId) => {
  return axios.delete(`${API_BASE}/exchange/deleteExchangeById/${exchangeId}`);
};

export const editExchange = (exchangeId) => {
  return axios.get(`${API_BASE}/exchange/getExchangeById/${exchangeId}`);
};

export const getAllAddsetlist = () => {
  return axios.get(`${API_BASE}/addset/getAllAddSet`);
};

export const getAudiencelist = () => {
  return axios.get(`${API_BASE}/audience/getAllAudience`);
};

export const upadtestatusAudience = (audienceId, status) => {
  return axios.put(`${API_BASE}/audience/updateStatus/${audienceId}`, null, {
    params: { status }
  });
};

export const editAudience = (audienceId) => {
  return axios.get(`${API_BASE}/audience/getAudienceById/${audienceId}`);
};

export const saveAudience = async (brandId, audienceData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/audience/createAudience?brandId=${brandId}`,
      audienceData
    );
    return response;
  } catch (error) {
    console.error('Error saving audience:', error);
    throw error;
  }
};

export const updateAudience = (audienceId, payload) => {
  return axios.put(`${API_BASE}/audience/updateAudienceById/${audienceId}`, payload);
};

export const getaudienceByDateRange = (brandId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/audience/getBYDateRange?brandId=${brandId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const getAudienceStatus = (status = 3) => {
  let url = `${API_BASE}/audience/getStatus`;
  url += `?status=${status}`;
  return axios.get(url);
};

export const getConversionlist = (payload) => {
  // const userId = getCurrentUserId();
  // const data = {
  //   userId: userId ? Number(userId) : null,
  //   ...(payload || {})
  // };
  return axios.get(`${API_BASE}/conversion/getAllConversion`);
};

export const upadtestatusConversion = (conversionId, status) => {
  return axios.put(`${API_BASE}/conversion/updateStatus/${conversionId}`, null, {
    params: { status }
  });
};

export const saveConversion = async (conversionData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/conversion/createConversion`,
      conversionData
    );
    return response;
  } catch (error) {
    console.error('Error saving crm audience:', error);
    throw error;
  }
};

export const updateConversion = (conversionId, payload) => {
  return axios.put(`${API_BASE}/conversion/updateConversionById/${conversionId}`, payload);
};

export const editConversion = (conversionId) => {
  const userId = getCurrentUserId();
  return axios.get(
    `${API_BASE}/conversion/getConversionById/${conversionId}`,
    {
      userId: userId ? Number(userId) : null
    }
  );
};

export const getconversionByDateRange = (brandId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/conversion/getBYDateRange?brandId=${brandId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const getConversionStatus = (status = 3) => {
  let url = `${API_BASE}/conversion/getStatus`;
  url += `?status=${status}`;
  return axios.get(url);
};

export const getUserlist = () => {
  return axios.get(`${API_BASE}/user/getAllUser`);
};

export const editAudiencebrand = (brandId) => {
  return axios.get(`${API_BASE}/audience/getAudienceByBrandId`, {
    params: { brandId }
  });
};

export const editGroupbrand = (brandId) => {
  return axios.get(`${API_BASE}/group/getGroupByBrandId`, {
    params: { brandId }
  });
};

export const listCRMAudiencebrand = (brandId) => {
  return axios.get(`${API_BASE}/CRMAudience/getCRMAudienceByBrandId`, {
    params: { brandId }
  });
};

export const editConversionbrand = (brandId) => {
  return axios.get(`${API_BASE}/conversion/getConversionByBrandId`, {
    params: { brandId }
  });
};

export const getAllDomainlist = () => {
  return axios.get(`${API_BASE}/domainList/getAllDomainList`);
};

export const saveDomain = (payload) => {
  return axios.post(`${API_BASE}/domainList/createDomainList`, payload);
};

export const editDomain = (domainListId) => {
  return axios.get(`${API_BASE}/domainList/getDomainListById/${domainListId}`);
};

export const updatedomain = (domainListId, payload) => {
  return axios.put(`${API_BASE}/domainList/updateDomainListById/${domainListId}`, payload);
};

export const getAllBrowser = () => {
  return axios.get(`${API_BASE}/browser/getAllBrowser`);
};

export const getAllLanguage = () => {
  return axios.get(`${API_BASE}/browserLanguage/getAllBrowserLanguage`);
};

export const getAllDevices = () => {
  return axios.get(`${API_BASE}/device/getAllDevice`);
};

export const signin = (payload) => {
  return axios.post(`${API_BASE}/user/signin`, payload);
};

export const saveAddset = (payload) => {
  return axios.post(`${API_BASE}/addset/createAddSet`, payload);
};

export const saveUser = (payload) => {
  return axios.post(`${API_BASE}/user/createUser`, payload);
};

export const updateUser = (userId, payload) => {
  return axios.put(`${API_BASE}/user/updateUserById/${userId}`, payload);
};

export const deleteUser = (userId) => {
  return axios.delete(`${API_BASE}/manageUser/deleteManageUserById/${userId}`);
};

export const edituser = (userId) => {
  return axios.get(`${API_BASE}/user/getUserById/${userId}`);
};

export const getAlluniversallist = () => {
  return axios.get(`${API_BASE}/UniversalPixels/getAllUniversalPixels`);
};

export const listUniversalbrand = (brandId) => {
  return axios.get(`${API_BASE}/UniversalPixels/getUniversalPixelsByBrandId`, {
    params: { brandId }
  });
};

export const saveUniversalPxel = async (brandId, universalpixelData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/UniversalPixels/createUniversalPixels?brandId=${brandId}`,
      universalpixelData
    );
    return response;
  } catch (error) {
    console.error('Error saving crm audience:', error);
    throw error;
  }
};

export const upadtestatusUniversal = (universalPixelsId, status) => {
  return axios.put(`${API_BASE}/UniversalPixels/updateStatus/${universalPixelsId}`, null, {
    params: { status }
  });
};

export const getuniversalByDateRange = (brandId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/UniversalPixels/getBYDateRange?brandId=${brandId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const editUniversal = (universalPixelsId) => {
  return axios.get(`${API_BASE}/UniversalPixels/getUniversalPixelsById/${universalPixelsId}`);
};

export const updateUniversalPixel = (universalPixelsId, payload) => {
  return axios.put(`${API_BASE}/UniversalPixels/updateUniversalPixelsById/${universalPixelsId}`, payload);
};

export const getAllMyadslist = () => {
  return axios.get(`${API_BASE}/creatives/getAllCreatives`);
};

export const listCreativesbrand = (brandId) => {
  return axios.get(`${API_BASE}/creatives/getCreativesByBrandId`, {
    params: { brandId }
  });
};

export const updatecreative = (creativesId, payload) => {
  return axios.put(`${API_BASE}/creatives/updateCreativesById/${creativesId}`, payload);
};

export const editcreatives = (creativesId) => {
  return axios.get(`${API_BASE}/creatives/getCreativesById/${creativesId}`);
};

export const editvideo = (id) => {
  return axios.get(`${API_BASE}/bannerVideos/getBannerVideosById/${id}`);
};

export const updatevideo = (id, payload) => {
  return axios.put(`${API_BASE}/bannerVideos/updateBannerVideosById/${id}`, payload);
};

export const editnative = (id) => {
  return axios.get(`${API_BASE}/bannerNative/getBannerNativeById/${id}`);
};

export const updateNative = (id, payload) => {
  return axios.put(`${API_BASE}/bannerNative/updateBannerNative/${id}`, payload);
};

export const publisherinventorylist = (payload) => {
  return axios.post(`${API_BASE}/publishInventoryArchive/getAllPublishInventoryArchive`, payload);
};

export const getcountry = () => {
  return axios.get(`${API_BASE}/country/getAllCountry`);
};

export const getCountryStateAndCity = (name) => {
  return axios.post(`${API_BASE}/country/getCountryStateAndCity`, { name });
};

export const getprimaryregions = (countryId) => {
  return axios.get(
    `${API_BASE}/primaryRegion/getAllPrimaryRegionByCountryId/${countryId}`
  );
};

export const getcities = (stateId) => {
  return axios.get(
    `${API_BASE}/city/getAllCityByStateId/${stateId}`
  );
};

export const getAllCampaign = () => {
  return axios.get(`${API_BASE}/campaign/getAllCampaign`);
};

export const getAllCampaigns = (payload) => {
  return axios.post(`${API_BASE}/campaign/getAllCampaignWithDate`, payload);
};

export const listCampaigngroup = (groupId) => {
  return axios.get(`${API_BASE}/campaign/getCampaignByGroupId`, {
    params: { groupId }
  });
};

export const saveCampaignaudience = (payload) => {
  return axios.post(`${API_BASE}/audience/createAudience`, payload);
};

export const getcampaignByDateRange = (groupId, startDate, endDate, range = null) => {
  let url = `${API_BASE}/campaign/getBYDateRange?groupId=${groupId}&startDate=${startDate}&endDate=${endDate}`;
  if (range) {
    url += `&range=${range}`;
  }
  return axios.get(url);
};

export const saveCreatives = async (brandId = 22, creativeData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/creatives/createCreatives?brandId=${brandId || 22}`,
      creativeData
    );
    return response;
  } catch (error) {
    console.error('Error saving crm audience:', error);
    throw error;
  }
};

export const createDeal = async (payload) => {
  return axios.post(`${API_BASE}/deal/createDeal`, payload);
};

export const getAllDeals = () => {
  return axios.get(`${API_BASE}/deal/getAllDeal`);
};

export const editDeal = (dealId) => {
  return axios.get(`${API_BASE}/deal/getDealById/${dealId}`);
};

export const deleteDeal = (dealId) => {
  return axios.delete(`${API_BASE}/deal/deleteDealById/${dealId}`);
};

export const upadtestatusCreatives = (payload) => {
  return axios.put(`${API_BASE}/creatives/updateStatus`, payload);
};

export const getBrandWithGroupById = (brandId) => {
  return axios.get(`${API_BASE}/brand/getBrandWithGroupById`, {
    params: { brandId }
  });
};

export const createLinktocampaign = async (payload) => {
  return axios.post(`${API_BASE}/creatives/linkToCampaign`, payload);
};

export const getcampaign = async (campaign_id) => {
  try {
    const response = await axios.get(
      `${API_BASE}/campaign/getCampaignById/${campaign_id}?_=${new Date().getTime()}`
    );
    return response;
  } catch (error) {
    console.error('Eror getting campaign:', error);
    throw error;
  }
};

export const getAllBannersizes = () => {
  return axios.get(`${API_BASE}/bannerSize/getAllBannerSize`);
};

export const upadtestatusCampaign1 = (id, status) => {
  return axios.put(`${API_BASE}/campaign/updateStatus/${id}`, null, {
    params: { status }
  });
};

export const listLinkCampaign = (creativesId) => {
  return axios.get(`${API_BASE}/creatives/getLinkedCampaignDetails`, {
    params: { creativesId }
  });
};

export const UnlinkCampaign = (creativesId, campaignId) => {
  return axios.get(`${API_BASE}/creatives/unlinkToCampaign`, {
    params: {
      creativesId,
      campaignId,
    },
  });
};

export const getBrandList = (brandIds) => {
  const ids = Array.isArray(brandIds) ? brandIds.join(",") : brandIds;
  return axios.get(`${API_BASE}/brand/getBrandList`, {
    params: { brandId: ids }
  });
};

export const updatecampaign = async (campaign_id, campaign_data) => {
  try {
    const response = await axios.put(
      `${API_BASE}/campaign/updateCampaignById/${campaign_id}`,
      campaign_data
    );
    return response;
  } catch (error) {
    console.error('Eror updating campaign:', error);
    throw error;
  }
};

export const listUnLinkCampaign = (creativesId, campaignId) => {
  return axios.get(`${API_BASE}/creatives/unlinkToCampaign`, {
    params: { creativesId, campaignId }
  });
};

export const fillterCreative = (creativesId, campaignId) => {
  return axios.get(`${API_BASE}/creatives/filterCreatives`, {
    params: { creativesId, campaignId }
  });
};

// export const createCampaign = async (campaignId, payload) => {
//   return axios.post(
//     `${API_BASE}/campaign/createCampaign/${campaignId}`,
//     payload
//   );
// };



export const createCampaign = async (payload) => {
  return axios.post(
    `${API_BASE}/campaign/createCampaign`,
    payload
  );
};

export const filterCreative = (params = {}) => {
  return axios.get(`${API_BASE}/creatives/filterCreatives`, { params });
};

export const sendMail = (payload) => {
  return axios.post(`${API_BASE}/gmail/sendMail`, payload);
};

export const getkibanaFormula = (payload) => {
  return axios.post(`${API_BASE}/kibanaFormulaArchived/getKibanaFormulaArchivedFilter`, payload);
};

export const getAllKibanaDeviceArchived = (payload) => {
  return axios.post(`${API_BASE}/KibanaDeviceArchived/getAllKibanaDeviceArchived`, payload);
};

export const getAllKibanaCountry = (payload) => {
  return axios.post(`${API_BASE}/KibanaCountryArchived/getAllKibanaCountryArchived`, payload);
};

export const updatecampaignstatus = (payload) => {
  return axios.put(`${API_BASE}/campaign/updateStatus`, payload);
};

export const filterPublishInventoryArchive = (params = {}) => {
  return axios.get(`${API_BASE}/publishInventoryArchive/filter`, { params });
};

export const getkibanaFormulahourly = (payload) => {
  return axios.post(`${API_BASE}/kibanaFormulaArchived/getKibanaFormulaHourlyFilter`, payload);
};

export const filterPublishInventoryArchivePost = (payload) => {
  return axios.post(`${API_BASE}/publishInventoryArchive/getAllPublishInventoryArchive`, payload);
};

export const kibanaFormuladomain = (payload) => {
  return axios.post(`${API_BASE}/kibanaCampaignDomain/getAllKibanaCampaignDomain`, payload);
};

export const getSystemStatus = (payload) => {
  return fetch("https://rtb.adaxxpro.com/ajax", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then((res) => res.json().then((data) => ({ data })));
};

export const kibanaFormulaexcahngereport = (payload) => {
  return axios.post(`${API_BASE}/kibanaExchangeReport/getAllKibanaExchangeReport`, payload);
};

export const createRole = (data) => {
  return axios.post(`${API_BASE}/role/createRole`, data);
};

export const getAllRole = () => {
  return axios.get(`${API_BASE}/role/getAllRole`);
};

export const updateRoleById = (roleId, data) => {
  return axios.put(`${API_BASE}/role/updateRoleById/${roleId}`, data);
};

export const deleteRoleById = (roleId) => {
  return axios.delete(`${API_BASE}/role/deleteRoleById/${roleId}`);
};

export const getRoleById = (roleId) => {
  return axios.get(`${API_BASE}/role/getRoleById/${roleId}`);
};

export const searchPrimaryRegions = (countryId, search) => {
  return axios.get(
    `${API_BASE}/primaryRegion/getAllPrimaryRegionByCountryId/${countryId}`,
    {
      params: { search },
    }
  );
};

export const getDealById = (dealId) => {
  return axios.get(`${API_BASE}/deal/getDealById/${dealId}`);
};

export const updateDeal = (dealId, payload) => {
  return axios.put(`${API_BASE}/deal/updateDealById/${dealId}`, payload);
};

export const getAllconversioncategory = () => {
  return axios.get(`${API_BASE}/conversionCategory/getAllConversionCategory`);
};

export const ConversionEvent = (payload) => {
  return axios.post(`${API_BASE}/conversionEvent/createConversionEvent`, payload);
};

export const getConversionEvent = (conversionId) => {
  return axios.post(`${API_BASE}/conversionEvent/getAllConversionEvent`, {
    conversionId: conversionId
  });
};

export const getDashboardOverview = (payload) => {
  return axios.post(`${API_BASE}/dashboardoverview`, payload);
};

export const getMacro = () => {
  return axios.get(`${API_BASE}/macro/getAllMacro`);
};

export const creativemacros = (payload) => {
  return axios.post(`${API_BASE}/conversion/saveSelectedMacros`, payload);
};

export const getAllconversionMmptype = () => {
  return axios.get(`${API_BASE}/conversionMmpType/getAllConversionMmpType`);
};

export const getAllMenu = () => {
  return axios.get(`${API_BASE}/menu/getAllMenu`);
};

export const GetAccess = (payload = {}) => {
  try {
    const roleId = localStorage.getItem("roleId");
    const accessPayload = {
      ...payload,
      roleId: roleId || payload.roleId
    };
    return axios.post(`${API_BASE}/role/getAccessRoleRecord`, accessPayload);
  } catch (error) {
    console.error("Error in GetAccess:", error);
    return Promise.reject(error);
  }
};

export const getroleaccess = (payload) => {
  return axios.post(`${API_BASE}/role/getAccessRoleRecord`, payload);
};

export const updategetrollaccess = (payload) => {
  return axios.put(`${API_BASE}/assignRole/updateAssignRole`, payload);
};

export const creativelist = (payload) => {
  return axios.post(`${API_BASE}/kibanaCreative/getkibanaCreative`, payload);
};

export const countrywise = (payload) => {
  return axios.post(`${API_BASE}/impressionctr`, payload);
};

export const dayofweek = (payload) => {
  return axios.post(`${API_BASE}/dayofweek`, payload);
};

export const getPostBackConversion = (payload) => {
  return axios.post(`${API_BASE}/campaign/getPostBackConversion`, payload);
};

export const getAllkibanapublisher = () => {
  return axios.get(`${API_BASE}/kibanaPublisher/getAllkibanaPublisherRecord`);
};

export const getBillings = () => {
  return axios.get(`${API_BASE}/billings/getAllBillings`);
};

export const getAllBillingHistory = (params = {}) => {
  return axios.get(`${API_BASE}/billingHistory/getAllBillingHistory`, { params });
};

export const createBilling = (payload) => {
  return axios.post(`${API_BASE}/billings/createbilling`, payload);
};

export const getAlladvertiserLogin = () => {
  return axios.get(`${API_BASE}/advertisers`);
};

let _cachedExchangesResponse = null;
export const getAllExchangeCached = async () => {
  if (_cachedExchangesResponse) return _cachedExchangesResponse;
  const res = await getAllExchange();
  _cachedExchangesResponse = res;
  return res;
};



let _cachedDealsResponse = null;
export const getAllDealsCached = async () => {
  if (_cachedDealsResponse) return _cachedDealsResponse;
  const res = await getAllDeals();
  _cachedDealsResponse = res;
  return res;
};

export const spendandrevenue = (payload) => {
  return axios.post(`${API_BASE}/spendandrevenue`, payload);
};

export const updateBillingStatus = (payload) => {
  return axios.post(`${API_BASE}/billings/updatestatusbilling`, payload);
};

export const getAllAdvertisers = () => {
  return axios.get(`${API_BASE}/user/getAllAdvertiser`);
};

export const updateBilling = (id, payload) => {
  return axios.put(`${API_BASE}/billings/updateBilling/${id}`, payload);
};

export const getAllMobilecarrier = () => {
  return axios.get(`${API_BASE}/mobileCarriers/getAllMobileCarriers`);
};

export const getAllCreativeAttribute = () => {
  return axios.get(`${API_BASE}/creativeAttributes/getAllCreativeAttributes`);
};

export const oneTimeReportCreate = (payload) => {
  return axios.post(`${API_BASE}/report/otrcreate`, payload);
};

export const getOneTimeReport = (payload) => {
  return axios.get(`${API_BASE}/report/getonetimereport`, payload);
};

export const downloadOneTimeReport = (reportId) => {
  return axios.get(`${API_BASE}/report/download/${reportId}`, {}, { responseType: 'blob' });
};


export const getAllReportTypes = () => {
  return axios.get(`${API_BASE}/reportTypes/getAllReportTypes`);
};

export const getAllReportDimensions = () => {
  return axios.get(`${API_BASE}/reportdimensions/getAllReportDimensions`);
};


export const getScheduleReport = () => {
  return axios.get(`${API_BASE}/schedulereport/list`);
};

export const createScheduleReport = (payload) => {
  return axios.post(`${API_BASE}/schedulereport/create`, payload);
};

export const updateScheduleReportStatus = (id, status) => {
  return axios.put(`${API_BASE}/schedulereport/updateStatus/${id}`, null, {
    params: { status }
  });
};
export const checkEmail = (payload) => {
  return axios.post(`${API_BASE}/forgotPassword/checkEmail`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const resetPassword = (payload) => {
  return axios.post(`${API_BASE}/forgotPassword/resetPassword`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};