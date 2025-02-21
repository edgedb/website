export type LinkRemapping = { from: RegExp; to: string }[];

export function remapLink(uri: string, remapping: LinkRemapping | undefined) {
  if (!remapping) return uri;
  let [pathname, hash] = uri.split("#");
  for (const { from, to } of remapping) {
    pathname = pathname.replace(from, to);
  }
  return pathname + (hash ? `#${hash}` : "");
}
