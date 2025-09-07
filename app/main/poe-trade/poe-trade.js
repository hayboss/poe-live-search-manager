import { itemDetails, postToHideout } from "../api/api";
import {
  safeGet,
  safeJsonResponse,
  isDefined,
  devErrorLog,
} from "../../shared/utils/JavaScriptUtils/JavaScriptUtils";
import * as electronUtils from "../utils/electron-utils/electron-utils";
import HttpRequestLimiter from "../http-request-limiter/http-request-limiter";
import { ipcEvents } from "../../shared/resources/IPCEvents/IPCEvents";
import { windows } from "../../shared/resources/Windows/Windows";

const startReservoirIncreaseListener = () => {
  const intervalId = setInterval(() => {
    return HttpRequestLimiter.currentReservoir().then(currentReservoir => {
      if (currentReservoir > 0 && HttpRequestLimiter.requestsExhausted) {
        HttpRequestLimiter.requestsExhausted = false;

        electronUtils.send(
          windows.MAIN,
          ipcEvents.RATE_LIMIT_STATUS_CHANGE,
          HttpRequestLimiter.requestsExhausted
        );

        clearInterval(intervalId);
      }
    });
  }, 1000);
};

export const fetchItemDetails = (ids, game) =>
  HttpRequestLimiter.schedule(() => {
    return itemDetails(ids, game)
      .then(data => safeJsonResponse(data))
      .then(parsedData =>
        HttpRequestLimiter.currentReservoir().then(currentReservoir => {
          if (currentReservoir === 0 && !HttpRequestLimiter.requestsExhausted) {
            HttpRequestLimiter.requestsExhausted = true;

            electronUtils.send(
              windows.MAIN,
              ipcEvents.RATE_LIMIT_STATUS_CHANGE,
              HttpRequestLimiter.requestsExhausted
            );

            startReservoirIncreaseListener();
          }

          const itemDetailsResponse = safeGet(parsedData, ["result"]);

          if (isDefined(itemDetailsResponse)) {
            return itemDetailsResponse;
          }

          throw new Error(`Item details not found for ${ids}`);
        })
      )
      .catch(error => {
        devErrorLog(error);
        electronUtils.sendError(error.toString());
        throw error;
      });
  });

export const getWhisperMessage = itemDetailsResponse => {
  const whisperMessage = safeGet(itemDetailsResponse, ["listing", "whisper"]);

  if (!isDefined(whisperMessage)) {
    return "";
  }

  return whisperMessage;
};

export const getHideoutMessage = itemDetailsResponse => {
  const itemName = safeGet(itemDetailsResponse, ["item", "name"]);
  const baseType = safeGet(itemDetailsResponse, ["item", "baseType"]);
  const hideoutMessage = `${itemName} ${baseType}`

  if (!isDefined(hideoutMessage)) {
    return "";
  }

  return hideoutMessage;
};

export const getHideoutToken = itemDetailsResponse => {
  const hideoutToken = safeGet(itemDetailsResponse, [
    "listing",
    "hideout_token",
  ]);

  if (!isDefined(hideoutToken)) {
    return "";
  }

  return hideoutToken;
};

export const goToHideout = (hideoutToken, game) => {
  return postToHideout(hideoutToken, game);
};

export const getPrice = itemDetailsResponse => {
  const amount = safeGet(itemDetailsResponse, ["listing", "price", "amount"]);
  const currency = safeGet(itemDetailsResponse, [
    "listing",
    "price",
    "currency",
  ]);

  if (amount === null || currency === null) return "";

  return `${amount} ${currency}`;
};

export const notifyUser = (itemName, price) => {
  const title = `New ${itemName} listed`;

  electronUtils.doNotify({
    title,
    body: price,
  });
};
