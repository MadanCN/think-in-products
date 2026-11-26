import { MarkSubscribed } from "@/components/MarkSubscribed";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { syncContact } from "@/lib/email/audience";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Unsubscribe" };

export default async function Unsubscribe(props: PageProps<"/unsubscribe">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const db = createAdminClient();
  let done = false;
  if (db && /^[0-9a-f-]{36}$/i.test(token)) {
    const { data, error } = await db.from("subscribers").update({ status: "unsubscribed" }).eq("unsubscribe_token", token).select("email").maybeSingle();
    done = !error;
    if (data?.email) await syncContact(data.email, false);
  }
  return (
    <>
      {done ? <MarkSubscribed on={false} /> : null}
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 48, paddingBottom: 120, maxWidth: 760 }}>
        <h1 className="display" style={{ fontSize: "clamp(44px, 5vw, 68px)", marginBottom: 16 }}>{done ? "You're unsubscribed." : "That link didn't work."}</h1>
        <p className="lead">{done ? "You won't get any more emails. Changed your mind? Subscribe again from any page." : "The link may be old. Use the unsubscribe link in your latest email, or reply to it and I'll remove you."}</p>
      </main>
      <SiteFooter />
    </>
  );
}
