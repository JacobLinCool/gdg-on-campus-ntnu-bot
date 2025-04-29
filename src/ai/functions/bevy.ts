import { Type } from "@google/genai";
import ExpiryMap from "expiry-map";
import pMemoize from "p-memoize";
import { default as bevyClient } from "../../bevy/index.js";
import type { EventFilterOptions } from "../../bevy/types.js";
import { CallableFunction } from "../agent.js";

export const getChapterEventsFunction = {
  name: "get_chapter_events",
  description: `Gets a list of events for the configured GDG chapter, allowing filtering and sorting.
Returns an array of CommunityEvent objects.
Structure of a CommunityEvent object:
{
  id: number; // Unique identifier for the event
  title: string; // Title of the event
  start_date: string; // Start date and time (ISO format)
  end_date: string; // End date and time (ISO format)
  url: string; // URL to the event page
  status: string; // Status (e.g., "Published", "Live", "Canceled")
  audience_type: string; // Type (e.g., "IN_PERSON", "VIRTUAL")
  // Other fields might be present
}

Example Usage:
- Get the next 5 upcoming published events: { "status": "Published", "order_by": "start_date", "page_size": 5, "start_date": "YYYY-MM-DD" } (replace YYYY-MM-DD with today's date)
- Get the last 3 past published events: { "status": "Published", "order_by": "-start_date", "page_size": 3, "end_date": "YYYY-MM-DD" } (replace YYYY-MM-DD with today's date)
- Get all published events between two dates: { "status": "Published", "start_date": "2024-01-01", "end_date": "2024-12-31" }`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      start_date: {
        type: Type.STRING,
        description:
          "Filters the list to only include events starting on or after the specified date (YYYY-MM-DD).",
      },
      end_date: {
        type: Type.STRING,
        description:
          "Filters the list to only include events ending on or before the specified date (YYYY-MM-DD).",
      },
      order_by: {
        type: Type.STRING,
        description:
          'Sorts results by the specified value (e.g., "start_date", "end_date", "title"). Prefix with "-" for descending order (e.g., "-start_date"). Common options: "start_date", "-start_date".',
      },
      status: {
        type: Type.STRING,
        description:
          'Filters the list of events based on the specified status (e.g., "Published", "Live", "Canceled").',
        enum: ["Published", "Live", "Canceled"],
      },
      page_size: {
        type: Type.NUMBER,
        description:
          "Specify the maximum number of results to include (1-500).",
      },
    },
    required: ["start_date", "end_date", "order_by", "status", "page_size"],
  },
  call: pMemoize(
    async (args?: Record<string, unknown>) => {
      // Construct options object safely, ensuring correct types
      const options: EventFilterOptions = {};
      if (args) {
        if (typeof args.start_date === "string")
          options.start_date = args.start_date;
        if (typeof args.end_date === "string") options.end_date = args.end_date;
        if (typeof args.order_by === "string") options.order_by = args.order_by;
        if (
          typeof args.status === "string" &&
          ["Draft", "Pending", "Published", "Live", "Canceled"].includes(
            args.status,
          )
        ) {
          options.status = args.status as EventFilterOptions["status"];
        }
        if (typeof args.page_size === "number")
          options.page_size = Math.max(1, Math.min(500, args.page_size));
      }

      // Set default page_size if not provided or invalid
      if (!options.page_size) {
        options.page_size = 10; // Default to 10 events
      }

      // Add default date range and sorting if none provided, to avoid fetching everything
      // and provide sensible defaults (upcoming events)
      if (
        !options.start_date &&
        !options.end_date &&
        !options.order_by &&
        !options.status
      ) {
        const now = new Date();
        options.start_date = now.toISOString().split("T")[0]; // Default to upcoming events from today
        options.order_by = "start_date"; // Default sort for upcoming
        options.status = "Published"; // Default to published events
      } else if (!options.order_by) {
        // Default sort order based on dates provided if order_by is missing
        options.order_by =
          options.end_date && !options.start_date
            ? "-start_date"
            : "start_date";
      }

      try {
        // Use getChapterEvents which accepts EventFilterOptions
        return await bevyClient.getChapterEvents(options);
      } catch (error: any) {
        console.error("Error calling get_chapter_events:", error);
        return { error: `Failed to fetch chapter events: ${error.message}` };
      }
    },
    { cache: new ExpiryMap(1000 * 60) }, // Cache for 1 minute
  ),
};

export const getEventDetailsFunction = {
  name: "get_event_details",
  description: `Gets detailed information about a specific event, including description, location, speakers, tickets, status, and more.
Returns a DetailedEvent object.
Structure of a DetailedEvent object:
{
  id: number; // Unique identifier for the event
  title: string; // Title of the event
  description_short: string; // Short description
  description: string; // Full HTML description
  start_date: string; // Start date and time (ISO format)
  end_date: string; // End date and time (ISO format)
  url: string; // URL to the event page
  status: string; // Status (e.g., "Published", "Live", "Canceled")
  audience_type: string; // Type (e.g., "IN_PERSON", "VIRTUAL")
  chapter: { id: number; title: string; ... }; // Hosting chapter details
  picture: { url: string; ... }; // Event banner/image
  venue_name: string; // Venue name (if applicable)
  venue_address: string; // Venue address (if applicable)
  speakers: Array<{ id: number; first_name: string; last_name: string; company: string; title: string; bio: string; picture: { url: string; ... }; ... }>; // List of speakers
  tickets: Array<{ id: number; title: string; price: number; available: number; total_count: number; is_for_sale: boolean; waitlist_enabled: boolean; ... }>; // List of tickets
  tags: string[]; // List of event tags
  // ... and many other fields
}`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: {
        type: Type.STRING,
        description: "number ID of the event to get details for",
      },
    },
    required: ["eventId"],
  },
  call: pMemoize(
    async (args?: Record<string, unknown>) => {
      if (
        !args ||
        typeof args !== "object" ||
        !("eventId" in args) ||
        !args.eventId
      ) {
        return { error: "Missing required parameter: eventId" };
      }
      try {
        const eventId = String(args.eventId);
        return await bevyClient.getDetailedEvent(eventId);
      } catch (error) {
        return { error: "Event not found" };
      }
    },
    { cache: new ExpiryMap(1000 * 60) },
  ),
};

export const bevyFunctions: CallableFunction[] = [
  getChapterEventsFunction,
  getEventDetailsFunction,
];
