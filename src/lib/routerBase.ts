export function getRouterBasename(baseUrl: string | undefined) {
  if (!baseUrl || baseUrl === "/") return undefined;
  return baseUrl.replace(/\/$/, "");
}
