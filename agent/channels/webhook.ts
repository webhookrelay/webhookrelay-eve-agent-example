import { defineChannel, POST } from "eve/channels";

// Inbound webhooks land here. Point your Webhook Relay bucket's output at
// http://agent:3000/eve/v1/webhook (the docker-compose service name) and the
// webhookrelayd sidecar delivers every event to this route over the compose
// network — no inbound ports, no public IP, works behind NAT.
//
// Each delivery starts a fresh agent session: the model reads the payload,
// works out what happened and writes a triage report via the save_report tool.
export default defineChannel({
  routes: [
    POST("/eve/v1/webhook", async (req, { send }) => {
      // Optional shared secret so only your relay can trigger the agent.
      const secret = process.env.WEBHOOK_SECRET;
      if (secret && req.headers.get("x-webhook-secret") !== secret) {
        return new Response("Invalid or missing x-webhook-secret", {
          status: 401,
        });
      }

      const body = await req.text();

      // Webhook Relay preserves the original provider headers, so the agent
      // can tell a GitHub event from a Stripe event without guessing.
      const headers: Record<string, string> = {};
      for (const name of [
        "content-type",
        "user-agent",
        "x-github-event",
        "x-gitlab-event",
        "x-shopify-topic",
        "stripe-signature",
      ]) {
        const value = req.headers.get(name);
        if (value) headers[name] = value;
      }

      const session = await send(
        [
          "A webhook just arrived. Triage it and save a report.",
          `Headers: ${JSON.stringify(headers, null, 2)}`,
          `Body:\n${body}`,
        ].join("\n\n"),
        {
          auth: null,
          // A unique token per delivery = a fresh session per webhook.
          continuationToken: `webhook-${crypto.randomUUID()}`,
        },
      );

      return Response.json({ ok: true, sessionId: session.id });
    }),
  ],
});
