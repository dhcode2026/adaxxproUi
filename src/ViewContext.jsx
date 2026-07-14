import { useState } from 'react';
import createUseContext from "constate";
import axios from 'axios';
import { SampleBanner } from './views/simulator/Utils';
import { RUN_API_URL } from "./consts.jsx"

var undef;
const axiosInstance = axios.create({
});
var jwt;
const ViewContext = () => {

  const [ssp, setSsp] = useState('Nexage')
  const [uri, setUri] = useState('/rtb/bids/nexage');
  const [url, setUrl] = useState('http://' + window.location.hostname + ':8080');
  const [bidtype, setBidtype] = useState('Banner');
  const [bidvalue, setBidvalue] = useState(JSON.stringify(SampleBanner, null, 2));
  const [bidobject, setBidobject] = useState(SampleBanner);
  const [bidresponse, setBidresponse] = useState({ "response": "will go here" })
  const [nurl, setNurl] = useState('');
  const [xtime, setXtime] = useState('xtime: 0, rtt: 0');
  const [adm, setAdm] = useState('');
  const [winsent, setWinsent] = useState(false);

  const changeSsp = (name) => {
    setSsp(name);
  }
  const changeUri = (name) => {
    setUri(name);
  }
  const changeUrl = (name) => {
    setUrl(name);
  }
  const changeBidtype = (name) => {
    setBidtype(name);
  }
  const changeBidvalue = (value) => {
    setBidvalue(value);
    var x = eval('(' + value + ')');
    setBidobject(x);
  }
  const changeBidresponse = (value) => {
    setBidresponse(value)
  }
  const changeNurl = (value) => {
    setNurl(value);
  }
  const changeXtime = (value) => {
    setXtime(value)
  }
  const changeAdm = (value) => {
    setAdm(value);
  }
  const changeWinsent = (value) => {
    setWinsent(value);
  }

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('103.181.148.101:7379');
  const [members, setMembers] = useState([]);
  const [accounting, setAccounting] = useState({});
  const [runningCampaigns, setRunningCampaigns] = useState([])
  const [RunningBudgetCampaigns, setRunningBudgetCampaigns] = useState([])
  const [campaigns, setCampaigns] = useState([]);
  const [rules, setRules] = useState([]);
  const [language, setLanguages] = useState([]);
  const [affiliates, setRegions] = useState([]);
  const [bidders, setBidders] = useState([]);
  const [targets, setTargets] = useState([]);
  const [subregions, setSubRegions] = useState([]);
  const [country, setCountry] = useState([]);
  const [city, setCity] = useState([]);
  const [state, setState] = useState([]);
  const [categoryvalue, setCategoryValue] = useState([]);
  const [category, setCategory] = useState([]);
  const [creatives, setCreatives] = useState([]);
  const [macros, setMacros] = useState({});
  const [customer, setCustomer] = useState('');
  const [user, setUser] = useState({});
  const [bannersize, setBannersize] = useState([]);
  const [conversion, setConversion] = useState([]);
  const [audience, setAudience] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [make, setMake] = useState([]);
  const [model, setModel] = useState([]);


  const reset = () => {
    jwt = undef;
    setLoggedIn(false);
    setName('');
    setMembers([]);
    setAccounting([]);
    setRunningCampaigns([]);
    setRunningBudgetCampaigns([]);
    setCampaigns([]);
    setBidders([]);
    setRules([]);
    setLanguages([]);
    setTargets([]);
    setRegions([]);
    setSubRegions([]);
    setCountry([]);
    setState([]);
    setCity([]);
    setCategoryValue([]);
    setCategory([]);
    setBannersize([]);
    setConversion([]);
    setAudience([]);
    setInventory([]);
    setMake([]);
    setModel([]);
  }

  const changeLoginState = async (value) => {
    console.log("changeLoginState->", value);
    if (!value)
      reset();

    await setLoggedIn(value);
    return loggedIn;
  }

  const getToken = async (c, n, p, s) => {
    if (c !== undef)
      setCustomer(c);
    if (s !== undef)
      setServer(s);
    if (n !== undef)
      setName(n);
    if (p !== undef)
      setPassword(p);

    var cmd;
    var srvr;
    if (c === undef) {
      cmd = {
        type: "GetToken#",
        customer: customer,
        username: name,
        password: password,
      }
      srvr = server;
    } else {
      cmd = {
        type: "GetToken#",
        customer: c,
        username: n,
        password: p
      }
      srvr = s;
    }

    console.log("GetToken starts: " + JSON.stringify(cmd, null, 2));
    var data = await execute(cmd, srvr);
    console.log("GetToken returns: " + JSON.stringify(data, null, 2));
    if (data === undef) {
      jwt = undef;
      return;
    }
    jwt = data.token;
    setLoggedIn(true);
    localStorage.setItem("token", jwt);
    localStorage.setItem("tokenSavedAt", Date.now().toString());
    return data.token;
  }

  const getBudget = async (campaign, creative, type) => {
    var cmd = {
      token: jwt,
      type: "GetBudget#"
    }

    if (campaign !== undef) {
      cmd.campaign = campaign;
      if (creative !== undef) {
        cmd.creative = creative;
        cmd.adtype = type
      }
    }

    var data = await execute(cmd);
    if (data === undef) {
      alert("Execution failed");
      return;
    }
    console.log("GetBudget returns: " + JSON.stringify(data, null, 2));
    return data;
  }

  const getValues = async (campaign, creative, type) => {
    var cmd = {
      token: jwt,
      type: "GetValues#"
    }

    if (campaign !== undef) {
      cmd.campaign = campaign;
      if (creative !== undef) {
        cmd.creative = creative;
        cmd.adtype = type;
      }
    }

    var data = await execute(cmd);
    if (data === undef) {
      alert("Execution failed");
      return;
    }

    console.log("GetBudget returns: " + JSON.stringify(data, null, 2));
    return data;
  }


  const listCampaigns = async () => {
    var cmd = {
      token: jwt,
      type: "ListCampaigns#"
    };

    console.log("LIST CAMPAIGNS START: " + JSON.stringify(cmd, null, 2));

    var data = await execute(cmd);

    if (data === undef) {
      alert("Execution failed");
      return;
    }

    console.log("ListCampaigns returns: " + JSON.stringify(data, null, 2));
    setRunningCampaigns(data.campaigns);
    return data.campaigns;
  }

  //My Try 
  const GetCampaignBudgetCmd = async () => {
    var cmd = {
      token: jwt,
      type: "GetCampaignBudget#"
    };

    console.log("LIST CAMPAIGNS START: " + JSON.stringify(cmd, null, 2));

    var data = await execute(cmd);

    if (data === undef) {
      alert("Execution failed");
      return;
    }

    console.log("ListCampaigns returns: " + JSON.stringify(data, null, 2));
    setRunningBudgetCampaigns(data.campaigns);
    return data.campaigns;
  }



  const listRules = async () => {
    // get a token, if the tokken is valid, proceed

    var cmd = {
      token: jwt,
      type: "SQLListRules#"
    };
    var data = await execute(cmd);
    if (data === undef)
      return;
    setRules(data.rules);
    return data.rules;
  }




  const listLanguages = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListLanguage#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListLanguage returns: " + JSON.stringify(data, null, 2));
    setLanguages(data.language);
    return data.language;
  }






  const listRegions = async () => {

    var cmd = {
      token: jwt,
      type: "SQLListRegions#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListRegions returns: " + JSON.stringify(data, null, 2));
    setRegions(data.affiliates);
    return data.affiliates;
  }



  const listCategory = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListCategoryCmd#",
      //value_id:value_id
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("SQLListCategoryCmd returns: " + JSON.stringify(data, null, 2));
    setCategory(data.category);
    return data.category;
  }

  const listCategoryValue = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListCategoryValue#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("SQLListCategoryValue returns: " + JSON.stringify(data, null, 2));
    setCategoryValue(data.categoryvalue);
    return data.categoryvalue;
  }


  const listSubRegions = async (region_id) => {
    var cmd = {
      token: jwt,
      type: "SQLListSubRegions#",
      region_id: region_id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLListSubRegions returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.subregions;
  }


  const listCountry = async (subregion_id) => {
    var cmd = {
      token: jwt,
      type: "SQLListCountry#",
      subregion_id: subregion_id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLListCountry returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.country;
  }

  const listState = async (country_id) => {
    var cmd = {
      token: jwt,
      type: "SQLListState#",
      country_id: country_id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLListState returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.state;
  }


  const listCity = async (state_id) => {
    var cmd = {
      token: jwt,
      type: "SQLListCity#",
      state_id: state_id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLListCity returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.city;
  }




  const listMacros = async () => {

    var cmd = {
      token: jwt,
      type: "ListMacros#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    if (data.error) {
      return;
    }
    console.log("ListMacros returns: " + JSON.stringify(data, null, 2));
    setMacros(data.macros);
    return data.macros;
  }

  const listTargets = async () => {
    // get a token, if the tokken is valid, proceed
    if (jwt === undef) {
      //alert("JWT UNDEF");
    }
    var cmd = {
      token: jwt,
      type: "SQLListTargets#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListTargets returns: " + JSON.stringify(data, null, 2));
    setTargets(data.targets);
    return data.targets;
  }

  const creativesAvailable = async (customer, id) => {
    var cmd = {
      token: jwt,
      id: id,
      customer_id: customer,
      type: "CREATIVESAVAILABLE#"
    };

    var data = await execute(cmd);
    if (data === undef)
      return;

    if (data.error) {
      alert(data.message);
    }
    return data.creatives;
  }

  const configureAwsObject = async (obj) => {

    if (obj.size === "")
      obj.size = undef;
    else
      obj.size = Number(obj.size);

    var cmd = {
      token: jwt,
      type: "ConfigureAws#",
      map: obj
    };
    var data = await execute(cmd);

    if (data === undef)
      return;

    console.log("ConfigureAws returns: " + JSON.stringify(data, null, 2));
    setTargets(data.targets);
    return data.targets;
  }

  const getUser = async (username) => {
    var cmd = {
      token: jwt,
      username: username,
      type: "SQLGetUser#"
    };
    var data = await execute(cmd);
    console.log("GetUser returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;

    var user = JSON.parse(data.user);
    setUser(user);
    return user;
  }

  const addNewUser = async (user) => {
    var cmd = {
      token: jwt,
      user: JSON.stringify(user),
      type: "SQLAddNewUser#"
    };
    var data = await execute(cmd);
    console.log("AddNewUser returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;

    return true;
  }

  const addNewAffiliate = async (af) => {
    // get a token, if the tokken is valid, proceed

    var cmd = {
      token: jwt,
      affiliate: JSON.stringify(af),
      type: "SQLAddNewAffiliate#"
    };
    var data = await execute(cmd);
    console.log("AddNewAffiliate returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;

    return true;
  }

  const setNewUser = async (user) => {
    // get a token, if the tokken is valid, proceed

    var cmd = {
      token: jwt,
      user: JSON.stringify(user),
      type: "SQLAddNewUser#"
    };
    var data = await execute(cmd);
    if (data === undef)
      return;

    if (data.error) {
      alert(data.message);
    }
    setUser(user);
    return true;
  }

  const deleteUser = async (id) => {
    // get a token, if the tokken is valid, proceed

    var cmd = {
      token: jwt,
      id: id,
      type: "SQLDeleteUser#"
    };
    var data = await execute(cmd);
    console.log("SetNewUser returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;
    return true;
  }

  const deleteAffiliate = async (id) => {
    // get a token, if the tokken is valid, proceed

    var cmd = {
      token: jwt,
      id: id,
      type: "SQLDeleteAffiliate#"
    };
    var data = await execute(cmd);
    console.log("DeleteAffiliate returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;
    return true;
  }

  const listUsers = async (cid) => {
    // get a token, if the tokken is valid, proceed
    var cmd = {
      token: jwt,
      type: "SQLListUsers#"
    };
    var data = await execute(cmd);
    console.log("ListUsers returns: " + JSON.stringify(data, null, 2));
    if (data === undef)
      return;

    return data.users;
  }

  const listAffiliates = async () => {
    // get a token, if the tokken is valid, proceed
    var cmd = {
      token: jwt,
      type: "SQLListAffiliates#"
    };
    var data = await execute(cmd);
    if (data === undef)
      return;

    var u = data.affiliates;
    console.log("ListAffiliates returns: " + JSON.stringify(u, null, 2));
    return u;
  }

  const getBidders = async () => {

    var cmd = {
      token: jwt,
      type: "GetBiddersStatus#"
    };
    var data = await execute(cmd);
    if (data == undef)
      return;
    setBidders(data.entries);
    return data.entries;
  }

  const getAccounting = async () => {
    var cmd = {
      token: jwt,
      type: "GetAccounting#"
    };
    var data = await execute(cmd);

    //console.log("GetAccounting returns: " + JSON.stringify(data,null,2));
    if (data === undef)
      return;
    setAccounting(data.accounting);
    return data.accounting;
  }

  const getNewCreative = async (ctype, name) => {
    var cmd = {
      token: jwt,
      type: "SQLGetNewCreative#",
      ctype: ctype,

      campaign: name
    };
    var result = await execute(cmd);

    console.log("SQLGetNewCreative returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }

  const deleteCampaign = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteCampaign#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteCampaign returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }

  const deleteRule = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteRule#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteRule returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }

  const deleteTarget = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteTarget#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteTarget returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }

  const deleteCreative = async (id, key) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteCreative#",
      id: id,
      key: key
    };
    var result = await execute(cmd);

    console.log("SQLDeleteCreative returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }


  const getDbCampaigns = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListCampaigns#"
    };
    var data = await execute(cmd);
    if (!data)
      return;
    setCampaigns(data.campaigns);
    return data.campaigns;
  }

  const getDbConversion = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListConversionCmd#"
    };
    var data = await execute(cmd);
    if (!data)
      return;
    setConversion(data.conversion);
    return data.conversion;
  }

  // given a campaign id, return it's name
  const getCampaignNameById = (id) => {
    if (id !== 0) {
      for (var camp of campaigns) {
        if (camp.id === id)
          return camp.name;
      }
    }
    return "*** None ***"
  }

  const getCampaignNameByTargetId = (id) => {
    if (id !== 0) {
      for (var camp of campaigns) {
        if (camp.target_id === id)
          return camp.name;
      }
    }
    return "*** None ***"
  }


  // given a target id, return it's name
  const getTargetNameById = (id) => {
    if (id !== 0) {
      for (var targ of targets) {
        if (targ.id === id)
          return targ.name;
      }
    }
    return "*** None ***"
  }

  const listCreatives = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListCreatives#"
    };
    var data = await execute(cmd);
    if (!data)
      return;

    console.log("=====> SQLListCreatives returns: " + JSON.stringify(data, null, 2));
    setCreatives(data.creatives);
    return data.creatives;
  }

  const listSymbols = async () => {
    var cmd = {
      token: jwt,
      type: "ListBigData#"
    };
    var data = await execute(cmd);
    console.log("=====> listSymbols returns: " + JSON.stringify(data, null, 2));
    if (!data)
      return;

    return data;
  }

  const deleteSymbol = async (name) => {
    var cmd = {
      token: jwt,
      type: "DeleteSymbol#",
      symbol: name
    };
    var data = await execute(cmd);
    if (!data)
      return;

    console.log("=====> deleteSymbols returns: " + JSON.stringify(data, null, 2));
    return data;
  }

  const querySymbol = async (name, key) => {
    var cmd = {
      token: jwt,
      type: "QuerySymbol#",
      symbol: name,
      value: key
    };
    var data = await execute(cmd);
    if (!data)
      return;

    console.log("=====> querySymbols returns: " + JSON.stringify(data, null, 2));
    return data.reply;
  }

  const queryHazelcast = async (name, key) => {
    var cmd = {
      token: jwt,
      type: "QuerySymbol#",
      symbol: name,
      predicate: key
    };
    var data = await execute(cmd);
    if (!data)
      return;

    console.log("=====> querySymbols returns: " + JSON.stringify(data, null, 2));
    return data.reply;
  }

  const getDbCampaign = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetCampaign#",
      id: id
    };
    var data = await execute(cmd);
    if (!data)
      return;

    console.log("=====> GetDbCampaign returns: " + JSON.stringify(data, null, 2));
    return JSON.parse(data.campaign);
  }

  const findCreativeByName = (name) => {
    for (var i = 0; i < creatives.length; i++) {
      var c = creatives[i];
      if (c.name === name) {
        return c;
      }
    }
  }

  // SQLStatusUpdateCreative#
  const statusUpdateCreative = async ({ id, status, creativeType }) => {
    if (!jwt) {
      console.error("No JWT token available");
      return;
    }

    const cmd = {
      token: jwt,
      type: "SQLStatusUpdateCreative#", // API command type
      id: id,
      status: status,
      creativeType: creativeType // renamed field to match Java
    };

    console.log("==========> Sending command:", JSON.stringify(cmd, null, 2));

    try {
      const result = await execute(cmd);
      if (!result) {
        console.error("No response from server");
        return;
      }
      console.log("Status updated successfully:", result);
      return result;
    } catch (err) {
      console.error("Failed to update creative status:", err);
    }
  };



  const addNewCampaign = async (e) => {
    var cmd = {
      token: jwt,
      type: "SQLAddNewCampaign#",
      campaign: e
    };

    console.log("==========>" + JSON.stringify(cmd, null, 2));
    var result = await execute(cmd);
    if (!result)
      return;
    
    
    console.log("==========>" + typeof result);

    if (result === undef)
      return;
    return result.id;
  }

  const addNewCreative = async (e) => {
    var cmd = {
      token: jwt,
      type: "SQLAddNewCreative#",
      creative: JSON.stringify(e)
    };


    //console.log("==========>" + JSON.stringify(cmd,null,2));
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLAddNewCreative returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.id;
  }


  const addNewRule = async (e) => {
    var cmd = {
      token: jwt,
      type: "SQLAddNewRule#",
      rule: JSON.stringify(e)
    };

    console.log("==========>" + JSON.stringify(cmd, null, 2));
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLAddNewRule returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.id;
  }
  const addNewConversion = async (conversion) => {
    const payloadConversion = { ...conversion, id: conversion.id || 0 };

    const cmd = {
      token: jwt,
      type: "SQLAddNewConversion#",
      conversion: JSON.stringify(payloadConversion), // send as string
    };

    console.log("==========>" + JSON.stringify(cmd, null, 2));

    const result = await execute(cmd);
    if (!result) return;

    console.log("SQLAddNewConversion returns: " + JSON.stringify(result, null, 2));
    return result.id;
  };


  const addNewTarget = async (e) => {
    var cmd = {
      token: jwt,
      type: "SQLAddNewTarget#",
      target: JSON.stringify(e)
    };

    console.log("==========>" + JSON.stringify(cmd, null, 2));
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLAddNewTarget returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.id;
  }


  const getNewCampaign = async (name) => {
    var cmd = {
      token: jwt,
      type: "SQLGetNewCampaign#",
      campaign: name
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetNewCampaign returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }

  const getNewTarget = async (name) => {
    var cmd = {
      token: jwt,
      type: "SQLGetNewTarget#",
      name: name
    };
    var result = await execute(cmd);
    if (!result)
      return;

    //console.log("SQLGetNewTarget returns: " + JSON.stringify(result,null,2));
    if (result === undef)
      return;
    return result.data;
  }

  const getNewRule = async (name) => {
    var cmd = {
      token: jwt,
      type: "SQLGetNewRule#",
      name: name
    };
    var result = await execute(cmd);
    if (!result)
      return;
    if (result === undef)
      return;
    return result.data;
  }


  const getNewConversion = async (name) => {
    var cmd = {
      token: jwt,
      type: "SQLGetNewConversion#",
      name: name
    };
    var result = await execute(cmd);
    if (!result)
      return;
    if (result === undef)
      return;
    return result.data;
  }

  const getRule = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetRule#",
      id: id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetRule returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.rule;
  }



  const getConversion = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetConversion#",
      id: id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetConversion returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.conversion;
  }




  const getCreative = async (id, key) => {
    var cmd = {
      token: jwt,
      type: "SQLGetCreative#",
      id: id,
      key: key
    };

    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetCreative returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;

    if (result.data.width_range !== undef)
      result.data.sizeType = 3;
    else
      if (result.data.width_height_list !== undef)
        result.data.sizeType = 4;
      else
        if (result.data.width > 0)
          result.data.sizeType = 2;
        else
          result.data.sizeType = 1

    if (result.data.dealSpec === undef)
      result.data.dealType = 1;           // no deals

    return result.data;
  }

  const getTarget = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetTarget#",
      id: id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetTarget returns: " + JSON.stringify(result.target, null, 2));
    return result.target;
  }

  const macroSub = (data) => {
    var keys = Object.keys(macros);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.indexOf("$EXTERNAL") != -1) {
        key = "{external}";
      }
      var sub = macros[key];
      var re = new RegExp(key);
      data = data.replace(re, sub);
    }
    console.log("DATA: " + data);
    return data;
  }
  const forceUpdate = async () => {
    var cmd = {
      token: jwt,
      type: "Refresh#"
    };
    var result = await execute(cmd);
    if (!result)
      return;
    console.log("ForceUpdate returns: " + JSON.stringify(result.target, null, 2));
    return result.target;
  }
  const getReasons = async (id) => {
    var cmd = {
      token: jwt,
      campaign: id,
      type: "GetReason#"
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("GetReason returns: " + JSON.stringify(result.reasons, null, 2));
    return result.reasons;
  }
  const listBannersize = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListBannerSize#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListBanner size returns: " + JSON.stringify(data.null, 2));
    setBannersize(data.bannersize);
    return data.bannersize;
  }
  const deleteConversion = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteConversion#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteConversion returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }
  const addNewAudience = async (audience) => {
    // ensure new audiences have id = 0
    const payloadAudience = { ...audience, id: audience.id || 0 };

    var cmd = {
      token: jwt,
      type: "SQLAddNewAudience#",
      audience: JSON.stringify(payloadAudience), // send as string
    };

    console.log("==========>" + JSON.stringify(cmd, null, 2));
    var result = await execute(cmd);
    if (!result) return;
    console.log("SQLAddNewAudience returns: " + JSON.stringify(result, null, 2));
    if (result === undef) return;
    return result.id;
  };
  const getDbAudience = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListAudienceCmd#"
    };
    var data = await execute(cmd);
    if (!data)
      return;
    setAudience(data.audience);
    return data.audience;
  }

  const deleteAudience = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteAudience#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteAudience returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }


  const getAudience = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetAudience#",
      id: id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetAudience returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.audience;
  }



  const addNewInventory = async (e) => {
    var cmd = {
      token: jwt,
      type: "SQLAddNewInventory#",
      inventory: JSON.stringify(e)
    };
    console.log("==========>" + JSON.stringify(cmd, null, 2));
    var result = await execute(cmd);
    if (!result)
      return;
    console.log("SQLAddNewInventory returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.id;
  }


  const getDbInventory = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListInventoryCmd#"
    };
    var data = await execute(cmd);
    if (!data)
      return;
    setInventory(data.inventory);
    return data.inventory;
  }
  const deleteInventory = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLDeleteInventory#",
      id: id
    };
    var result = await execute(cmd);

    console.log("SQLDeleteInventory returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.data;
  }


  const getInventory = async (id) => {
    var cmd = {
      token: jwt,
      type: "SQLGetInventory#",
      id: id
    };
    var result = await execute(cmd);
    if (!result)
      return;

    console.log("SQLGetInventory returns: " + JSON.stringify(result, null, 2));
    if (result === undef)
      return;
    return result.inventory;
  }

  const listMake = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListMake#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListMake returns: " + JSON.stringify(data, null, 2));
    setMake(data.make);
    return data.make;
  }

  const listModel = async () => {
    var cmd = {
      token: jwt,
      type: "SQLListModel#"
    };
    var data = await execute(cmd);

    if (data === undef)
      return;
    console.log("ListModel returns: " + JSON.stringify(data, null, 2));
    setModel(data.model);
    return data.model;
  }
  const execute = async (cmd, srvr) => {
    if (srvr === undef)
      srvr = RUN_API_URL;
    try {
      srvr = RUN_API_URL;
      cmd.token = localStorage.getItem("token");
      var response = await axiosInstance.post(srvr, JSON.stringify(cmd), { responseType: 'text' });
      if (response.data && response.data.error) {
        if (response.data.message === 'Timed out' || response.data.message === 'Token expired') {
          jwt = localStorage.getItem("token");
          if (jwt === undef) {
            alert("Can't get a new token");
            return;
          } else {
            cmd.token = localStorage.getItem("token");
            response = await axiosInstance.post(srvr, JSON.stringify(cmd), { responseType: 'text' });
            if (!response.error) {
              console.log(response.data)
              return response.data;
            }
          }
        }
        alert("Error: " + response.data.message);
        return;
      }
      console.log("------>" + JSON.stringify(response, null, 2));
      return response.data;
    } catch (error) {
      alert(error);
    }
  }

  const sendCallback = async (srvr) => {
    if (srvr === undef) {
      alert("No callback specified");
      return;
    }
    try {
      var response = await axiosInstance.get(srvr, { responseType: 'text' });
      return response;
    } catch (error) {
      alert(error);
    }
    return undef;
  }
  const getCount = (acc, name, tail) => {
    // Convert name to id.
    for (var i = 0; i < campaigns.length; i++) {
      var c = campaigns[i];
      if (c.name === name) {
        var id = "" + c.id + tail;
        if (acc[id] === undef)
          return 0;
        return acc[id];
      }
    }
    return 0;
  }

  return {
    members, loggedIn, changeLoginState, listCampaigns, GetCampaignBudgetCmd, runningCampaigns, RunningBudgetCampaigns, getBidders, bidders,
    getAccounting, accounting, getCount, getNewCampaign, getNewTarget, getNewRule, reset, getNewConversion,
    getDbCampaigns, campaigns, getNewCreative, statusUpdateCreative, addNewCampaign, deleteCampaign, getDbCampaign,
    listRules, rules, addNewRule, getRule, deleteRule, addNewTarget, listTargets, targets, getTarget, deleteTarget,
    creatives, listCreatives, addNewCreative, getCreative, deleteCreative, findCreativeByName,
    forceUpdate, getReasons, macroSub, listSymbols, deleteSymbol, listMacros, getToken, language, listLanguages, country, listCountry, bannersize, listBannersize,

    ssp, changeSsp, uri, changeUri, url, changeUrl, bidtype, changeBidtype, bidvalue, changeBidvalue, bidobject,
    bidresponse, changeBidresponse, nurl, changeNurl, xtime, changeXtime, setAdm, adm, changeAdm, winsent, affiliates, listRegions, listSubRegions, subregions,

    changeWinsent, sendCallback, configureAwsObject, deleteInventory, make, listMake, model, listModel,

    querySymbol, queryHazelcast, state, listState, city, listCity, categoryvalue, listCategoryValue, category, listCategory,

    creativesAvailable, getCampaignNameById, getTargetNameById, getCampaignNameByTargetId, inventory, getDbInventory, getInventory,

    getBudget, getValues, conversion, getDbConversion, getConversion, deleteConversion, addNewAudience, audience, getDbAudience, deleteAudience, getAudience,

    user, getUser, setNewUser, deleteUser, listUsers, listAffiliates, deleteAffiliate, addNewUser, addNewAffiliate, addNewConversion, addNewInventory
  };
};

export const useViewContext = createUseContext(ViewContext); 