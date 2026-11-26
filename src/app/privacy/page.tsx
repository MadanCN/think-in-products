import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Privacy", description: "How ThinkInProducts handles your email address and account data.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 760 }}>
        <h1 className="display" style={{ fontSize: "clamp(44px, 5vw, 68px)", marginBottom: 24 }}>Privacy</h1>
        <div className="prose">
          <p><em>Draft: review and adjust before launch.</em></p>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Your email address</strong>, if you subscribe, to send the newsletter.</li>
            <li><strong>Your account details</strong> (name, email, and Google profile if you sign in with Google), if you create an account.</li>
            <li><strong>Your answers</strong> to questions in pieces, if you&apos;re logged in, so you can see your progress.</li>
            <li><strong>Page view counts</strong> per piece. These are anonymous totals, not tied to you.</li>
            <li><strong>Email opens and clicks</strong> on the newsletter, to see which issues are useful.</li>
            <li><strong>What you send through the contact form</strong> (name, email, message), to reply to you.</li>
            <li><strong>What you send when you pitch a piece</strong> (name, email, phone, your idea and an optional link), with your consent, to review the pitch and contact you about it.</li>
            <li><strong>A scrambled (hashed) version of your network address</strong> when you send a form, to stop spam. The address itself isn&apos;t stored.</li>
          </ul>
          <h2>What we don&apos;t do</h2>
          <p>We don&apos;t sell or share your data, and we don&apos;t use advertising trackers.</p>
          <h2>Services we use</h2>
          <p>Supabase stores accounts and subscriptions. Resend delivers email. Razorpay handles payments for paid plans; we never see your card details.</p>
          <h2>Your choices</h2>
          <p>Unsubscribe from any email in one click. To delete your account, a message or a pitch you sent, <a href="/contact">contact us</a> and we&apos;ll remove it.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
