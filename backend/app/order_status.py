ORDER_STATUSES = frozenset({"pending", "processing", "shipped", "completed", "cancelled"})

ORDER_STATUS_TRANSITIONS = {
    "pending": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"completed"},
    "completed": set(),
    "cancelled": set(),
}


def can_transition(current: str, requested: str) -> bool:
    return current == requested or requested in ORDER_STATUS_TRANSITIONS.get(current, set())
