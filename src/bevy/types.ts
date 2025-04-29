import { z } from "zod";

/**
 * Represents a chapter in the Bevy system
 */
export const ChapterSchema = z
  .object({
    /** Unique identifier for the chapter within Bevy */
    id: z.number(),
    /** The name of the chapter */
    title: z.string(),
    /** Information about the purpose of the chapter */
    description: z.string().optional(),
    /** The city the chapter is in */
    city: z.string().optional(),
    /** The state the chapter is in */
    state: z.string().optional(),
    /** The two-letter abbreviation for the country the chapter is in */
    country: z.string().optional(),
    /** The full name of the country the chapter is in */
    country_name: z.string().optional(),
    /** The chapter's time zone */
    timezone: z.string().optional(),
    /** The full URL of the chapter's website */
    url: z.string().optional(),
    /** The city, state, province, country of the chapter */
    chapter_location: z.string().optional(),
    /** Array of all chapter_team records for the chapter */
    chapter_team: z.array(z.any()).optional(),
    /** Whether to hide country information */
    hide_country_info: z.boolean().optional(),
    /** Logo information for the chapter */
    logo: z.lazy(() => CloudinaryImageSchema).optional(),
    /** Relative URL path for the chapter */
    relative_url: z.string().optional(),
  })
  .passthrough();
export type Chapter = z.infer<typeof ChapterSchema>;

/**
 * Cloudinary image object used for pictures in the API responses
 */
export const CloudinaryImageSchema = z
  .object({
    /** The URL to the full image */
    url: z.string().optional(),
    /** The path to the image on Cloudinary */
    path: z.string().optional(),
    /** Width of the thumbnail */
    thumbnail_width: z.number().optional(),
    /** Height of the thumbnail */
    thumbnail_height: z.number().optional(),
    /** Format of the thumbnail */
    thumbnail_format: z.string().optional(),
    /** URL to the thumbnail version of the image */
    thumbnail_url: z.string().optional(),
  })
  .passthrough();
export type CloudinaryImage = z.infer<typeof CloudinaryImageSchema>;

/**
 * Represents a person participating in an event (like a speaker, host, etc.)
 */
export const EventPersonSchema = z
  .object({
    /** Person ID */
    id: z.number(),
    /** First name of the person */
    first_name: z.string(),
    /** Last name of the person */
    last_name: z.string(),
    /** Company the person belongs to */
    company: z.string(),
    /** Title or role of the person */
    title: z.string(),
    /** Biographical information */
    bio: z.string(),
    /** Profile picture information */
    picture: CloudinaryImageSchema,
    /** Personal Twitter handle */
    personal_twitter: z.string(),
    /** Company Twitter handle */
    company_twitter: z.string(),
    /** LinkedIn profile URL */
    personal_linkedin_page: z.string().nullable(),
    /** Reference ID within the event context */
    event_person_id: z.number(),
  })
  .passthrough();
export type EventPerson = z.infer<typeof EventPersonSchema>;

/**
 * Represents an event ticket
 */
