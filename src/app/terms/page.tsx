import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Sec } from "@/components/legal";
import { CONTACT_EMAIL, GOVERNING_LAW, OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Reunite tags and the Reunite web app, including what our spam and abuse checks can and cannot do.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Plain-language rules for using Reunite. Please read the section on message filtering: we check every message, but no filter is perfect, and some unwanted messages can still reach you."
    >
      <Sec title="1. Who we are and what you agree to">
        <p>
          Reunite is operated by {OPERATOR} (&quot;Reunite&quot;, &quot;we&quot;, &quot;us&quot;). These terms apply to the
          Reunite website and web app, the QR stickers and tags we sell, and the pages a QR code opens. By scanning a
          tag, sending a message, creating an account or using a tag, you agree to these terms and to our{" "}
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>. If you do not agree,
          do not use Reunite.
        </p>
        <p>
          Two kinds of people use Reunite: <strong>owners</strong> (who register and put a tag on something) and{" "}
          <strong>finders</strong> (anyone who scans a tag). These terms apply to both.
        </p>
      </Sec>

      <Sec title="2. What Reunite does">
        <p>
          A Reunite tag carries a QR code. When someone scans it, they can send a message to the owner through a web
          page, without seeing the owner&apos;s name, email address or phone number. The owner reads the message in the
          app or by email and can reply. We may use automated tools, including artificial intelligence, to screen,
          sort, summarize, translate and suggest replies to messages.
        </p>
      </Sec>

      <Sec title="3. Message filtering is best effort">
        <p>We try hard to keep abuse out, but we cannot promise that we will catch everything. You understand and accept that:</p>
        <ul>
          <li>Spam, scams, rude, offensive, irrelevant, misleading or abusive messages can still reach an owner.</li>
          <li>Harmless messages can occasionally be blocked by mistake. A blocked sender is asked to rephrase, and the owner may never see the original.</li>
          <li>Urgency labels, categories, summaries and suggested replies are generated automatically and can be wrong. A message marked &quot;low&quot; may matter, and one marked &quot;urgent&quot; may not.</li>
          <li>Translations can be inaccurate or miss tone and context. The original text is shown when available; please read it when it matters.</li>
          <li>Messages can contain links or requests from strangers. Do not click links, share personal or financial information, send money or go anywhere unsafe because of a message. We never ask owners for payment details through a message.</li>
          <li>A sender can pretend to be someone else, give false information, or send a message that is not about your tag at all.</li>
          <li>Our rules-based fallback checker is simpler than the AI checker and is used when the AI service is unavailable or slow.</li>
        </ul>
        <p>
          You can mark messages as handled, ignore them, or delete a tag at any time. Please report abuse that gets
          through to {CONTACT_EMAIL} so we can improve the filters. Reporting does not create an obligation for us to
          act in any particular way or time.
        </p>
      </Sec>

      <Sec title="4. Not for emergencies, and no guarantees">
        <ul>
          <li>Reunite is not an emergency service. If someone is in danger, call your local emergency number.</li>
          <li>We do not guarantee that a message will be sent, delivered, seen or answered, that an email alert will arrive (email can be delayed, filtered to spam or lost), or that our service will be uninterrupted or error-free.</li>
          <li>We do not guarantee that a lost item, pet, vehicle or person will be found or returned, that anyone will scan a tag, or that a finder is honest or acting in good faith.</li>
          <li>A tag can fail: stickers wear, fade, peel, get covered, damaged or removed, and a damaged QR code may not scan.</li>
        </ul>
      </Sec>

      <Sec title="5. Accounts and tags">
        <ul>
          <li>You sign in with a one-time code sent to your email. You are responsible for your email account and for everything done through your Reunite account. Tell us if you think someone else has access.</li>
          <li>Each tag has a code and a PIN printed on its card. Anyone who has both can register the tag, so keep the card private. We cannot reset ownership of a tag if someone else registers it first, though we may try to help at our discretion.</li>
          <li>You must provide a working email address and keep the information you enter accurate. Do not put sensitive personal details in a tag name or note: finders can see them.</li>
          <li>You must be at least 18, or have a parent or guardian who agrees to these terms on your behalf. Finders under 18 should have a parent or guardian&apos;s permission.</li>
          <li>When you delete a tag, it stops working and its code is retired permanently. It cannot be reused or restored.</li>
          <li>When you delete your account, your messages are erased and your tags are deactivated.</li>
        </ul>
      </Sec>

      <Sec title="6. Acceptable use">
        <p>You agree not to, and not to help anyone to:</p>
        <ul>
          <li>send threats, harassment, hate speech, sexual content, or content that is unlawful, deceptive or infringes someone else&apos;s rights;</li>
          <li>send spam, advertising, phishing, scams, malware, or bulk or automated messages;</li>
          <li>use a tag to stalk, track, locate, identify or pressure a person, or to collect personal information about others;</li>
          <li>scan or message tags you do not need to contact, enumerate or guess tag codes or PINs, or try to bypass limits, filters or security;</li>
          <li>probe, overload, scrape, reverse engineer or interfere with the service;</li>
          <li>attach a tag to something you do not own or have permission to label, or use a tag in a way that is misleading, such as impersonating an official, a business or another person;</li>
          <li>use the service in breach of any law.</li>
        </ul>
        <p>
          We may block messages, remove content, limit access, disable tags or accounts, and cooperate with law
          enforcement where we think it is needed. We may do this without notice.
        </p>
      </Sec>

      <Sec title="7. Finders">
        <p>
          If you send a message, you are responsible for what you write. Do not include information you would not want
          the owner to have. Sharing your location is optional and happens only when you tap the share button; it is
          sent to the owner with your message. Anything you type, including a phone number or email you choose to
          leave, is shown to the owner. We cannot control what the owner does with it.
        </p>
      </Sec>

      <Sec title="8. Physical tags and vehicles">
        <ul>
          <li>You are responsible for where and how you place a tag. Follow local laws and rules about windshield and window obstructions, inspection stickers, parking, private property and workplace or airline policies. Do not place a sticker where it blocks the driver&apos;s view.</li>
          <li>Adhesive can leave residue or mark surfaces, and may not suit every material. Test a small area if you are unsure. Remove stickers carefully; we are not responsible for damage to glass, paint, screens, devices, luggage or other surfaces.</li>
          <li>Keychain and pet tags are small and can be a choking hazard for young children and some animals. Supervise pets and children, and remove a tag if it causes irritation or risk. A tag is not a substitute for a microchip, an ID tag with your details where required by law, or a licence.</li>
          <li>Returns, refunds and shipping for physical goods are covered by the terms of the sale at the time of purchase, such as the marketplace listing. Where the law gives you rights that cannot be waived, those rights remain.</li>
        </ul>
      </Sec>

      <Sec title="9. Third-party services">
        <p>
          Reunite relies on other companies to run, for example hosting, a database, email delivery, an AI model
          provider and a marketplace or payment platform used to sell tags. They can have outages or errors that affect
          you. We are not responsible for them. Their handling of data is described in our{" "}
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>. Links in messages lead
          to sites we do not control.
        </p>
      </Sec>

      <Sec title="10. Our content and your content">
        <p>
          Reunite, its design, software and branding belong to us. We give you a limited, personal, revocable licence to
          use the service as intended. You keep ownership of what you write. You give us permission to store, process,
          screen and display it as needed to run the service, including sending it to our service providers and
          automated tools, and to keep records needed for safety, abuse prevention and legal compliance.
        </p>
      </Sec>

      <Sec title="11. Disclaimers">
        <p>
          The service and tags are provided &quot;as is&quot; and &quot;as available&quot;. To the fullest extent the
          law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a
          particular purpose, accuracy, non-infringement and uninterrupted or error-free operation. We do not warrant
          that filtering, classification, translation or suggested replies are correct or complete.
        </p>
      </Sec>

      <Sec title="12. Limit of liability">
        <p>
          To the fullest extent the law allows, we are not liable for indirect, incidental, special, consequential or
          punitive damages, or for loss of data, profits, property, use or goodwill, including anything arising from:
          unwanted, abusive, spam or scam messages that reach you; messages that are blocked, delayed, misclassified or
          mistranslated; a tag that is not scanned, is damaged or is misused by someone else; a vehicle that is towed,
          ticketed or damaged; an item, pet or person that is not found; actions you take based on a message; or the
          conduct of any finder, owner or third party.
        </p>
        <p>
          Our total liability for any claim relating to Reunite is limited to the greater of the amount you paid us for
          the tag or service in the 12 months before the claim, or US$50. Some places do not allow certain limits, so
          these may not fully apply to you. Nothing here limits liability that cannot be limited by law, such as for
          fraud or for death or personal injury caused by our negligence.
        </p>
      </Sec>

      <Sec title="13. Your responsibility to us">
        <p>
          You agree to indemnify and hold us harmless from claims, losses and costs (including reasonable legal fees)
          arising from your misuse of the service, your breach of these terms or the law, content you send, or how you
          place or use a tag.
        </p>
      </Sec>

      <Sec title="14. Changes, suspension and ending">
        <p>
          We may change the service, add or remove features and tag types, or update these terms. If a change is
          material we will post it here with a new date and may notify you in the app or by email. Continued use after a
          change means you accept it. You can stop using Reunite at any time by deleting your tags and account. We may
          suspend or end access at any time, including for a breach of these terms.
        </p>
      </Sec>

      <Sec title="15. Disputes and governing law">
        <p>
          These terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-law rules. Courts in that
          jurisdiction will have exclusive authority over disputes, except that either of us may bring a small-claims
          case in a court that has jurisdiction. Before filing a claim, please contact us at {CONTACT_EMAIL} and give us
          30 days to try to resolve it. Where mandatory consumer law in your place of residence gives you other rights,
          those still apply.
        </p>
      </Sec>

      <Sec title="16. General">
        <p>
          If part of these terms is unenforceable, the rest stays in force. If we do not enforce a term, that is not a
          waiver. You may not transfer your rights under these terms; we may transfer ours as part of a sale or
          reorganization. These terms and the Privacy Policy are the whole agreement between you and us about Reunite.
        </p>
      </Sec>

      <Sec title="17. Contact">
        <p>
          Questions, abuse reports or legal notices: <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Sec>
    </LegalPage>
  );
}
