import { CHAPTER_ID } from "./constants.js";
import {
  attachCode,
  type CommunityEvent,
  type CommunityEventWithCode,
  fetchEvents,
  resolveEvent,
  shortenEventURL,
  splitEvents,
} from "./event.js";
import type {
  Chapter,
  ChapterSearchOptions,
  DetailedEvent,
  EventFilterOptions,
  EventSearchOptions,
} from "./types.js";
import { parseId } from "./utils.js";

/**
 * BevyClient provides methods to interact with the Bevy API
 * for accessing GDG/GDSC community data
 */
export class BevyClient {
  private baseUrl: string;
  private chapterId: number;
  private headers: HeadersInit;

  /**
   * Creates a new BevyClient instance
   * @param chapterId - The ID of the chapter to interact with, defaults to the configured CHAPTER_ID
   */
  constructor(chapterId: number = CHAPTER_ID) {
    this.baseUrl = "https://gdg.community.dev/api";
    this.chapterId = chapterId;
    this.headers = {
      "User-Agent": "Mozilla/5.0 GDG",
      Accept: "application/json",
    };
  }

  /**
   * Fetches a list of chapter regions available for use in other API calls
   * @returns A Promise resolving to the available chapter regions
   */
  async getChapterRegions(): Promise<any> {
    const url = `${this.baseUrl}/chapter_region`;
    return this.fetchApi(url);
  }

  /**
   * Retrieves events for the configured chapter
   * @param options - Optional filtering and sorting parameters
   * @returns A Promise resolving to the list of events
   */
  async getChapterEvents(
    options: EventFilterOptions = {},
  ): Promise<CommunityEvent[]> {
    const url = new URL(`${this.baseUrl}/chapter/${this.chapterId}/event`);

    // Add query parameters based on options
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "fields" && Array.isArray(value)) {
          url.searchParams.set(key, value.join(","));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    const data = await this.fetchApi(url.toString());
    const events: CommunityEvent[] = data.results || [];
    return events.map(shortenEventURL);
  }

  /**
   * Retrieves a list of events
   * @returns A Promise resolving to the list of events
   */
  async getAllEvents(): Promise<any> {
    const url = `${this.baseUrl}/event/`;
    return this.fetchApi(url);
  }

  /**
   * Retrieves a specific event by ID
   * @param eventId - The ID of the event to retrieve
   * @returns A Promise resolving to the event details
   */
  async getEvent(eventId: number | string): Promise<any> {
    const id = typeof eventId === "string" ? parseId(eventId) : eventId;
    const url = `${this.baseUrl}/event/${id}`;
    return this.fetchApi(url);
  }

  /**
   * Retrieves a specific event by ID with detailed information
   * @param eventId - The ID of the event to retrieve
   * @returns A Promise resolving to the detailed event information
   */
  async getDetailedEvent(eventId: number | string): Promise<DetailedEvent> {
    const id = typeof eventId === "string" ? parseId(eventId) : eventId;
    const url = `${this.baseUrl}/event/${id}`;
    const event: DetailedEvent = await this.fetchApi(url);
    return shortenEventURL(event);
  }

  /**
   * Retrieves a list of available event types
   * @returns A Promise resolving to the list of event types
   */
  async getEventTypes(): Promise<any> {
    const url = `${this.baseUrl}/event_type`;
    return this.fetchApi(url);
  }

  /**
   * Retrieves a list of available event tags
   * @returns A Promise resolving to the list of event tags
   */
  async getEventTags(): Promise<any> {
    const url = `${this.baseUrl}/event/tag`;
    return this.fetchApi(url);
  }

  /**
   * Searches for events matching given parameters
   * @param options - Search parameters
   * @returns A Promise resolving to the search results
   */
  async searchEvents(options: EventSearchOptions = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/search/event`);

    // Add query parameters based on options
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // Handle array parameters like event_types_ids
          value.forEach((val) => {
            url.searchParams.append(key, String(val));
          });
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    return this.fetchApi(url.toString());
  }

  /**
   * Searches for chapters matching given parameters
   * @param options - Search parameters
   * @returns A Promise resolving to the search results
   */
  async searchChapters(options: ChapterSearchOptions = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/search/chapter`);

