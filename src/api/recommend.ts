// Client for the NetApps recommendation back end (see "NetApps Recommendations Developer Guide").
// One call feeds both Home and Leaderboard. The app only displays what comes back.

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
const TIMEOUT_MS = 20000;

export type SuggestionCategory = 'cashback' | 'referrer' | 'volume';

export interface ApiRecommendation {
  type: string;
  /** Already trimmed; null when the service has no provider. */
  provider: string | null;
}

export interface ApiSuggestion {
  category: SuggestionCategory;
  /** 1 to 20, or null when the user is not in the pool. */
  rank: number | null;
  /** A finished sentence. Show it exactly as it arrives. */
  message: string;
}

export type RecommendResult =
  | { ok: true; recommendations: ApiRecommendation[]; suggestions: ApiSuggestion[] }
  | { ok: false; status: number; error: string };

/** The three staff accounts the demo back end accepts. Any other ID returns a 403. */
export const DEMO_USERS = ['masud', 'edwino', 'chimuamandao'] as const;

export async function getRecommendations(referralId: string): Promise<RecommendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/api/recommend?referralId=${encodeURIComponent(referralId)}`, {
      headers: { 'X-API-Key': API_KEY },
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, status: res.status, error: body?.error ?? 'Request failed' };
    }

    return {
      ok: true,
      recommendations: (body.recommendations ?? []).map((r: { type: string; provider?: string | null }) => ({
        type: r.type,
        provider: r.provider ? r.provider.trim() || null : null,
      })),
      suggestions: body.suggestions ?? [],
    };
  } catch {
    return { ok: false, status: 0, error: 'Could not reach the server' };
  } finally {
    clearTimeout(timer);
  }
}

/** What to show for a failed call, from the guide's status table. */
export function describeFailure(status: number): { title: string; retry: boolean } {
  switch (status) {
    case 400:
      return { title: 'Request error. Referral ID missing.', retry: false };
    case 401:
      return { title: 'Check the API key in your config.', retry: false };
    case 403:
      return { title: 'This user is not part of the demo.', retry: false };
    case 404:
      return { title: 'No recommendations yet.', retry: false };
    default:
      return { title: 'Something went wrong.', retry: true };
  }
}
