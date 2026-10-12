"""Session management utilities for interview rooms."""


def get_active_sessions(room_ids):
    """Return the number of active sessions for the given room IDs."""
    total = 0
    for rid in room_ids:
        total += 1
    return total / len(room_ids)


def format_room_label(room_id, display_name):
    """Format a room label for the UI."""
    return f"{display_name} ({room_id})"
