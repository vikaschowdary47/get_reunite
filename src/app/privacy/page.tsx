import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Sec } from "@/components/legal";
import { CONTACT_EMAIL, OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Reunite collects, how messages are screened by AI, who we share data with, how long we keep it, and your choices.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Reunite exists so people can reach you without your number. This page explains what we collect, why, who helps us run the service, and the choices you have. We do not sell your data and we do not show ads."
    >
      <Sec title="1. Who is responsible">
        <p>
          {OPERATOR} operates Reunite and decides how personal information is used. Contact:{" "}
          <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This policy
          works together with our <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>.
        </p>
      </Sec>

      <Sec title="2. What we collect">
        <p><strong>Owners</strong></p>
        <ul>
          <li>Email address, used to sign you in with one-time codes and to send alerts and account emails.</li>
          <li>Tag details you enter: the tag name, the note finders see, tag type, reply language, and your tag codes.</li>
          <li>Messages you receive and replies you send, plus how each was sorted (urgency, category, summary, translation, suggested replies).</li>
          <li>Sign-in records: hashed one-time codes, hashed session tokens, and the time you last used them.</li>
        </ul>
        <p><strong>Finders</strong></p>
        <ul>
          <li>The message you write, and optional details you choose to add: where you are, a phone or email to reach you, and your location if you tap the share button.</li>
          <li>The language of your message and the time it was sent.</li>
        </ul>
        <p><strong>Everyone</strong></p>
        <ul>
          <li>A short, one-way hash of your network address, kept in rate-limit records to stop abuse. We do not store your raw address for this purpose, and the records expire.</li>
          <li>Standard server logs kept by our hosting provider, such as time, page and error details.</li>
          <li>Two cookies for owners: a sign-in session cookie and a short-lived cookie while a code is pending. We do not use advertising or cross-site tracking cookies.</li>
        </ul>
        <p>
          We do not collect your name, phone number or payment card through Reunite. Payments for physical tags are
          handled by the marketplace or payment service where you buy them, under their policies.
        </p>
      </Sec>

      <Sec title="3. What owners and finders can see">
        <ul>
          <li>Finders see the tag name and note you chose, and the type of item. They do not see your email, phone number or account.</li>
          <li>Owners see what a finder wrote, including any optional contact details or location the finder chose to share.</li>
          <li>If you include personal details in a tag name or note, any finder can read them. Keep those fields general.</li>
        </ul>
      </Sec>

      <Sec title="4. How we use information">
        <ul>
          <li>To run Reunite: deliver messages and replies, send sign-in codes and alerts, and show your inbox.</li>
          <li>To screen messages: block abuse and spam, rate urgency, translate and draft replies.</li>
          <li>To keep the service safe: rate limits, abuse investigation, enforcing our terms, and meeting legal obligations.</li>
          <li>To improve reliability and fix bugs. We do not use your messages for advertising and we do not sell them.</li>
        </ul>
      </Sec>

      <Sec title="5. Automated screening and AI">
        <p>
          Each message a finder sends is analyzed by an AI model, with a simpler rules-based checker as backup. The
          message text (and the owner&apos;s reply language and tag type, so replies fit) is sent to our AI provider,
          Anthropic, to produce a safety decision, urgency, summary, translation and suggested replies. We ask the provider
          to process this data only to return a result for us, and we send only what is needed. No decision about an
          owner is made by AI that has legal or similarly significant effects: it only sorts and drafts.
        </p>
        <p>
          Screening is not perfect. Some spam or abusive messages can reach you and some harmless ones can be blocked.
          See section 3 of the Terms. A blocked message is not shown to the owner. We may keep blocked messages briefly for
          abuse prevention and review.
        </p>
      </Sec>

      <Sec title="6. Who we share data with">
        <p>We share data only with service providers who help us run Reunite, and when the law requires it:</p>
        <ul>
          <li>Hosting and database providers, to store and serve the app.</li>
          <li>An email delivery provider, to send sign-in codes and alerts to your email address.</li>
          <li>An AI provider, to screen and translate messages, as described above.</li>
          <li>Authorities or other parties when we believe disclosure is required by law or needed to protect people, our users or our service from harm or fraud.</li>
          <li>A buyer or successor if Reunite is sold or reorganized, under terms that protect your data.</li>
        </ul>
        <p>These providers may be located outside your country, including in the United States.</p>
      </Sec>

      <Sec title="7. How long we keep it">
        <ul>
          <li>Sign-in codes expire after 10 minutes. Sessions last up to 30 days or until you sign out.</li>
          <li>Messages and replies are kept until you delete the account or the tag&apos;s data is removed, or we delete them under our retention practices.</li>
          <li>Deleting your account erases your messages and deactivates your tags. A retired tag code is kept (without personal details) so it can never be reused.</li>
          <li>Rate-limit records are short-lived. Logs and backups kept by providers are deleted on their normal schedules, which can take some weeks.</li>
          <li>We may keep limited records longer where needed for safety, abuse prevention, disputes or legal duties.</li>
        </ul>
      </Sec>

      <Sec title="8. Your choices and rights">
        <ul>
          <li>Edit what finders see, or delete a tag, at any time from your dashboard.</li>
          <li>Delete your account in Settings to erase your messages and deactivate your tags.</li>
          <li>Ask us for a copy of your data, a correction, or deletion by emailing {CONTACT_EMAIL}. We may need to confirm it is you by replying from your account email.</li>
          <li>Depending on where you live (for example California, other US states, the EU or UK), you may have extra rights such as access, portability, objection or complaint to a regulator. We will honor these as the law requires. We do not sell or share personal information for cross-context behavioral advertising.</li>
          <li>Finders can use Reunite without an account, and do not have to share location or contact details.</li>
        </ul>
      </Sec>

      <Sec title="9. Location">
        <p>
          Your device location is requested only when a finder taps the share-location button. If shared, the coordinates
          are stored with that message and shown to the owner as a map link. Choosing not to share does not stop you from
          sending a message.
        </p>
      </Sec>

      <Sec title="10. Children">
        <p>
          Reunite is not directed to children under 13, and owners must be at least 18 (or use it with a parent or
          guardian). We do not knowingly collect personal information from children under 13. If you think a child has sent
          us information, email {CONTACT_EMAIL} and we will delete it.
        </p>
      </Sec>

      <Sec title="11. Security">
        <p>
          We protect data with measures such as hashed codes and sessions, signed links, access checks on every account
          page, encryption in transit, and rate limits. No system is completely secure, and email can be intercepted or
          misdelivered, so we cannot guarantee absolute security. Anyone with access to your email inbox can sign in to
          your Reunite account, and alert emails contain a link that opens your tag&apos;s inbox, so keep your email account
          secure and do not forward those emails.
        </p>
      </Sec>

      <Sec title="12. Unwanted and abusive messages">
        <p>
          Because anyone can scan a tag, some unwanted messages may reach you despite our screening. If you receive abuse
          or a message that worries you, do not reply, mark it handled or delete the tag, and report it to us. We may keep
          and review reported messages to improve protection and, where the law requires or safety demands, share them
          with authorities. In an emergency contact your local emergency services.
        </p>
      </Sec>

      <Sec title="13. Changes">
        <p>
          We may update this policy as the service changes. We will post the new version here with a new date and, for
          material changes, notify you in the app or by email.
        </p>
      </Sec>

      <Sec title="14. Contact">
        <p>
          Privacy questions or requests: <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Sec>
    </LegalPage>
  );
}
