'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { APP_NAME } from '@/lib/utils/constants';
import styles from '../legal.module.css';

export default function TermsOfServicePage() {
  const lastUpdated = 'January 19, 2026';

  return (
    <>
      <Header />
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
        </header>

        <div className={styles.disclaimer}>
          <p>
            LEGAL NOTICE: This document is a template and requires review by a qualified
            attorney before use. The content below is placeholder text intended to cover
            standard topics for a SaaS transcript extraction service. Please consult with
            legal counsel to customize this document for your specific jurisdiction and
            business requirements.
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Agreement to Terms</h2>
            <p>
              By accessing or using {APP_NAME} (&quot;Service&quot;), you agree to be bound by these
              Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not
              access or use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of
              any changes by posting the new Terms on this page and updating the &quot;Last updated&quot;
              date. Your continued use of the Service after any such changes constitutes your
              acceptance of the new Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Description of Service</h2>
            <p>
              {APP_NAME} is a web-based application that enables users to extract and download
              transcripts from YouTube videos and channels. The Service provides transcript
              extraction, formatting, and export capabilities.
            </p>
            <p>
              The Service utilizes the YouTube Data API to access publicly available video
              information and captions. We do not host, store, or distribute video content
              from YouTube.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. User Accounts</h2>
            <p>
              To access certain features of the Service, you may be required to create an
              account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security and confidentiality of your login credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms
              or engage in fraudulent, abusive, or illegal activities.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes. You shall not:</p>
            <ul>
              <li>
                Violate any applicable local, state, national, or international law or
                regulation
              </li>
              <li>
                Infringe upon or violate the intellectual property rights or privacy rights
                of others
              </li>
              <li>
                Use the Service to extract transcripts from content you do not have the
                right to access
              </li>
              <li>
                Attempt to bypass rate limits, access controls, or other security measures
              </li>
              <li>
                Use automated systems or software to extract data from the Service without
                our express written consent
              </li>
              <li>
                Redistribute, sell, or commercially exploit extracted transcripts without
                proper authorization from content owners
              </li>
              <li>
                Use the Service in any manner that could damage, disable, overburden, or
                impair it
              </li>
              <li>
                Engage in any activity that interferes with or disrupts the Service
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. YouTube API Services</h2>
            <p>
              The Service uses YouTube API Services. By using {APP_NAME}, you also agree to
              be bound by the YouTube Terms of Service (
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.youtube.com/t/terms
              </a>
              ) and acknowledge Google&apos;s Privacy Policy (
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://policies.google.com/privacy
              </a>
              ).
            </p>
            <p>
              You acknowledge that the Service&apos;s functionality depends on YouTube&apos;s API
              availability and that changes to YouTube&apos;s policies or API may affect the
              Service&apos;s features and availability.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Intellectual Property</h2>

            <h3 className={styles.subsectionTitle}>6.1 Service Content</h3>
            <p>
              The Service, including its original content, features, and functionality, is
              owned by {APP_NAME} and is protected by international copyright, trademark,
              patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className={styles.subsectionTitle}>6.2 Extracted Content</h3>
            <p>
              Transcripts extracted through the Service are derived from content created by
              third parties (YouTube content creators). You are solely responsible for
              ensuring that your use of extracted transcripts complies with applicable
              copyright laws and the rights of content owners.
            </p>
            <p>
              The Service does not grant you any rights to use extracted transcripts beyond
              what is permitted by applicable law, including fair use provisions. Commercial
              use of extracted transcripts may require permission from the original content
              creator.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Rate Limits and Usage Restrictions</h2>
            <p>
              To ensure fair access and maintain service quality, we implement rate limits
              on the number of transcripts that can be extracted within certain time periods.
              These limits may vary based on your account type:
            </p>
            <ul>
              <li>Anonymous users: Limited extractions per hour and per day</li>
              <li>Registered users: Higher extraction limits with account authentication</li>
              <li>Premium users (future): Enhanced limits and additional features</li>
            </ul>
            <p>
              We reserve the right to modify these limits at any time to maintain service
              reliability and comply with third-party API requirements.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Payment Terms (Future)</h2>
            <p>
              [PLACEHOLDER: This section will be updated when premium subscription plans are
              introduced. It will cover subscription fees, billing cycles, refund policies,
              cancellation procedures, and payment processing.]
            </p>
            <p>
              Currently, the Service is offered free of charge. When premium features are
              introduced, this section will be updated to reflect applicable payment terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
              TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from using the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
              <li>
                The transcripts extracted will be complete, accurate, or free from errors
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} AND ITS
              AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul>
              <li>Your access to or use of (or inability to access or use) the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>
                Unauthorized access, use, or alteration of your transmissions or content
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {APP_NAME} and its officers,
              directors, employees, agents, and affiliates from and against any and all
              claims, damages, obligations, losses, liabilities, costs, and expenses arising
              from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>
                Your violation of any third-party right, including any intellectual property
                or privacy right
              </li>
              <li>
                Any claim that your use of extracted transcripts caused damage to a third
                party
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice or liability, for any reason, including but not limited to
              breach of these Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. If you
              wish to terminate your account, you may do so through the account settings or
              by contacting us.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>13. Governing Law</h2>
            <p>
              [PLACEHOLDER: Specify the governing law and jurisdiction. This typically
              depends on where your business is incorporated or operates.]
            </p>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              [JURISDICTION], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>14. Dispute Resolution</h2>
            <p>
              [PLACEHOLDER: Specify dispute resolution procedures, such as arbitration
              clauses, mediation requirements, or court jurisdiction. Consult with legal
              counsel to determine the appropriate mechanism for your business.]
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>15. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such
              provision will be modified to the minimum extent necessary to make it
              enforceable, and the remaining provisions will continue in full force and
              effect.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>16. Entire Agreement</h2>
            <p>
              These Terms, together with our <Link href="/privacy">Privacy Policy</Link>,
              constitute the entire agreement between you and {APP_NAME} regarding the
              Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>17. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p><strong>[PLACEHOLDER: Company Name]</strong></p>
              <p>[PLACEHOLDER: Business Address]</p>
              <p>Email: [PLACEHOLDER: legal@yourdomain.com]</p>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <p>
            See also our <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          </p>
        </footer>
      </main>
    </>
  );
}
