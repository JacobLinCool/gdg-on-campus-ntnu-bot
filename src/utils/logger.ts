import debug from "debug";

/** System-level logging for core functionality */
export const logSystem = debug("gdg:system");

/** Command execution and handling logging */
export const logCommand = debug("gdg:command");

/** User interaction logging */
export const logInteraction = debug("gdg:interaction");

/** Classroom management logging */
export const logClassroom = debug("gdg:classroom");

/** Consolidated logger object for convenience */
export default {
  system: logSystem,
  command: logCommand,
  interaction: logInteraction,
  classroom: logClassroom,
};
