import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LINKEDIN_KEY = Deno.env.get("LINKEDIN_API_KEY");
const X_KEY = Deno.env.get("X_API_KEY");

type Post = {
  id: string;
  user_id: string;
  platform: string;
  generated_content: string;
  scheduled_at: string;
};

async function gateway(connector: string, connectionKey: string, path: string, body: unknown) {
  const res = await fetch(`${GATEWAY_URL}/${connector}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Gateway ${connector} failed [${res.status}]: ${text}`);
    throw new Error(`[${res.status}] ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function publishToX(content: string) {
  if (!X_KEY) throw new Error("X (Twitter) não está conectado.");
  const data = await gateway("x", X_KEY, "/2/tweets", { text: content.slice(0, 280) });
  return data?.data?.id ?? null;
}

async function publishToLinkedIn(content: string) {
  if (!LINKEDIN_KEY) throw new Error("LinkedIn não está conectado.");
  const me = await fetch(`${GATEWAY_URL}/linkedin/v2/userinfo`, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": LINKEDIN_KEY,
    },
  });
  const meText = await me.text();
  if (!me.ok) throw new Error(`[${me.status}] ${meText}`);
  const sub = JSON.parse(meText)?.sub;
  if (!sub) throw new Error("Não foi possível identificar a conta do LinkedIn.");

  const data = await gateway("linkedin", LINKEDIN_KEY, "/v2/ugcPosts", {
    author: `urn:li:person:${sub}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  });
  return data?.id ?? null;
}

async function publish(platform: string, content: string) {
  switch (platform) {
    case "twitter":
    case "x":
      return await publishToX(content);
    case "linkedin":
      return await publishToLinkedIn(content);
    default:
      throw new Error(`Publicação automática ainda não disponível para ${platform}.`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: due, error } = await supabase
      .from("content_history")
      .select("id, user_id, platform, generated_content, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .lt("publish_attempts", 3)
      .limit(25);

    if (error) throw error;

    const posts = (due ?? []) as Post[];
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    // Only publish for users who turned auto-publish on.
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const enabled = new Set<string>();
    if (userIds.length) {
      const { data: settings } = await supabase
        .from("business_settings")
        .select("user_id, auto_publish")
        .in("user_id", userIds);
      (settings ?? []).forEach((s: { user_id: string; auto_publish: boolean }) => {
        if (s.auto_publish) enabled.add(s.user_id);
      });
    }

    for (const post of posts) {
      if (!enabled.has(post.user_id)) continue;
      try {
        const externalId = await publish(post.platform, post.generated_content);
        await supabase
          .from("content_history")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            external_post_id: externalId,
            publish_error: null,
          })
          .eq("id", post.id);
        results.push({ id: post.id, ok: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const { data: current } = await supabase
          .from("content_history")
          .select("publish_attempts")
          .eq("id", post.id)
          .maybeSingle();
        const attempts = (current?.publish_attempts ?? 0) + 1;
        await supabase
          .from("content_history")
          .update({
            publish_attempts: attempts,
            publish_error: message.slice(0, 500),
            status: attempts >= 3 ? "failed" : "scheduled",
          })
          .eq("id", post.id);
        results.push({ id: post.id, ok: false, error: message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("publish-scheduled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
