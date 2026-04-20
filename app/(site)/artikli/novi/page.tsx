import type { Metadata } from "next";
import { NoviArtikalForm } from "@/components/artikli/novi-artikal-form";

export const metadata: Metadata = {
  title: "Novi artikal",
  description: "Dodavanje novog artikla u skladište",
};

export default function NoviArtikalPage() {
  return <NoviArtikalForm />;
}
