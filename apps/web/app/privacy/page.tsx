import Link from "next/link";
import MockAppShell from "@/components/mock-app-shell";

export default function PrivacyPage() {
  return (
    <MockAppShell activeNav="home">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ud-text-primary)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--ud-text-muted)]">
          Effective date: April 4, 2026 &middot; Last updated: April 4, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">1. Introduction</h2>
            <p className="mt-2">
              uDeets (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you use the uDeets platform (&ldquo;Service&rdquo;). Please read this policy carefully. By using the
              Service, you consent to the practices described herein.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">2. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide directly to us, including: your name, email address, and profile picture
              when you sign in through a third-party provider (such as Google or Apple); content you post, including
              text, images, and files shared within hubs; hub membership data, including which hubs you create, join, or
              interact with; and preferences and settings you configure within your account.
            </p>
            <p className="mt-2">
              We also automatically collect certain technical information, such as: your device type, browser type, and
              operating system; IP address and general location information; usage data such as pages visited, features
              used, and time spent on the Service; and cookies and similar tracking technologies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">3. How We Use Your Information</h2>
            <p className="mt-2">
              We use the information we collect to: provide, maintain, and improve the Service; personalize your
              experience, including showing relevant hubs and content; communicate with you about updates, features, and
              support; ensure the safety and security of our platform and users; comply with legal obligations and
              enforce our Terms & Conditions; and analyze usage trends to improve performance and user experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">4. Information Sharing</h2>
            <p className="mt-2">
              We do not sell your personal information. We may share your information in the following circumstances: with
              other hub members when you post content or interact within a hub (your profile name and avatar are visible
              to other members); with service providers who assist us in operating the platform, subject to
              confidentiality obligations; when required by law, such as in response to a subpoena, court order, or
              government request; and to protect the rights, property, or safety of uDeets, our users, or others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">5. Data Storage & Security</h2>
            <p className="mt-2">
              Your data is stored securely using industry-standard infrastructure. We use encryption in transit and at
              rest to protect your information. While we take reasonable measures to safeguard your data, no method of
              transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">6. Cookies & Tracking</h2>
            <p className="mt-2">
              We use cookies and similar technologies to maintain your session, remember your preferences, and understand
              how the Service is used. You can control cookie settings through your browser preferences. Disabling
              cookies may affect the functionality of certain features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">7. Your Rights & Choices</h2>
            <p className="mt-2">
              Depending on your location, you may have certain rights regarding your personal data, including: the right
              to access, correct, or delete your personal information; the right to object to or restrict certain
              processing of your data; the right to data portability; and the right to withdraw consent at any time where
              processing is based on consent. You can manage your profile information, notification preferences, and
              privacy settings directly through the Service. To exercise any of these rights, please contact us at the
              email address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">8. Children&rsquo;s Privacy</h2>
            <p className="mt-2">
              The Service is not intended for children under 13. We do not knowingly collect personal information from
              children under 13. If we become aware that we have collected data from a child under 13, we will take steps
              to delete that information promptly. If you believe a child under 13 has provided us with personal
              information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">9. Third-Party Services</h2>
            <p className="mt-2">
              The Service may contain links to or integrations with third-party services (such as Google for
              authentication). We are not responsible for the privacy practices of these third parties. We encourage you
              to review their privacy policies before providing them with your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">10. Data Retention</h2>
            <p className="mt-2">
              We retain your information for as long as your account is active or as needed to provide the Service. If
              you delete your account, we will delete or anonymize your personal data within a reasonable timeframe,
              unless we are required to retain it for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">11. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last
              updated&rdquo; date at the top. We encourage you to review this page periodically. Material changes will be
              communicated through the Service or via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">12. Contact Us</h2>
            <p className="mt-2">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us
              at{" "}
              <a href="mailto:privacy@udeets.com" className="text-[var(--ud-brand-primary)] hover:underline">
                privacy@udeets.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-[var(--ud-border-subtle)] pt-6 text-xs text-[var(--ud-text-muted)]">
          <Link href="/terms" className="text-[var(--ud-brand-primary)] hover:underline">
            Terms & Conditions
          </Link>
          <span className="mx-2">&middot;</span>
          <span>uDeets &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </MockAppShell>
  );
}
