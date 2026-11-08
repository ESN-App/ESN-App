const REPO_URL = 'https://github.com/ESN-App/ESN-App';

export interface CommitLink {
  /** Short SHA, or "dev" when the build wasn't deployed from a commit. */
  label: string;
  url: string | null;
}

export function commitLink(commit: string | null | undefined): CommitLink {
  const sha = commit?.trim();
  return sha ? { label: sha.slice(0, 7), url: `${REPO_URL}/commit/${sha}` } : { label: 'dev', url: null };
}

/** True only when both sides report a commit and they differ (one of them is still deploying). */
export function versionsDiffer(app: string | null | undefined, api: string | null | undefined): boolean {
  const a = app?.trim();
  const b = api?.trim();
  return !!a && !!b && a !== b;
}
