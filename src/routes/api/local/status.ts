import { createFileRoute } from "@tanstack/react-router";

/** Hosted and preview builds have no disk access. The desktop starter replaces this response. */
export const Route = createFileRoute("/api/local/status")({
  server: {
    handlers: {
      GET: async () => Response.json({ local: false, folder: null, name: "" }),
    },
  },
});
