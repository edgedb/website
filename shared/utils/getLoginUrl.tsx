export enum Tiers {
  free = "free",
  pro = "pro",
  enterprise = "enterprise",
}

const getLoginUrl = (tier: Tiers.pro | Tiers.free) =>
  `${
    process.env.NEXT_PUBLIC_NEBULA_API
  }/app/auth/web/github?return_to=${encodeURIComponent(
    `${
      process.env.NEXT_PUBLIC_CLOUD_URL
    }/auth/login/done?redirect=${encodeURIComponent(
      `/org/_default/create-instance?tier=${tier}`
    )}`
  )}`;

export default getLoginUrl;
