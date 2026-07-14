export const VERSION = "1.0.0";
export const PROD_API_URL = "https://rtb.adaxxpro.com:7379/api";   //http://103.181.148.101:7379/api
export const LOCAL_API_URL = "https://rtb.adaxxpro.com:7379/api";  //https://rtb.adaxxpro.com:7379/api


export const RUN_API_URL = window.location.hostname !== "localhost" ? LOCAL_API_URL : PROD_API_URL;
//export const SPRING_BOOT_API_URL = "http://172.104.171.176:8080/api";

export const ROLES = {
  ADMIN: "",
  USER: "user",
};

export const MESSAGES = {
  SUCCESS: "Data saved successfully!",
  ERROR: "Something went wrong!",
};


