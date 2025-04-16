import { Type } from "@google/genai";
import ExpiryMap from "expiry-map";
import pMemoize from "p-memoize";
import { default as bevyClient } from "../../bevy/index.js";
import { CallableFunction } from "../agent.js";

export const getUpcomingEventsFunction = {
  name: "get_upcoming_events",
  description: "Gets a list of upcoming events for the GDG community.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Maximum number of events to return",
      },
    },
    required: [],
  },
  call: pMemoize(
    async (args?: Record<string, unknown>) => {
      const limit =
        args && typeof args === "object" && "limit" in args
          ? Number(args.limit) || 5
          : 5;
      return await bevyClient.getUpcomingEvents(limit);
    },
    { cache: new ExpiryMap(1000 * 60) },
  ),
};

export const getPastEventsFunction = {
  name: "get_past_events",
  description: "Gets a list of past events for the GDG community.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Maximum number of events to return",
      },
    },
    required: [],
  },
  call: pMemoize(
    async (args?: Record<string, unknown>) => {
      const limit =
        args && typeof args === "object" && "limit" in args
          ? Number(args.limit) || 5
          : 5;
      return await bevyClient.getPastEvents(limit);
    },
    { cache: new ExpiryMap(1000 * 60) },
  ),
};

export const getEventDetailsFunction = {
  name: "get_event_details",
  description:
    "Gets detailed information (description, location, speaker information, ticket status, etc.) about a specific event.",
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
  getUpcomingEventsFunction,
  getPastEventsFunction,
  getEventDetailsFunction,
];