export const EventTicketSchema = z
  .object({
    /** Ticket ID */
    id: z.number(),
    /** Event ID this ticket belongs to */
    event: z.number(),
    /** Title of the ticket */
    title: z.string(),
    /** Type of audience this ticket is for */
    audience_type: z.string(),
    /** Description of the ticket */
    description: z.string(),
    /** Optional access code for restricted tickets */
    access_code: z.string().nullable(),
    /** Whether the ticket is visible */
    visible: z.boolean(),
    /** Price of the ticket */
    price: z.number(),
    /** Number of tickets available */
    available: z.number(),
    /** Total count of this ticket type */
    total_count: z.number(),
    /** When the tickets go on sale */
    sale_start_date: z.string(),
    /** Sale start date in naive format */
    sale_start_date_naive: z.string(),
    /** Whether the sale start date is derived from event publish date */
    sale_start_date_derived_from_event_publish: z.boolean(),
    /** When the ticket sales end */
    sale_end_date: z.string(),
    /** Sale end date in naive format */
    sale_end_date_naive: z.string(),
    /** Whether the sale end date is derived from event end date */
    sale_end_date_derived_from_event_end: z.boolean(),
    /** Minimum number of tickets per order */
    min_per_order: z.number(),
    /** Maximum number of tickets per order */
    max_per_order: z.number(),
    /** Whether the ticket is currently for sale */
    is_for_sale: z.boolean(),
    /** Whether the ticket can be deleted */
    can_delete: z.boolean(),
    /** Currency for ticket price */
    currency: z.string(),
    /** Whether waitlist is enabled */
    waitlist_enabled: z.boolean(),
    /** Number of people on waitlist */
    waitlist_count: z.number(),
    /** Number of attendees with this ticket */
    attendee_count: z.number(),
    /** Discount code if applicable */
    discount_code: z.string(),
    /** Reported price (may differ from price) */
    reported_price: z.number(),
    /** Reported fees */
    reported_fees: z.number(),
    /** Reported original price */
    reported_original_price: z.number(),
  })
  .passthrough();
export type EventTicket = z.infer<typeof EventTicketSchema>;

/**
 * Represents the lobby information for an event
 */
export const EventLobbySchema = z
  .object({
    /** Event ID */
    event: z.number(),
    /** External video URL */
    external_video_url: z.string(),
    /** Banner image */
    banner: CloudinaryImageSchema,
    /** Message for the event lobby */
    message: z.string(),
    /** MUX upload information */
    mux_upload: z.any().nullable(),
    /** Video URL */
    video_url: z.string(),
    /** Video type */
    video_type: z.string(),
  })
  .passthrough();
export type EventLobby = z.infer<typeof EventLobbySchema>;

/**
 * Represents agenda information for an event
 */
export const EventAgendaSchema = z
  .object({
    /** Whether the event spans multiple days */
    multiday: z.boolean(),
    /** Whether any agenda items have descriptions */
    any_descriptions: z.boolean(),
    /** Whether the agenda is empty */
    empty: z.boolean(),
    /** Days of the agenda */
    days: z.array(
      z.object({
        title: z.string(),
        agenda: z.array(z.any()),
      }),
    ),
  })
  .passthrough();
export type EventAgenda = z.infer<typeof EventAgendaSchema>;

/**
 * Detailed Event interface representing a comprehensive event object from the Bevy API
 */
