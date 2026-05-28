import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — SparkPage',
  description:
    'How SparkPage (Online Marketing Group, LLC) collects, uses, and protects information on sparkpage.us and on landing pages published through the service.',
};

const H2 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-2" {...props} />
);
const H3 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className="text-base font-semibold text-gray-900 mt-4 mb-1" {...props} />
);
const UL = (props: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className="list-disc pl-6 space-y-1" {...props} />
);

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="May 28, 2026">
      <p>
        This Privacy Policy explains how Online Marketing Group, LLC
        (&ldquo;SparkPage,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) handles
        information collected through{' '}
        <strong>sparkpage.us</strong> and our application at{' '}
        <strong>app.sparkpage.us</strong> (collectively, the &ldquo;Service&rdquo;),
        as well as information collected by landing pages our customers publish
        through the Service on <strong>*.pages.sparkpage.us</strong> and on
        customer-owned domains (collectively, &ldquo;Published Pages&rdquo;).
      </p>

      <H2>1. Who we are</H2>
      <p>
        SparkPage is operated by Online Marketing Group, LLC, 530 Technology
        Drive, Irvine, CA 92618. For questions about this policy or to exercise
        your rights, contact us at{' '}
        <a className="text-orange-600 hover:underline" href="mailto:support@sparkpage.us">
          support@sparkpage.us
        </a>
        .
      </p>

      <H2>2. Information we collect</H2>

      <H3>Account information</H3>
      <p>
        When you create a SparkPage account, we collect your email address and
        authentication state through our identity provider (Supabase). We also
        store your role (e.g., admin, member) and the projects you create or
        are invited to collaborate on.
      </p>

      <H3>Content you provide</H3>
      <p>
        When you build a landing page, we store the business information you
        provide — business name, services, locations, contact details,
        testimonials, images, and any URLs you ask us to analyze. This content
        is used to generate and render your Published Page.
      </p>

      <H3>Information collected automatically on sparkpage.us</H3>
      <p>
        When you use the Service, we receive standard request metadata (IP
        address, user-agent, referrer, timestamps) and store a session cookie
        used to keep you signed in.
      </p>

      <H3>Information collected on your Published Pages</H3>
      <p>
        Published Pages may include the following measurement tools, each of
        which collects data only after a visitor accepts the matching category
        in the on-page cookie banner:
      </p>
      <UL>
        <li>
          <strong>SparkPage heatmap (first-party, analytics):</strong> click
          coordinates, rage-clicks, dead-clicks, and per-session maximum scroll
          depth. Click coordinates are normalized to the document so a single
          server-side snapshot can render heatmaps at any viewport. The script
          captures short text labels (≤ 60 characters) only from buttons,
          links, and headings; it never reads the contents of form inputs,
          textareas, labels, or select elements.
        </li>
        <li>
          <strong>CallRail (analytics):</strong> when configured by the page
          owner, swaps phone numbers and records phone calls for attribution.
          CallRail&apos;s own privacy practices apply to recorded calls.
        </li>
        <li>
          <strong>Microsoft Clarity (analytics):</strong> when configured by
          the page owner, records anonymized session replays and aggregate
          interaction metrics.
        </li>
        <li>
          <strong>Google Ads / Google Analytics (marketing):</strong> when
          configured by the page owner, used for conversion tracking and
          remarketing.
        </li>
        <li>
          <strong>AudienceLab pixel (identifiable):</strong> when configured
          by the page owner, may match visit data against third-party records
          to build audience profiles. This is the only category that can
          associate a visit with an identifiable person, and it is off until
          the visitor opts in.
        </li>
      </UL>

      <H2>3. How we use information</H2>
      <UL>
        <li>To provide, secure, and improve the Service.</li>
        <li>
          To generate landing-page content from the business details you
          supply, using OpenAI as a processor.
        </li>
        <li>
          To enrich your business profile with publicly available data through
          DataForSEO when you choose the &ldquo;Look up my business&rdquo; flow.
        </li>
        <li>
          To surface analytics, leads, calls, and heatmaps to the page owner
          inside the dashboard.
        </li>
        <li>
          To communicate with you about your account, security, and material
          changes to the Service.
        </li>
      </UL>

      <H2>4. Service providers we share with</H2>
      <p>
        We share the minimum data needed to operate the Service with the
        following processors:
      </p>
      <UL>
        <li>
          <strong>Supabase</strong> — authentication and primary database.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and edge delivery of the Service
          and Published Pages.
        </li>
        <li>
          <strong>OpenAI</strong> — text generation and competitor research.
        </li>
        <li>
          <strong>DataForSEO</strong> — business enrichment and local search
          data.
        </li>
        <li>
          <strong>Unsplash</strong> — stock-image search and licensing.
        </li>
        <li>
          <strong>CallRail, Microsoft Clarity, AudienceLab, Google</strong> —
          only when the page owner has explicitly configured them on a
          Published Page, and only after visitor consent through the on-page
          banner.
        </li>
      </UL>

      <H2>5. Cookies</H2>
      <p>
        On <strong>sparkpage.us</strong> and <strong>app.sparkpage.us</strong>,
        we use a single first-party session cookie issued by Supabase to keep
        you signed in. No marketing or analytics cookies are set on these
        domains.
      </p>
      <p>
        On <strong>Published Pages</strong>, cookies are categorized as
        Marketing, Analytics, or Identifiable. Visitors choose which categories
        to allow through the on-page banner; the choice is stored locally in
        their browser. Declining or dismissing the banner keeps all trackers
        inert.
      </p>

      <H2>6. Retention</H2>
      <p>
        Account and project data is retained for as long as your account is
        active and for a reasonable period afterward to comply with legal
        obligations. Cookie-derived analytics data on Published Pages is
        retained for up to 90 days. Third-party processor retention is governed
        by their own policies.
      </p>

      <H2>7. Your rights</H2>
      <p>
        Depending on where you live, you may have the right to access, correct,
        export, or delete personal information we hold about you, to object to
        certain processing, or to withdraw consent. California residents have
        rights under the CCPA/CPRA, including the right to know, the right to
        delete, the right to correct, the right to limit use of sensitive
        information, and the right not to be discriminated against for
        exercising these rights. To make a request, email{' '}
        <a className="text-orange-600 hover:underline" href="mailto:support@sparkpage.us">
          support@sparkpage.us
        </a>{' '}
        from the address on your account.
      </p>
      <p>
        If you are a visitor of a Published Page, the page owner is the
        controller of the information collected on that page. Direct requests
        to the business listed on the page; we will assist as a processor.
      </p>

      <H2>8. Security</H2>
      <p>
        We use industry-standard safeguards, including encryption in transit,
        scoped database access, and per-tenant authorization. No system is
        perfectly secure; we encourage you to use a strong, unique password and
        to keep your email account secure.
      </p>

      <H2>9. Children</H2>
      <p>
        The Service is not directed to children under 13, and we do not
        knowingly collect personal information from them. If you believe a
        child has provided us with personal information, contact us and we
        will delete it.
      </p>

      <H2>10. International transfers</H2>
      <p>
        We operate in the United States. If you access the Service from outside
        the U.S., your information will be transferred to and processed in the
        United States, which may have different data-protection laws than your
        jurisdiction.
      </p>

      <H2>11. Changes to this policy</H2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we
        will update the effective date above and, for material changes, take
        reasonable steps to notify you.
      </p>

      <H2>12. Contact</H2>
      <p>
        Online Marketing Group, LLC
        <br />
        530 Technology Drive, Irvine, CA 92618
        <br />
        <a className="text-orange-600 hover:underline" href="mailto:support@sparkpage.us">
          support@sparkpage.us
        </a>
      </p>
    </LegalPage>
  );
}
