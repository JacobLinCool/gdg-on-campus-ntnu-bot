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
import { parseId } from "./utils.js";

/**
 * Represents a chapter in the Bevy system
 */
export interface Chapter {
  /** Unique identifier for the chapter within Bevy */
  id: number;
  /** The name of the chapter */
  title: string;
  /** Information about the purpose of the chapter */
  description?: string;
  /** The city the chapter is in */
  city?: string;
  /** The state the chapter is in */
  state?: string;
  /** The two-letter abbreviation for the country the chapter is in */
  country?: string;
  /** The full name of the country the chapter is in */
  country_name?: string;
  /** The chapter's time zone */
  timezone?: string;
  /** The full URL of the chapter's website */
  url?: string;
  /** The city, state, province, country of the chapter */
  chapter_location?: string;
  /** Array of all chapter_team records for the chapter */
  chapter_team?: any[];
  /** Whether to hide country information */
  hide_country_info?: boolean;
  /** Logo information for the chapter */
  logo?: CloudinaryImage;
  /** Relative URL path for the chapter */
  relative_url?: string;
}

/**
 * Cloudinary image object used for pictures in the API responses
 */
export interface CloudinaryImage {
  /** The URL to the full image */
  url?: string;
  /** The path to the image on Cloudinary */
  path?: string;
  /** Width of the thumbnail */
  thumbnail_width?: number;
  /** Height of the thumbnail */
  thumbnail_height?: number;
  /** Format of the thumbnail */
  thumbnail_format?: string;
  /** URL to the thumbnail version of the image */
  thumbnail_url?: string;
}

/**
 * Represents a person participating in an event (like a speaker, host, etc.)
 */
export interface EventPerson {
  /** Person ID */
  id: number;
  /** First name of the person */
  first_name: string;
  /** Last name of the person */
  last_name: string;
  /** Company the person belongs to */
  company: string;
  /** Title or role of the person */
  title: string;
  /** Biographical information */
  bio: string;
  /** Profile picture information */
  picture: CloudinaryImage;
  /** Personal Twitter handle */
  personal_twitter: string;
  /** Company Twitter handle */
  company_twitter: string;
  /** LinkedIn profile URL */
  personal_linkedin_page: string | null;
  /** Reference ID within the event context */
  event_person_id: number;
}

/**
 * Represents an event ticket
 */
export interface EventTicket {
  /** Ticket ID */
  id: number;
  /** Event ID this ticket belongs to */
  event: number;
  /** Title of the ticket */
  title: string;
  /** Type of audience this ticket is for */
  audience_type: string;
  /** Description of the ticket */
  description: string;
  /** Optional access code for restricted tickets */
  access_code: string | null;
  /** Whether the ticket is visible */
  visible: boolean;
  /** Price of the ticket */
  price: number;
  /** Number of tickets available */
  available: number;
  /** Total count of this ticket type */
  total_count: number;
  /** When the tickets go on sale */
  sale_start_date: string;
  /** Sale start date in naive format */
  sale_start_date_naive: string;
  /** Whether the sale start date is derived from event publish date */
  sale_start_date_derived_from_event_publish: boolean;
  /** When the ticket sales end */
  sale_end_date: string;
  /** Sale end date in naive format */
  sale_end_date_naive: string;
  /** Whether the sale end date is derived from event end date */
  sale_end_date_derived_from_event_end: boolean;
  /** Minimum number of tickets per order */
  min_per_order: number;
  /** Maximum number of tickets per order */
  max_per_order: number;
  /** Whether the ticket is currently for sale */
  is_for_sale: boolean;
  /** Whether the ticket can be deleted */
  can_delete: boolean;
  /** Currency for ticket price */
  currency: string;
  /** Whether waitlist is enabled */
  waitlist_enabled: boolean;
  /** Number of people on waitlist */
  waitlist_count: number;
  /** Number of attendees with this ticket */
  attendee_count: number;
  /** Discount code if applicable */
  discount_code: string;
  /** Reported price (may differ from price) */
  reported_price: number;
  /** Reported fees */
  reported_fees: number;
  /** Reported original price */
  reported_original_price: number;
}

/**
 * Represents the lobby information for an event
 */
export interface EventLobby {
  /** Event ID */
  event: number;
  /** External video URL */
  external_video_url: string;
  /** Banner image */
  banner: CloudinaryImage;
  /** Message for the event lobby */
  message: string;
  /** MUX upload information */
  mux_upload: any | null;
  /** Video URL */
  video_url: string;
  /** Video type */
  video_type: string;
}

