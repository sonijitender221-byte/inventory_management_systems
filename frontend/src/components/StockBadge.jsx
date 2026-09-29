import { stockStatus } from "../utils/format";

export default function StockBadge({ product }) {
  const status = stockStatus(product);
  const map = {
    in: "bg-green-100 text-green-700",
    low: "bg-orange-100 text-orange-700",
    out: "bg-red-100 text-red-700",
  };
  const label = { in: "In stock", low: "Low stock", out: "Out of stock" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}