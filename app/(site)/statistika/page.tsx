import type { Metadata } from "next";
import { StatistikaClient } from "./statistika-client";

export const metadata: Metadata = {
  title: "Statistika",
  description: "Pregled statistike skladišta",
};

export default function StatistikaPage() {
  return <StatistikaClient />;
}
