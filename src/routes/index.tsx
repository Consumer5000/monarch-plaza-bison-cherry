import { createFileRoute } from "@tanstack/react-router";
import { ExplorerApp } from "@/explorer/ExplorerApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ExplorerApp />;
}
