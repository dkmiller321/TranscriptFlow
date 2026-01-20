'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { APP_NAME } from '@/lib/utils/constants';
import styles from '../legal.module.css';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 19, 2026';

  return (
    <>
      <Header />
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
        </header>

        <div className={styles.disclaimer}>
          <p>
            LEGAL NOTICE: This document is a template and requires review by a qualified
            attorney before use. The content below is placeholder text intended to cover
            standard privacy topics for a SaaS transcript extraction service. Please consult
            with legal counsel to customize this document for your specific jurisdiction and
            business requirements, including GDPR, CCPA, and other applicable privacy regulations.
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introduction</h2>
            <p>
              Welcome to {APP_NAME}. We respect your privacy and are committed to protecting
              your personal data. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our Service.
            </p>
            <p>
              Please read this Privacy Policy carefully. By using {APP_NAME}, you consent to
              the data practices described in this policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Information We Collect</h2>

            <h3 className={styles.subsectionTitle}>2.1 Information You Provide</h3>
            <p>We may collect information that you voluntarily provide, including:</p>
            <ul>
              <li>
                <strong>Account Information:</strong> When you create an account, we collect
                your email address and any other information you provide during registration
              </li>
              <li>
                <strong>Profile Information:</strong> Any additional information you choose
                to add to your profile
              </li>
              <li>
                <strong>Communications:</strong> Information you provide when you contact us
                for support or feedback
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>2.2 Information Collected Automatically</h3>
            <p>When you use the Service, we automatically collect certain information:</p>
            <ul>
              <li>
                <strong>Usage Data:</strong> Information about how you use the Service,
                including URLs submitted for transcript extraction, extraction history
                (for authenticated users), and feature usage
              </li>
              <li>
                <strong>Device Information:</strong> Information about your device, including
                IP address, browser type, operating system, and device identifiers
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> We use cookies and similar
                tracking technologies to track activity on the Service. See our Cookie Policy
                section for more details
              </li>
              <li>
                <strong>Log Data:</strong> Server logs that may include your IP address,
                access times, pages viewed, and referring URLs
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>2.3 Information from Third Parties</h3>
            <p>
              We may receive information about you from third-party services:
            </p>
            <ul>
              <li>
                <strong>YouTube API Services:</strong> When you use {APP_NAME} to extract
                transcripts, we access publicly available video metadata through YouTube&apos;s
                API. We do not access your YouTube account or personal YouTube data
              </li>
              <li>
                <strong>Authentication Providers:</strong> If you sign in using a third-party
                service (e.g., Google), we receive basic profile information as permitted by
                your privacy settings on that service
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>
                <strong>Provide and Maintain the Service:</strong> To deliver the transcript
                extraction functionality and maintain your account
              </li>
              <li>
                <strong>Improve the Service:</strong> To understand how users interact with
                the Service and to develop new features and improvements
              </li>
              <li>
                <strong>Personalization:</strong> To provide a personalized experience,
                including extraction history and saved preferences
              </li>
              <li>
                <strong>Communications:</strong> To send you service-related announcements,
                updates, and respond to your inquiries
              </li>
              <li>
                <strong>Security:</strong> To detect, prevent, and address technical issues,
                fraud, and abuse
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable laws,
                regulations, and legal processes
              </li>
              <li>
                <strong>Rate Limiting:</strong> To enforce usage limits and ensure fair
                access to the Service
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Data Storage and Retention</h2>

            <h3 className={styles.subsectionTitle}>4.1 What We Store</h3>
            <ul>
              <li>
                <strong>Account Data:</strong> Stored securely for as long as your account
                is active
              </li>
              <li>
                <strong>Extraction History:</strong> For authenticated users, we store a
                history of extracted transcripts (metadata only, not full transcript content)
                for your convenience
              </li>
              <li>
                <strong>Saved Transcripts:</strong> If you choose to save transcripts to
                your library, they are stored in your account
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>4.2 What We Do NOT Store</h3>
            <ul>
              <li>
                We do not permanently store the full content of extracted transcripts for
                anonymous users
              </li>
              <li>
                We do not store YouTube video content or download videos
              </li>
              <li>
                We do not sell or share your personal data with third parties for their
                marketing purposes
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>4.3 Retention Period</h3>
            <p>
              We retain your personal information only for as long as necessary to fulfill
              the purposes outlined in this Privacy Policy, unless a longer retention period
              is required by law. When you delete your account, we will delete or anonymize
              your personal information within 30 days, except where we are required to
              retain it for legal purposes.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. YouTube API Services</h2>
            <p>
              {APP_NAME} uses YouTube API Services to provide transcript extraction
              functionality. Our use of YouTube API Services is subject to Google&apos;s Privacy
              Policy.
            </p>
            <p>
              <strong>Important:</strong> By using {APP_NAME}, you also agree to be bound by
              Google&apos;s Privacy Policy, available at:{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://policies.google.com/privacy
              </a>
            </p>
            <p>
              We access only publicly available video information and captions through the
              YouTube API. We do not:
            </p>
            <ul>
              <li>Access your personal YouTube account</li>
              <li>Access your YouTube viewing history</li>
              <li>Access your YouTube subscriptions or playlists</li>
              <li>Post content to YouTube on your behalf</li>
              <li>Access any private or unlisted video content</li>
            </ul>
            <p>
              You can revoke {APP_NAME}&apos;s access to data obtained through YouTube API
              Services via the Google security settings page at:{' '}
              <a
                href="https://security.google.com/settings/security/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://security.google.com/settings/security/permissions
              </a>
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track
              information and to improve the Service.
            </p>

            <h3 className={styles.subsectionTitle}>6.1 Types of Cookies We Use</h3>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> Required for the Service to function
                properly, including authentication and security cookies
              </li>
              <li>
                <strong>Functional Cookies:</strong> Used to remember your preferences and
                settings
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors interact
                with the Service to improve user experience
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>6.2 Your Cookie Choices</h3>
            <p>
              You can control cookies through your browser settings. Note that disabling
              certain cookies may affect the functionality of the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>
                <strong>Service Providers:</strong> With third-party vendors who perform
                services on our behalf, such as hosting, analytics, and customer support
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, regulation, or
                legal process
              </li>
              <li>
                <strong>Protection of Rights:</strong> To protect our rights, privacy,
                safety, or property, or that of our users or the public
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition,
                or sale of assets, where user information may be transferred
              </li>
              <li>
                <strong>With Your Consent:</strong> When you have given us explicit consent
                to share your information
              </li>
            </ul>
            <p>
              We do NOT sell your personal information to third parties for their marketing
              purposes.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to
              protect your personal information against unauthorized access, alteration,
              disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of data in transit using TLS/SSL</li>
              <li>Secure storage of passwords using industry-standard hashing</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is
              100% secure. While we strive to protect your information, we cannot guarantee
              absolute security.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your
              personal information:
            </p>

            <h3 className={styles.subsectionTitle}>9.1 General Rights</h3>
            <ul>
              <li>
                <strong>Access:</strong> Request access to the personal information we hold
                about you
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or incomplete
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal information,
                subject to legal retention requirements
              </li>
              <li>
                <strong>Data Portability:</strong> Request a copy of your data in a portable
                format
              </li>
              <li>
                <strong>Objection:</strong> Object to certain processing of your information
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              9.2 European Users (GDPR)
            </h3>
            <p>
              [PLACEHOLDER: If you serve users in the European Economic Area, add specific
              GDPR compliance information, including legal basis for processing, data
              protection officer contact, and supervisory authority information.]
            </p>

            <h3 className={styles.subsectionTitle}>
              9.3 California Users (CCPA)
            </h3>
            <p>
              [PLACEHOLDER: If you serve California residents, add specific CCPA compliance
              information, including the right to know, delete, opt-out of sale, and
              non-discrimination provisions.]
            </p>

            <h3 className={styles.subsectionTitle}>9.4 Exercising Your Rights</h3>
            <p>
              To exercise any of these rights, please contact us using the information
              provided in the Contact section below. We will respond to your request within
              the timeframe required by applicable law.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under the age of 13 (or the applicable
              age of consent in your jurisdiction). We do not knowingly collect personal
              information from children. If you are a parent or guardian and believe your
              child has provided us with personal information, please contact us, and we
              will take steps to delete such information.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. International Data Transfers</h2>
            <p>
              [PLACEHOLDER: Specify where your servers are located and how you handle
              international data transfers. If you transfer data outside the EU/EEA, include
              information about the safeguards in place (e.g., Standard Contractual Clauses,
              adequacy decisions).]
            </p>
            <p>
              Your information may be transferred to and processed in countries other than
              your country of residence. By using the Service, you consent to such transfers.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services, including
              YouTube and Google. This Privacy Policy does not apply to those third-party
              services. We encourage you to review the privacy policies of any third-party
              services you access.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>
            <p>
              For significant changes, we may also notify you by email (if you have an
              account) or through a prominent notice on the Service. Your continued use of
              the Service after any changes indicates your acceptance of the updated Privacy
              Policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>14. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, your personal information,
              or wish to exercise your privacy rights, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p><strong>[PLACEHOLDER: Company Name]</strong></p>
              <p>[PLACEHOLDER: Business Address]</p>
              <p>Email: [PLACEHOLDER: privacy@yourdomain.com]</p>
              <p>Data Protection Officer: [PLACEHOLDER: If applicable]</p>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <p>
            See also our <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
          </p>
        </footer>
      </main>
    </>
  );
}
