export function saveSearchQuery(key: string, query: string): void {
  sessionStorage.setItem(`search-${key}`, query);
}

export function restoreSearchQuery(key: string): string {
  return sessionStorage.getItem(`search-${key}`) ?? '';
}
