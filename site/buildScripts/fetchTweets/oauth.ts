import crypto from "crypto";

import config from "./twitterAuth.config";

export interface TwitterAuthConfig {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export function generateAuthorisationHeader(
  method: string,
  url: string,
  params: {[key: string]: string}
) {
  const authParams: {[key: string]: string} = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  authParams.oauth_signature = generateAuthSignature(method, url, {
    ...params,
    ...authParams,
  });

  return (
    "OAuth " +
    Object.entries(authParams)
      .map(([key, val]) => `${key}="${encodeURIComponent(val)}"`)
      .join(", ")
  );
}

function generateAuthSignature(
  method: string,
  url: string,
  params: {[key: string]: string}
) {
  const paramString = Object.entries(params)
    .map(([key, val]) => [encodeURIComponent(key), encodeURIComponent(val)])
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([key, val]) => `${key}=${val}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(
    config.apiKeySecret
  )}&${encodeURIComponent(config.accessTokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
}

function generateNonce() {
  return crypto.randomBytes(32).toString("base64").replace(/\W/g, "");
}