/**
 * Represents agenda information for an event
 */
export interface EventAgenda {
  /** Whether the event spans multiple days */
  multiday: boolean;
  /** Whether any agenda items have descriptions */
  any_descriptions: boolean;
  /** Whether the agenda is empty */
  empty: boolean;
  /** Days of the agenda */
  days: {
    title: string;
    agenda: any[];
  }[];
}

/**
 * Detailed Event interface representing a comprehensive event object from the Bevy API
 */
export interface DetailedEvent {
  /** Unique identifier for the event */
  id: number;
  /** Title of the event */
  title: string;
  /** Type of audience (IN_PERSON, VIRTUAL, etc.) */
  audience_type: string;
  /** Primary speaker information */
  speaker: string | null;
  /** Speaker's Twitter handle */
  speaker_twitter: string | null;
  /** Company organizing or sponsoring the event */
  company: string | null;
  /** Company's Twitter handle */
  company_twitter: string | null;
  /** Short description of the event */
  description_short: string;
  /** Whether to show short description on event banner */
  show_short_description_on_event_banner: boolean;
  /** Full HTML description of the event */
  description: string;
  /** Event picture/banner */
  picture: CloudinaryImage;
  /** Tickets available for the event */
  tickets: EventTicket[];
  /** Whether discount codes can be used */
  discount_code_usable: {
    value: boolean;
    detail: string;
  };
  /** Chapter hosting the event */
  chapter: Chapter;
  /** Start date and time of the event (ISO format) */
  start_date: string;
  /** Start date in naive format */
  start_date_naive: string;
  /** End date and time of the event (ISO format) */
  end_date: string;
  /** End date in naive format */
  end_date_naive: string;
  /** Start date in ISO format */
  start_date_iso: string;
  /** End date in ISO format */
  end_date_iso: string;
  /** Whether internal payment is supported */
  internal_payment_support: boolean;
  /** Payment client tokens */
  payment_client_tokens: Record<string, any>;
  /** Payment methods available */
  payment_methods: any[];
  /** Payment processor slug */
  payment_processor_slug: string;
  /** Featured attendees */
  featured_attendees: any[];
  /** Media partners */
  media_partners: any[];
  /** Sponsors */
  sponsors: any[];
  /** Partners list */
  partners_list: any[];
  /** Whether registration is required */
  registration_required: boolean;
  /** URL to the event page */
  url: string;
  /** Static URL for the event */
  static_url: string;
  /** Short ID for the event */
  short_id: string;
  /** Relative URL path */
  relative_url: string;
  /** Status of the event (Draft, Published, Live, etc.) */
  status: string;
  /** URL to video recording */
  video_url: string | null;
  /** URL to slideshare */
  slideshare_url: string | null;
  /** Photos from the event */
  event_wrapup_photos: any[];
  /** Meetup URL if applicable */
  meetup_url: string | null;
  /** Meetup group name */
  meetup_group: string | null;
  /** Whether Meetup could be updated */
  could_update_meetup: boolean;
  /** Eventbrite URL if applicable */
  eventbrite_url: string | null;
  /** Whether the event is completed */
  completed: boolean;
  /** Whether to show map */
  show_map: boolean;
  /** Venue name */
  venue_name: string;
  /** Venue address */
  venue_address: string;
  /** Venue city */
  venue_city: string;
  /** Venue zip code */
  venue_zip_code: string;
  /** Agenda information */
  agenda: EventAgenda;
  /** Maximum capacity for network segment */
  network_segment_max_capacity: number;
  /** Currency */
  currency: string;
  /** Whether external ticketing is used */
  use_external_ticketing: boolean;
  /** Whether to show featured attendees */
  use_featured_attendees: boolean;
  /** Total capacity of the venue */
  total_capacity: number | null;
  /** Total number of attendees */
  total_attendees: number;
  /** Event type ID */
  event_type: number;
  /** Event type slug */
  event_type_slug: string;
  /** Event type title */
  event_type_title: string;
  /** Event type logo */
  event_type_logo: CloudinaryImage;
  /** Event type banner */
  event_type_banner: CloudinaryImage;
  /** Whether event type is RSVP only */
  event_type_rsvp_only: boolean;
  /** Whether event type allows new agenda */
  event_type_allow_new_agenda: boolean;
  /** Recurring event information */
  recurring_event: any | null;
  /** Companies involved */
  companies: any[];
  /** Banner information */
  banner: CloudinaryImage;
  /** Vertical crop position for banner */
  banner_crop_vertical: number;
  /** Whether to hide agenda on event page */
  hide_agenda_on_event_page: boolean;
  /** Whether the event is hidden */
  is_hidden: boolean;
  /** Whether the event is a test */
  is_test: boolean;
  /** Whether to allow automated emails when hidden */
  allow_automated_emails_when_hidden: boolean;
  /** Facebook pixel ID */
  facebook_pixel: string;
  /** LinkedIn purchase conversion ID */
  linkedin_purchase_conversion_id: string | null;
  /** Whether visible on parent chapter only */
  visible_on_parent_chapter_only: boolean;
  /** Whether sharing is disabled */
  sharing_disabled: boolean;
  /** Whether the event is virtual */
  is_virtual_event: boolean;
  /** Event tags */
  tags: string[];
  /** Event timezone */
  event_timezone: string;
  /** Timezone abbreviation */
  timezone_abbreviation: string;
  /** Internal timezone field */
  _timezone: string;
  /** Lobby information */
  lobby: EventLobby;
  /** Mobile relative event type */
  mobile_relative_event_type: string;
  /** Whether to hide location */
  hide_location: boolean;
  /** URL to cropped banner */
  cropped_banner_url: string;
  /** Whether co-hosting is allowed */
  allows_cohosting: boolean;
  /** Co-host registration URL */
  cohost_registration_url: string;
  /** Event slug */
  slug: string;
  /** Event facilitators */
  facilitators: any[];
  /** Event hosts */
  hosts: any[];
  /** Event judges */
  judges: any[];
  /** Event mentors */
  mentors: any[];
  /** Event moderators */
  moderators: any[];
  /** Event panelists */
  panelists: any[];
  /** Event speakers */
  speakers: EventPerson[];
}

