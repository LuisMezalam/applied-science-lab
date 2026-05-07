export type QueryValue = string | number | boolean | null | undefined;

function getCurrentUrl() {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href);
}

export function readStringParam(key: string) {
  return getCurrentUrl()?.searchParams.get(key) ?? null;
}

export function readEnumParam<T extends string>(
  key: string,
  allowedValues: readonly T[],
  fallback: T,
) {
  const value = readStringParam(key);
  return value && allowedValues.includes(value as T) ? (value as T) : fallback;
}

export function readNumberParam(key: string, fallback: number) {
  const value = readStringParam(key);
  if (value == null || value.trim() === '') return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readBooleanParam(key: string, fallback: boolean) {
  const value = readStringParam(key);
  if (value == null) return fallback;
  return value === '1' || value === 'true';
}

export function writeQueryParams(
  updates: Record<string, QueryValue>,
  mode: 'push' | 'replace' = 'replace',
) {
  const url = getCurrentUrl();
  if (!url) return;

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') {
      url.searchParams.delete(key);
      continue;
    }

    url.searchParams.set(
      key,
      typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
    );
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    return;
  }

  if (mode === 'push') {
    window.history.pushState({}, '', nextUrl);
  } else {
    window.history.replaceState({}, '', nextUrl);
  }
}