export const DetailedEventSchema = z
  .object({
    /** Unique identifier for the event */
    id: z.number(),
    /** Title of the event */
    title: z.string(),
    /** Type of audience (IN_PERSON, VIRTUAL, etc.) */
    audience_type: z.string(),
    /** Primary speaker information */
    speaker: z.string().nullable(),
    /** Speaker's Twitter handle */
    speaker_twitter: z.string().nullable(),
    /** Company organizing or sponsoring the event */
    company: z.string().nullable(),
    /** Company's Twitter handle */
    company_twitter: z.string().nullable(),
    /** Short description of the event */
    description_short: z.string(),
    /** Whether to show short description on event banner */
    show_short_description_on_event_banner: z.boolean(),
    /** Full HTML description of the event */
    description: z.string(),
    /** Event picture/banner */
    picture: CloudinaryImageSchema,
    /** Tickets available for the event */
    tickets: z.array(EventTicketSchema),
    /** Whether discount codes can be used */
    discount_code_usable: z.object({
      value: z.boolean(),
      detail: z.string(),
    }),
    /** Chapter hosting the event */
    chapter: ChapterSchema,
    /** Start date and time of the event (ISO format) */
    start_date: z.string(),
    /** Start date in naive format */
    start_date_naive: z.string(),
    /** End date and time of the event (ISO format) */
    end_date: z.string(),
    /** End date in naive format */
    end_date_naive: z.string(),
    /** Start date in ISO format */
    start_date_iso: z.string(),
    /** End date in ISO format */
    end_date_iso: z.string(),
    /** Whether internal payment is supported */
    internal_payment_support: z.boolean(),
    /** Payment client tokens */
    payment_client_tokens: z.record(z.any()),
    /** Payment methods available */
    payment_methods: z.array(z.any()),
    /** Payment processor slug */
    payment_processor_slug: z.string(),
    /** Featured attendees */
    featured_attendees: z.array(z.any()),
    /** Media partners */
    media_partners: z.array(z.any()),
    /** Sponsors */
    sponsors: z.array(z.any()),
    /** Partners list */
    partners_list: z.array(z.any()),
    /** Whether registration is required */
    registration_required: z.boolean(),
    /** URL to the event page */
    url: z.string(),
    /** Static URL for the event */
    static_url: z.string(),
    /** Short ID for the event */
    short_id: z.string(),
    /** Relative URL path */
    relative_url: z.string(),
    /** Status of the event (Draft, Published, Live, etc.) */
    status: z.string(),
    /** URL to video recording */
    video_url: z.string().nullable(),
    /** URL to slideshare */
    slideshare_url: z.string().nullable(),
    /** Photos from the event */
    event_wrapup_photos: z.array(z.any()),
    /** Meetup URL if applicable */
    meetup_url: z.string().nullable(),
    /** Meetup group name */
    meetup_group: z.string().nullable(),
    /** Whether Meetup could be updated */
    could_update_meetup: z.boolean(),
    /** Eventbrite URL if applicable */
    eventbrite_url: z.string().nullable(),
    /** Whether the event is completed */
    completed: z.boolean(),
    /** Whether to show map */
    show_map: z.boolean(),
    /** Venue name */
    venue_name: z.string(),
    /** Venue address */
    venue_address: z.string(),
    /** Venue city */
    venue_city: z.string(),
    /** Venue zip code */
    venue_zip_code: z.string(),
    /** Agenda information */
    agenda: EventAgendaSchema,
    /** Maximum capacity for network segment */
    network_segment_max_capacity: z.number(),
    /** Currency */
    currency: z.string(),
    /** Whether external ticketing is used */
    use_external_ticketing: z.boolean(),
    /** Whether to show featured attendees */
    use_featured_attendees: z.boolean(),
    /** Total capacity of the venue */
    total_capacity: z.number().nullable(),
    /** Total number of attendees */
    total_attendees: z.number(),
    /** Event type ID */
    event_type: z.number(),
    /** Event type slug */
    event_type_slug: z.string(),
    /** Event type title */
    event_type_title: z.string(),
    /** Event type logo */
    event_type_logo: CloudinaryImageSchema,
    /** Event type banner */
    event_type_banner: CloudinaryImageSchema,
    /** Whether event type is RSVP only */
    event_type_rsvp_only: z.boolean(),
    /** Whether event type allows new agenda */
    event_type_allow_new_agenda: z.boolean(),
    /** Recurring event information */
    recurring_event: z.any().nullable(),
    /** Companies involved */
    companies: z.array(z.any()),
    /** Banner information */
    banner: CloudinaryImageSchema,
    /** Vertical crop position for banner */
    banner_crop_vertical: z.number(),
    /** Whether to hide agenda on event page */
    hide_agenda_on_event_page: z.boolean(),
    /** Whether the event is hidden */
    is_hidden: z.boolean(),
    /** Whether the event is a test */
    is_test: z.boolean(),
    /** Whether to allow automated emails when hidden */
    allow_automated_emails_when_hidden: z.boolean(),
    /** Facebook pixel ID */
    facebook_pixel: z.string(),
    /** LinkedIn purchase conversion ID */
    linkedin_purchase_conversion_id: z.string().nullable(),
    /** Whether visible on parent chapter only */
    visible_on_parent_chapter_only: z.boolean(),
    /** Whether sharing is disabled */
    sharing_disabled: z.boolean(),
    /** Whether the event is virtual */
    is_virtual_event: z.boolean(),
    /** Event tags */
    tags: z.array(z.string()),
    /** Event timezone */
    event_timezone: z.string(),
    /** Timezone abbreviation */
    timezone_abbreviation: z.string(),
    /** Internal timezone field */
    _timezone: z.string(),
    /** Lobby information */
    lobby: EventLobbySchema,
    /** Mobile relative event type */
    mobile_relative_event_type: z.string(),
    /** Whether to hide location */
    hide_location: z.boolean(),
    /** URL to cropped banner */
    cropped_banner_url: z.string(),
    /** Whether co-hosting is allowed */
    allows_cohosting: z.boolean(),
    /** Co-host registration URL */
    cohost_registration_url: z.string(),
    /** Event slug */
    slug: z.string(),
    /** Event facilitators */
    facilitators: z.array(z.any()),
    /** Event hosts */
    hosts: z.array(z.any()),
    /** Event judges */
    judges: z.array(z.any()),
    /** Event mentors */
    mentors: z.array(z.any()),
    /** Event moderators */
    moderators: z.array(z.any()),
    /** Event panelists */
    panelists: z.array(z.any()),
    /** Event speakers */
    speakers: z.array(EventPersonSchema),
  })
  .passthrough();