    // Add query parameters based on options
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    return this.fetchApi(url.toString());
  }

  /**
   * Helper method to search all chapters in Taiwan
   * @returns A Promise resolving to all Taiwan chapters
   */
  async getAllTaiwanChapters(): Promise<Chapter[]> {
    const result = await this.searchChapters({ q: "(TW)" });
    return result.results || [];
  }

  /**
   * Helper method to find nearby chapters
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radius - Search radius in kilometers (default: 200)
   * @returns A Promise resolving to nearby chapters
   */
  async getNearbyChapters(
    latitude: number,
    longitude: number,
    radius: number = 200,
  ): Promise<Chapter[]> {
    const result = await this.searchChapters({
      latitude,
      longitude,
      around_radius: radius,
    });
    return result.results || [];
  }

  /**
   * Helper method to get upcoming events for the configured chapter
   * @param limit - Maximum number of events to return
   * @returns A Promise resolving to upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<CommunityEvent[]> {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    return this.getChapterEvents({
      start_date: today,
      end_date: "9999-12-31",
      order_by: "start_date",
      status: "Published",
      page_size: limit,
    });
  }

  /**
   * Retrieves upcoming events with detailed information
   * @param limit - Maximum number of events to return
   * @returns A Promise resolving to detailed event information
   */
  async getDetailedUpcomingEvents(
    limit: number = 10,
  ): Promise<DetailedEvent[]> {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    const events = await this.getChapterEvents({
      start_date: today,
      end_date: "9999-12-31",
      order_by: "start_date",
      status: "Published",
      page_size: limit,
    });

    // Get detailed information for each event
    const detailedEvents = await Promise.all(
      events.map((event) => this.getDetailedEvent(event.id)),
    );

    return detailedEvents;
  }

  /**
   * Helper method to get past events for the configured chapter
   * @param limit - Maximum number of events to return
   * @returns A Promise resolving to past events
   */
  async getPastEvents(limit: number = 10): Promise<CommunityEvent[]> {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    return this.getChapterEvents({
      start_date: "2000-01-01",
      end_date: today,
      order_by: "-start_date", // Descending order
      status: "Published",
      page_size: limit,
    });
  }

  /**
   * Helper method to find an event by reference (ID, alphabetical code, or date)
   * @param ref - Event reference (ID, alphabetical code, or date in YYYYMMDD format)
   * @returns A Promise resolving to the matching event or null if not found
   */
  async findEvent(ref: string): Promise<CommunityEvent | null> {
    const events = await fetchEvents();
    return resolveEvent(ref, events);
  }

  /**
   * Attaches an alphabetical code to an event for easier reference
   * @param event - The event to attach a code to
   * @returns The event with an attached code
   */
  attachCodeToEvent(event: CommunityEvent): CommunityEventWithCode {
    return attachCode(event);
  }

  /**
   * Splits a list of events into current, upcoming, past, and next categories
   * @param events - The events to split
   * @param upcomingRange - Time window in milliseconds for upcoming events (default: 1 hour)
   * @returns Object containing categorized events
   */
  categorizeEvents<E extends CommunityEvent>(
    events: E[],
    upcomingRange = 60 * 60 * 1000,
  ): {
    current: E | undefined;
    upcoming: E | undefined;
    past: E[];
    next: E[];
  } {
    return splitEvents(events, upcomingRange);
  }

  /**
   * Retrieves event information for a specific tag
   * @param tag - The tag to search for
   * @param limit - Maximum number of events to return
   * @returns A Promise resolving to events with the specified tag
   */
  async getEventsByTag(
    tag: string,
    limit: number = 10,
  ): Promise<DetailedEvent[]> {
    const events = await this.getChapterEvents({
      status: "Published",
      page_size: limit,
    });

    // Get detailed information for each event
    const detailedEvents = await Promise.all(
      events.map((event) => this.getDetailedEvent(event.id)),
    );

    // Filter events by tag
    return detailedEvents.filter(
      (event) =>
        event.tags &&
        event.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
    );
  }

  /**
   * Helper method to get ticket availability for a specific event
   * @param eventId - The ID of the event
   * @returns A Promise resolving to ticket availability information
   */
  async getTicketAvailability(eventId: number | string): Promise<
    Array<{
      ticketType: string;
      available: number;
      total: number;
      isSoldOut: boolean;
      hasWaitlist: boolean;
      waitlistCount: number;
    }>
  > {
    const event = await this.getDetailedEvent(eventId);

    return event.tickets.map((ticket) => ({
      ticketType: ticket.title,
      available: ticket.available,
      total: ticket.total_count,
      isSoldOut: ticket.available === 0,
      hasWaitlist: ticket.waitlist_enabled,
      waitlistCount: ticket.waitlist_count,
    }));
  }

  /**
   * Helper method to make API requests
   * @param url - The URL to fetch
   * @returns A Promise resolving to the API response
   */
  private async fetchApi(url: string): Promise<any> {
    try {
      const res = await fetch(url, { headers: this.headers });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`Error fetching from Bevy API: ${error}`);
      throw error;
    }
  }
}
