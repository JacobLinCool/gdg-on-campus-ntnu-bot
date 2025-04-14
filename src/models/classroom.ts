import { Collection } from "discord.js";
import { EventEmitter } from "eventemitter3";
import logger from "../utils/logger.js";

/**
 * Student information within a classroom
 * Tracks individual student data including group assignment and lab completion
 */
export interface Student {
  id: string; // Discord user ID
  name: string;
  group?: number; // Group assignment (optional)
  completedLabs: Set<string>; // Set of lab IDs that the student has completed
}

/**
 * Lab session information
 * Represents an active lab session within a classroom
 */
export interface LabSession {
  id: string; // Unique identifier for the lab session
  name: string; // Display name of the lab
  startTime: Date; // When the lab session began
  threadId: string; // The Discord thread where this lab is running
}

/**
 * Event types emitted by the Classroom class
 * These events are used for real-time updates of classroom state
 */
export type ClassroomEventTypes =
  | "student-added"
  | "student-group-changed"
  | "lab-started"
  | "lab-completed";

/**
 * Classroom state management class
 *
 * Manages all aspects of a classroom including:
 * - Student enrollment and group assignment
 * - Lab session tracking
 * - Lab completion status
 *
 * Extends EventEmitter to provide real-time updates via events
 */
export class Classroom extends EventEmitter {
  public id: string; // Thread ID that represents this classroom
  public name: string; // Display name of the classroom
  public students: Collection<string, Student> = new Collection();
  public groups: number; // Number of groups in this classroom
  public activeLabSession: LabSession | null = null;

  /**
   * Creates a new classroom instance
   *
   * @param id - The Discord thread ID that represents this classroom
   * @param name - The display name of the classroom
   * @param groups - Number of groups to create in this classroom (default: 1)
   */
  constructor(id: string, name: string, groups: number = 1) {
    super();
    this.id = id;
    this.name = name;
    this.groups = Math.max(1, groups); // Ensure at least 1 group exists
    logger.classroom(
      `Created classroom "${name}" with ${groups} group(s), thread ID: ${id}`,
    );
  }

  /**
   * Adds a student to the classroom
   * Emits 'student-added' event for real-time updates
   *
   * @param student - The student object to add
   */
  addStudent(student: Student): void {
    this.students.set(student.id, student);
    logger.classroom(
      `Added student "${student.name}" (${student.id}) to classroom "${this.name}"`,
    );
    this.emit("student-added", student);
  }

  /**
   * Retrieves a student by their Discord user ID
   *
   * @param id - The Discord user ID of the student
   * @returns The student object if found, undefined otherwise
   */
  getStudent(id: string): Student | undefined {
    return this.students.get(id);
  }

  /**
   * Assigns a student to a specific group
   * Emits 'student-group-changed' event for real-time updates
   *
   * @param studentId - The Discord user ID of the student
   * @param group - The group number to assign (1-based)
   * @returns true if successful, false if student or group is invalid
   */
  assignStudentToGroup(studentId: string, group: number): boolean {
    const student = this.students.get(studentId);

    // Validate student exists and group number is valid
    if (!student || group < 1 || group > this.groups) {
      logger.classroom(
        `Failed to assign student ${studentId} to group ${group} (invalid student or group)`,
      );
      return false;
    }

    student.group = group;
    logger.classroom(`Assigned student "${student.name}" to group ${group}`);
    this.emit("student-group-changed", student, group);
    return true;
  }

  /**
   * Starts a new lab session in this classroom
   * Emits 'lab-started' event for real-time updates
   *
   * @param labName - The name of the lab session
   * @returns The newly created lab session object
   * @throws Error if another lab session is already active
   */
  startLab(labName: string): LabSession {
    // Prevent multiple active labs
    if (this.activeLabSession) {
      logger.classroom(
        `Failed to start new lab "${labName}" - another lab is already active`,
      );
      throw new Error("A lab session is already active");
    }

    // Create new lab session
    this.activeLabSession = {
      id: Date.now().toString(), // Use timestamp as unique ID
      name: labName,
      startTime: new Date(),
      threadId: this.id,
    };

    logger.classroom(
      `Started new lab "${labName}" in classroom "${this.name}"`,
    );
    this.emit("lab-started", this.activeLabSession);
    return this.activeLabSession;
  }

  /**
   * Marks a lab as completed for a specific student
   * Emits 'lab-completed' event for real-time updates (only on first completion)
   *
   * @param studentId - The Discord user ID of the student
   * @returns true if successful, false if no active lab or student not found
   */
  completeLab(studentId: string): boolean {
    // Validate an active lab exists
    if (!this.activeLabSession) {
      logger.classroom(
        `Failed to complete lab for student ${studentId} - no active lab session`,
      );
      return false;
    }

    // Validate student exists in this classroom
    const student = this.students.get(studentId);
    if (!student) {
      logger.classroom(
        `Failed to complete lab for student ${studentId} - student not found`,
      );
      return false;
    }

    // Track if this is a new completion or repeat submission
    const isNewCompletion = !student.completedLabs.has(
      this.activeLabSession.id,
    );

    // Mark lab as completed
    student.completedLabs.add(this.activeLabSession.id);
    logger.classroom(
      `Student "${student.name}" completed lab "${this.activeLabSession.name}"`,
    );

    // Only emit event on first completion to avoid duplicate notifications
    if (isNewCompletion) {
      this.emit("lab-completed", student, this.activeLabSession);
    }

    return true;
  }

  /**
   * Checks if a student has completed the currently active lab
   *
   * @param studentId - The Discord user ID of the student
   * @returns true if the student has completed the active lab, false otherwise
   */
  hasCompletedActiveLab(studentId: string): boolean {
    // Early return if no active lab
    if (!this.activeLabSession) {
      return false;
    }

    // Early return if student doesn't exist
    const student = this.students.get(studentId);
    if (!student) {
      return false;
    }

    // Check if student has completed the active lab
    return student.completedLabs.has(this.activeLabSession.id);
  }
}

/**
 * Global store of all active classrooms
 * Key: Thread ID, Value: Classroom instance
 */
export const classrooms = new Collection<string, Classroom>();