export type DetailedEvent = z.infer<typeof DetailedEventSchema>;

/**
 * Event filtering options for fetching events
 */
export const EventFilterOptionsSchema = z
  .object({
    /** Filters the list to only include events after the specified date (YYYY-MM-DD) */
    start_date: z.string().optional(),
    /** Filters the list to only include events before the specified date (YYYY-MM-DD) */
    end_date: z.string().optional(),
    /**
     * Sorts results by the specified value
     * Options: id, title, start_date, end_date
     * Prefix value with "-" to specify descending order
     */
    order_by: z.string().optional(),
    /**
     * Filters the list of events based on the specified status
     * Options: Draft, Pending, Published, Live, Canceled
     */
    status: z
      .enum(["Draft", "Pending", "Published", "Live", "Canceled"])
      .optional(),
    /** Filters the list to only include events of the event type with the specified ID */
    event_type_id: z.number().optional(),
    /** Specify the maximum number of results to include (1-500) */
    page_size: z.number().optional(),
    /**
     * Allows specifying what fields to return for each event
     * Can be any of the fields listed in the event details endpoint
     */
    fields: z.array(z.string()).optional(),
  })
  .passthrough();
export type EventFilterOptions = z.infer<typeof EventFilterOptionsSchema>;

/**
 * Search options for chapters
 */
export const ChapterSearchOptionsSchema = z
  .object({
    /** Indicates the possible distance for results to be included in the search (1-20000) */
    around_radius: z.number().optional(),
    /** Latitude of location (-90 to +90) */
    latitude: z.number().optional(),
    /** Longitude of location (-180 to +180) */
    longitude: z.number().optional(),
    /** Query string for searching */
    q: z.string().optional(),
  })
  .passthrough();
export type ChapterSearchOptions = z.infer<typeof ChapterSearchOptionsSchema>;

/**
 * Search options for events
 */
export const EventSearchOptionsSchema = z
  .object({
    /**
     * Filter by event status
     * Options: past, live, upcoming, upcoming_only
     */
    status: z.enum(["past", "live", "upcoming", "upcoming_only"]).optional(),
    /** Indicates the possible distance for results to be included in the search (1-20000) */
    around_radius: z.number().optional(),
    /** Latitude of location (-90 to +90) */
    latitude: z.number().optional(),
    /** Longitude of location (-180 to +180) */
    longitude: z.number().optional(),
    /** Query string for searching */
    q: z.string().optional(),
    /** Chapter to filter events by */
    chapter_id: z.number().optional(),
    /** Region to filter events by */
    region_id: z.number().optional(),
    /** Event type IDs to filter events by */
    event_types_ids: z.array(z.number()).optional(),
    /** Event tag IDs to filter events by */
    event_tags_ids: z.array(z.number()).optional(),
    /** Filter events by BVC/BV/in-person */
    mobile_relative_event_type: z.string().optional(),
  })
  .passthrough();
export type EventSearchOptions = z.infer<typeof EventSearchOptionsSchema>;
