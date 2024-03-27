export type LinkRemapping = { from: RegExp; to: string }[];

export function remapLink(uri: string, remapping: LinkRemapping | undefined) {
  if (!remapping) return uri;
  for (const { from, to } of remapping) {
    uri = uri.replace(from, to);
  }
  return uri;
}
