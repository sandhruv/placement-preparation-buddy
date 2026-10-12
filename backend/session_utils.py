"""Session management utilities for interview rooms."""


def get_active_session_count(room_ids):
    """Return the number of active sessions for the given room IDs.

    Returns 0 for an empty list rather than raising ZeroDivisionError.
    """
    if not room_ids:
        return 0
    return len(set(room_ids))


def format_room_label(room_id, display_name):
    """Format a room label for the UI."""
    name = (display_name or "").strip()
    if not name:
        name = f"Room {room_id}"
    return f"{name} ({room_id})"


def average_session_duration(durations_seconds):
    """Return the average session duration in seconds.

    Returns 0.0 when the input list is empty.
    """
    if not durations_seconds:
        return 0.0
    return sum(durations_seconds) / len(durations_seconds)
