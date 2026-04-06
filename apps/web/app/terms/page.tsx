import Link from "next/link";
import MockAppShell from "@/components/mock-app-shell";

export default function TermsPage() {
  return (
    <MockAppShell activeNav="home" skipAuth>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ud-text-primary)]">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-[var(--ud-text-muted)]">
          Effective date: April 4, 2026 &middot; Last updated: April 4, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the uDeets platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms &
              Conditions. If you do not agree with any part of these terms, you may not use the Service. We reserve the
              right to update these terms at any time, and your continued use of the Service after such changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">2. Eligibility</h2>
            <p className="mt-2">
              You must be at least 13 years of age to use the Service. By using uDeets, you represent and warrant that
              you meet this age requirement and have the legal capacity to enter into a binding agreement. If you are
              under 18, you confirm that a parent or legal guardian has reviewed and agreed to these terms on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">3. Account Registration</h2>
            <p className="mt-2">
              To access certain features, you must create an account using a supported sign-in provider (e.g., Google or
              Apple). You are responsible for maintaining the security of your account credentials and for all activity
              that occurs under your account. You agree to notify us immediately of any unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">4. User Content</h2>
            <p className="mt-2">
              You retain ownership of any content you post, upload, or share through the Service (&ldquo;User
              Content&rdquo;). By posting User Content, you grant uDeets a non-exclusive, worldwide, royalty-free license
              to use, display, reproduce, and distribute your content solely for the purpose of operating and improving
              the Service. You are solely responsible for ensuring your content does not violate any applicable laws or
              the rights of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">5. Prohibited Conduct</h2>
            <p className="mt-2">
              When using the Service, you agree not to: post content that is unlawful, harmful, threatening, abusive,
              defamatory, or otherwise objectionable; impersonate any person or entity; upload viruses or malicious code;
              attempt to gain unauthorized access to the Service or its infrastructure; use the Service for spam,
              phishing, or other unsolicited communications; or interfere with the operation of the Service or other
              users&rsquo; experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">6. Hub Management</h2>
            <p className="mt-2">
              Hub creators and administrators are responsible for managing their hub&rsquo;s content and members. uDeets
              reserves the right to remove or restrict any hub that violates these terms. Hub creators may set their own
              rules and guidelines within the bounds of these Terms & Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">7. Intellectual Property</h2>
            <p className="mt-2">
              The Service, including its design, features, branding, and underlying technology, is owned by uDeets and
              protected by applicable intellectual property laws. You may not copy, modify, distribute, or reverse
              engineer any part of the Service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">8. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account at our discretion if you violate these terms or engage in
              behavior that is harmful to the Service or its users. You may delete your account at any time through your
              account settings. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">9. Disclaimers & Limitation of Liability</h2>
            <p className="mt-2">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
              whether express or implied. uDeets does not guarantee that the Service will be uninterrupted, error-free,
              or secure. To the maximum extent permitted by law, uDeets shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">10. Changes to Terms</h2>
            <p className="mt-2">
              We may revise these Terms & Conditions from time to time. When we do, we will update the &ldquo;Last
              updated&rdquo; date at the top of this page. We encourage you to review this page periodically. Material
              changes will be communicated through the Service or via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">11. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:support@udeets.com" className="text-[var(--ud-brand-primary)] hover:underline">
                support@udeets.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-[var(--ud-border-subtle)] pt-6 text-xs text-[var(--ud-text-muted)]">
          <Link href="/privacy" className="text-[var(--ud-brand-primary)] hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2">&middot;</span>
          <span>uDeets &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </MockAppShell>
  );
}
