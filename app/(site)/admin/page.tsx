import type { Metadata } from "next";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Odobravanje korisnika",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
