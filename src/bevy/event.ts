import { EVENT_LIST_URL } from "./constants.js";
import { number2alphabet, parseId } from "./utils.js";

/** Represents a basic event in the community */
export interface CommunityEvent {
  id: number;
  url: string;
  title: string;
  start_date: string;
  end_date: string;
}

/** Extends CommunityEvent with an alphabetical code for easier reference */
export interface CommunityEventWithCode extends CommunityEvent {
  code: string;
}

/** Structure for caching event data */
interface CacheData {
  events: CommunityEvent[];
  timestamp: number;
}

let cache: CacheData | null = null;
let fetchPromise: Promise<CommunityEvent[]> | null = null;

export async function fetchEvents(): Promise<CommunityEvent[]> {
  const now = Date.now();

  // Check if cache is valid (less than 60 seconds old)
  if (cache && now - cache.timestamp < 60_000) {
    return cache.events;
  }

  // If there's an ongoing fetch, return its promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Create a new fetch promise
  fetchPromise = (async () => {
    try {
      const res = await fetch(EVENT_LIST_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 GDG",
          Accept: "application/json",
        },
      });
      const { results } = (await res.json()) as { results: CommunityEvent[] };

      // Update cache
      cache = {
        events: results,
        timestamp: now,
      };

      return results;
    } finally {
      // Clear the fetch promise
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function resolveEvent(
  ref: string,
  events: CommunityEvent[],
): CommunityEvent | null {
  // for id ref like 'abc', '123', etc.
  try {
    const id = parseId(ref);
    const event = events.find((e) => e.id === id);
    if (event) return event;
  } catch {
    // do nothing
  }

  // for ref as date like '20241230' or '2024-12-30'
  const date = ref.match(/\d/g)?.join("");
  if (date) {
    const event = events.find((e) => {
      // parse date to +8 timezone YYYYMMDD with intl
      const start = new Date(e.start_date)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" })
        .replace(/\//g, "")
        .replace(/-/g, "");
      return start === date;
    });
    if (event) return event;
  }

  return null;
}

export function attachCode(event: CommunityEvent): CommunityEventWithCode {
  return {
    ...event,
    code: number2alphabet(event.id),
  };
}

export function shortenEventURL<E extends { id: number; url: string }>(
  event: E,
): E {
  event.url = `https://ntnu.club/${number2alphabet(event.id)}`;
  return event;
}

export function splitEvents<E extends CommunityEvent>(
  events: E[],
  upcomingRange = 60 * 60 * 1000,
): {
  current: E | undefined;
  upcoming: E | undefined;
  past: E[];
  next: E[];
} {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + upcomingRange);

  events.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const currentIdx = events.findIndex((event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return startDate <= now && endDate >= now;
  });
  const current = currentIdx >= 0 ? events[currentIdx] : undefined;

  const upcomingIdx = events.findIndex((event) => {
    const startDate = new Date(event.start_date);
    return startDate > now && startDate < oneHourFromNow;
  });
  const upcoming = upcomingIdx >= 0 ? events[upcomingIdx] : undefined;

  const pastDate = current
    ? new Date(current.start_date)
    : upcoming
      ? new Date(upcoming.start_date)
      : new Date();
  const nextDate = upcoming
    ? new Date(upcoming.start_date)
    : current
      ? new Date(current.start_date)
      : new Date();
  const past = events
    .filter((event) => new Date(event.start_date) < pastDate)
    .reverse();
  const next = events.filter((event) => new Date(event.start_date) > nextDate);

  return { current, upcoming, past, next };
}
