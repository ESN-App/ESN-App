/** Host name of a URL without "www.", e.g. "ztm.gda.pl"; falls back to the raw value. */
export function urlHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
