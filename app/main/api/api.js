import fetch from "node-fetch";

import * as baseUrls from "../../shared/resources/BaseUrls/BaseUrls";
import { envIs } from "../../shared/utils/JavaScriptUtils/JavaScriptUtils";
import GlobalStore from "../../shared/GlobalStore/GlobalStore";
import { storeKeys } from "../../shared/resources/StoreKeys/StoreKeys";
import { devLog } from "../../shared/utils/JavaScriptUtils/JavaScriptUtils";


const userAgent = () => {
  const dummyDevUserAgent = `only-used-for-development, ${process.env.EMAIL}`;
  return envIs("development")
    ? dummyDevUserAgent
    : `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0`;
};

const cookieHeader = () => {
  const globalStore = GlobalStore.getInstance();

  const poeSessionId = globalStore.get(storeKeys.POE_SESSION_ID);

  return `POESESSID=${poeSessionId}`;
};

const apiHeaders = () => {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader(),
    "User-Agent": userAgent(),
    "X-Requested-With": "XMLHttpRequest",
  };
};

export const itemDetails = (ids, game) => {
  const itemUrl =
    game === "poe2"
      ? `${baseUrls.poe2FetchAPI}/${ids}`
      : `${baseUrls.poeFetchAPI}/${ids}`;

  return fetch(itemUrl, {
    headers: apiHeaders(),
  });
};

export const postToHideout = (hideoutToken, game) => {
  const hideoutUrl =
    game === "poe2"
      ? `${baseUrls.poe2HideoutAPI}`
      : `${baseUrls.poeHideoutAPI}`;

  const data = JSON.stringify({
    token: hideoutToken,
  });

  return fetch(hideoutUrl, {
    method: "POST",
    headers: apiHeaders(),
    body: data,
  });
};

export const socketHeaders = () => {
  const socketOrigin = "https://www.pathofexile.com";

  return Object.assign(apiHeaders(), { Origin: socketOrigin });
};
