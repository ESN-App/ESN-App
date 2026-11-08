const REPO_URL = 'https://github.com/ESN-App/ESN-App';

export interface CommitLink {
  /** Short SHA, or "dev" when the build wasn't deployed from a commit. */
  label: string;
  url: string | null;
}

export interface VersionInfo {
  version?: string | null;
  commit?: string | null;
}

export function commitLink(commit: string | null | undefined): CommitLink {
  const sha = commit?.trim();
  return sha ? { label: sha.slice(0, 7), url: `${REPO_URL}/commit/${sha}` } : { label: 'dev', url: null };
}

/**
 * True when App and API run different releases (one of them is still deploying): compares
 * versions when both report one, otherwise commits; false while either side is unknown.
 */
export function versionsDiffer(app: VersionInfo | null | undefined, api: VersionInfo | null | undefined): boolean {
  const differ = (a: string | null | undefined, b: string | null | undefined) => {
    const x = a?.trim();
    const y = b?.trim();
    return x && y ? x !== y : null;
  };
  return differ(app?.version, api?.version) ?? differ(app?.commit, api?.commit) ?? false;
}
