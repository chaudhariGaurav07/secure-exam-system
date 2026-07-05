type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "finalized"
  | "easy"
  | "medium"
  | "hard"
  | "active"
  | "released";

const labelMap: Record<string, string> = {
  pending:   "Pending",
  approved:  "Approved",
  rejected:  "Rejected",
  finalized: "Finalized",
  easy:      "Easy",
  medium:    "Medium",
  hard:      "Hard",
  active:    "Active",
  released:  "Released",
};

interface StatusBadgeProps {
  status: StatusType | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return (
    <span className={cls} aria-label={`Status: ${labelMap[status] ?? status}`}>
      {labelMap[status] ?? status}
    </span>
  );
}
