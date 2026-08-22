const NEXT_STATUSES = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  processing: "statusProcessing",
  shipped: "statusShipped",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

export function nextOrderStatuses(status) {
  return NEXT_STATUSES[status] || [];
}

export function orderStatusLabelKey(status) {
  return STATUS_LABEL_KEYS[status] || "statusUnknown";
}
