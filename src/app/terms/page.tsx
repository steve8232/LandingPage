import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — SparkPage',
  description:
    'The terms that govern your use of SparkPage by Online Marketing Group, LLC.',
};

const H2 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-2" {...props} />
);
const UL = (props: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className="list-disc pl-6 space-y-1" {...props} />
);

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="May 28, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of SparkPage, including <strong>sparkpage.us</strong>,{' '}
        <strong>app.sparkpage.us</strong>, and landing pages published through
        the service on <strong>*.pages.sparkpage.us</strong> or on a custom
        domain you connect (collectively, the &ldquo;Service&rdquo;). The
        Service is provided by Online Marketing Group, LLC (&ldquo;SparkPage,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account or using the
        Service, you agree to these Terms.
      </p>

      <H2>1. The Service</H2>
      <p>
        SparkPage is a tool for building, publishing, and measuring landing
        pages for local service businesses. The Service uses AI-assisted
        content generation, third-party research providers, and optional
        analytics integrations.
      </p>

      <H2>2. Eligibility and accounts</H2>
      <p>
        You must be at least 18 years old and able to enter a binding contract.
        Creating new landing pages currently requires an admin role on your
        SparkPage account; non-admin users may still access pages shared with
        them. You are responsible for keeping your login credentials
        confidential and for all activity that occurs under your account.
      </p>

      <H2>3. Acceptable use</H2>
      <p>You agree not to use the Service to:</p>
      <UL>
        <li>Publish content that is illegal, fraudulent, deceptive, or misleading.</li>
        <li>Impersonate a business or person you don&apos;t represent.</li>
        <li>Infringe intellectual-property, privacy, or publicity rights.</li>
        <li>Send spam or engage in unsolicited commercial communications.</li>
        <li>
          Distribute malware, run pen-tests against our infrastructure without
          written permission, or interfere with the Service.
        </li>
        <li>
          Scrape, reverse-engineer, or resell the Service except as expressly
          permitted.
        </li>
      </UL>

      <H2>4. Your content</H2>
      <p>
        You retain ownership of the business information, copy, images, and
        other content you provide (&ldquo;Your Content&rdquo;). You grant
        SparkPage a worldwide, non-exclusive, royalty-free license to host,
        copy, transmit, modify (for formatting and rendering), and display Your
        Content solely as needed to operate the Service and deliver your
        Published Pages. You represent that you have the rights necessary to
        grant this license and to publish Your Content.
      </p>

      <H2>5. AI-assisted content</H2>
      <p>
        Parts of your Published Pages may be generated or suggested by
        large-language models and other automated tools using the inputs you
        provide. Generated copy can be inaccurate, outdated, or inconsistent
        with your business&apos;s actual offerings. You are responsible for
        reviewing all content before publishing and for the accuracy of any
        claims (including pricing, guarantees, licensing, certifications, and
        service-area coverage) that appear on your Published Pages.
      </p>

      <H2>6. Stock images</H2>
      <p>
        Photographs sourced through the Service&apos;s Unsplash integration are
        licensed under the Unsplash License. By using them you agree to comply
        with that license, including its restrictions on creating competing
        services.
      </p>

      <H2>7. Third-party services</H2>
      <p>
        The Service integrates with third-party providers such as Vercel,
        Supabase, OpenAI, DataForSEO, Unsplash, CallRail, Microsoft Clarity,
        AudienceLab, and Google. When you enable an integration on a Published
        Page, you are also bound by the relevant provider&apos;s terms and
        privacy policies. We are not responsible for third-party services.
      </p>

      <H2>8. Custom domains</H2>
      <p>
        If you connect a custom domain to a Published Page, you represent that
        you own or have permission to use that domain. You are responsible for
        DNS configuration on your side; we are responsible for the certificate
        issuance and routing on ours. We may refuse or remove a custom-domain
        connection that violates these Terms or causes operational issues.
      </p>

      <H2>9. Compliance on your Published Pages</H2>
      <p>
        You are the controller of personal information collected from visitors
        of your Published Pages. You agree to display the SparkPage cookie
        consent banner (or an equivalent compliant mechanism), to honor visitor
        choices, and to comply with all applicable laws — including the FTC
        Act, TCPA, CAN-SPAM, GDPR, and the CCPA/CPRA — for any data collected
        through your pages.
      </p>

      <H2>10. Fees</H2>
      <p>
        Fees, if any, will be presented to you before you incur them. We may
        change pricing on prospective notice. Pass-through charges from
        integrated third-party services (for example, CallRail call minutes or
        DataForSEO research credits) are your responsibility unless we
        explicitly state otherwise.
      </p>

      <H2>11. Suspension and termination</H2>
      <p>
        You may stop using the Service at any time. We may suspend or
        terminate your account or any Published Page if we reasonably believe
        you have violated these Terms, if required by law, or to protect the
        Service or its users. On termination, we may delete or anonymize Your
        Content after a reasonable wind-down period.
      </p>

      <H2>12. Disclaimers</H2>
      <p>
        The Service is provided <strong>&ldquo;as is&rdquo;</strong> and{' '}
        <strong>&ldquo;as available.&rdquo;</strong> To the maximum extent
        permitted by law, we disclaim all warranties, express or implied,
        including merchantability, fitness for a particular purpose,
        non-infringement, accuracy, and uninterrupted operation. We do not
        warrant that AI-generated content is accurate, that any specific
        marketing outcome will be achieved, or that the Service will be free
        of errors or downtime.
      </p>

      <H2>13. Limitation of liability</H2>
      <p>
        To the maximum extent permitted by law, SparkPage and its affiliates,
        officers, employees, and agents are not liable for any indirect,
        incidental, special, consequential, exemplary, or punitive damages, or
        for any loss of profits, revenue, data, or goodwill, arising out of or
        in connection with these Terms or the Service. Our aggregate liability
        for all claims relating to the Service is limited to the greater of
        (a) the amounts you paid us in the 12 months before the event giving
        rise to the claim, or (b) US $100.
      </p>

      <H2>14. Indemnification</H2>
      <p>
        You agree to indemnify, defend, and hold harmless SparkPage and its
        affiliates from any claim, loss, or expense (including reasonable
        attorneys&apos; fees) arising out of Your Content, your use of the
        Service, or your violation of these Terms or applicable law.
      </p>

      <H2>15. Governing law and venue</H2>
      <p>
        These Terms are governed by the laws of the State of California,
        without regard to its conflict-of-laws principles. The exclusive venue
        for any dispute arising out of or relating to these Terms or the
        Service is the state and federal courts located in Orange County,
        California, and you and SparkPage consent to personal jurisdiction
        there.
      </p>

      <H2>16. Changes to these Terms</H2>
      <p>
        We may update these Terms from time to time. When we do, we will
        update the effective date above. Your continued use of the Service
        after an update constitutes acceptance of the revised Terms.
      </p>

      <H2>17. Miscellaneous</H2>
      <p>
        These Terms, together with the Privacy Policy, are the entire
        agreement between you and SparkPage regarding the Service. If any
        provision is held unenforceable, the remaining provisions remain in
        effect. Our failure to enforce a provision is not a waiver. You may
        not assign these Terms without our consent; we may assign them in
        connection with a merger, acquisition, or sale of assets.
      </p>

      <H2>18. Contact</H2>
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