/**
 * Event filtering options for fetching events
 */
export interface EventFilterOptions {
  /** Filters the list to only include events after the specified date (YYYY-MM-DD) */
  start_date?: string;
  /** Filters the list to only include events before the specified date (YYYY-MM-DD) */
  end_date?: string;
  /**
   * Sorts results by the specified value
   * Options: id, title, start_date, end_date
   * Prefix value with "-" to specify descending order
   */
  order_by?: string;
  /**
   * Filters the list of events based on the specified status
   * Options: Draft, Pending, Published, Live, Canceled
   */
  status?: "Draft" | "Pending" | "Published" | "Live" | "Canceled";
  /** Filters the list to only include events of the event type with the specified ID */
  event_type_id?: number;
  /** Specify the maximum number of results to include (1-500) */
  page_size?: number;
  /**
   * Allows specifying what fields to return for each event
   * Can be any of the fields listed in the event details endpoint
   */
  fields?: string[];
}

/**
 * Search options for chapters
 */
export interface ChapterSearchOptions {
  /** Indicates the possible distance for results to be included in the search (1-20000) */
  around_radius?: number;
  /** Latitude of location (-90 to +90) */
  latitude?: number;
  /** Longitude of location (-180 to +180) */
  longitude?: number;
  /** Query string for searching */
  q?: string;
}

/**
 * Search options for events
 */
export interface EventSearchOptions {
  /**
   * Filter by event status
   * Options: past, live, upcoming, upcoming_only
   */
  status?: "past" | "live" | "upcoming" | "upcoming_only";
  /** Indicates the possible distance for results to be included in the search (1-20000) */
  around_radius?: number;
  /** Latitude of location (-90 to +90) */
  latitude?: number;
  /** Longitude of location (-180 to +180) */
  longitude?: number;
  /** Query string for searching */
  q?: string;
  /** Chapter to filter events by */
  chapter_id?: number;
  /** Region to filter events by */
  region_id?: number;
  /** Event type IDs to filter events by */
  event_types_ids?: number[];
  /** Event tag IDs to filter events by */
  event_tags_ids?: number[];
  /** Filter events by BVC/BV/in-person */
  mobile_relative_event_type?: string;
}

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

export {
  attachCode,
  CommunityEvent,
  CommunityEventWithCode,
  fetchEvents,
  resolveEvent,
  splitEvents,
};

export default new BevyClient();
