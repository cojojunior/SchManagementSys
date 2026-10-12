import { LegalLayout } from "./LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="[EFFECTIVE_DATE]"
      contactEmail="privacy@supremeacademy.edu.gh">
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how Supreme Academy ("we", "us", "the
        School") collects, uses, stores, and protects personal information in
        connection with the Supreme Academy School Management System ("the
        Service"). It also explains the rights that students, guardians, and
        staff have in relation to that information.
      </p>
      <p>
        We are committed to processing personal data in accordance with the{" "}
        <strong>
          Data Protection Act, 2012 (Act 843) of the Republic of Ghana
        </strong>{" "}
        and the guidance of the Data Protection Commission.
      </p>

      <h2>2. Who is the data controller</h2>
      <p>The data controller responsible for your personal information is:</p>
      <p>
        <strong>Supreme Academy</strong>
        <br />
        Accra, Ghana
        <br />
        Data Protection Contact: privacy@supremeacademy.edu.gh
      </p>
      <p>
        We are registered with the Data Protection Commission of Ghana
        (registration number [DPC_REGISTRATION_NUMBER]).
      </p>

      <h2>3. What information we collect</h2>

      <h3>3.1 Students</h3>
      <ul>
        <li>Full name, other names, gender, nationality;</li>
        <li>Date of birth and calculated age;</li>
        <li>Admission number and academic year of entry;</li>
        <li>Class and division;</li>
        <li>Residential address;</li>
        <li>Profile photograph (where provided);</li>
        <li>Previous school attended;</li>
        <li>
          Academic records — assessment scores, exam scores, calculated grades,
          remarks, and report cards;
        </li>
        <li>
          Guardian information — name, relationship, phone, email, address,
          emergency contact status;
        </li>
        <li>Fee records — invoices, payments, balances, and receipts;</li>
        <li>
          Result-access records — scratch-card issuance and usage history;
        </li>
        <li>
          A 4-digit login PIN — stored only in the form of a bcrypt hash; we
          never see the plain PIN.
        </li>
      </ul>

      <h3>3.2 Guardians</h3>
      <ul>
        <li>Full name and relationship to the student;</li>
        <li>Phone number and optional email address;</li>
        <li>Residential address;</li>
        <li>Whether they are the primary emergency contact.</li>
      </ul>

      <h3>3.3 Staff</h3>
      <ul>
        <li>Full name, gender, date of birth;</li>
        <li>Contact details (phone, email, address);</li>
        <li>
          Employment information — staff ID, category (teaching/non-teaching),
          department, job title, employment status, date hired, qualifications;
        </li>
        <li>Assigned classes and subjects;</li>
        <li>
          Authentication information — email and password (password is stored
          only in hashed form by our authentication provider);
        </li>
        <li>Audit log of actions taken in the Service.</li>
      </ul>

      <h3>3.4 What we do NOT collect</h3>
      <ul>
        <li>We do not collect biometric data.</li>
        <li>We do not collect precise location data.</li>
        <li>
          We do not process payment card data — all payments happen outside the
          Service, through the School's normal channels.
        </li>
      </ul>

      <h2>4. Children's data and guardian consent</h2>
      <p>
        The Service processes personal information about students, many of whom
        are under the age of 18. We treat this data with heightened care.
      </p>
      <p>
        Guardians provide consent at the time of a student's enrolment for the
        School to hold and process the student's information for educational,
        administrative, and financial purposes.
      </p>
      <p>
        Students themselves do not provide independent consent to this Policy.
        Their account activation process (admission number + date of birth) is
        an identity check, not a consent mechanism.
      </p>

      <h2>5. How we use your information</h2>
      <p>We process personal information for the following purposes:</p>
      <ul>
        <li>
          <strong>Education delivery</strong> — recording assessments,
          calculating grades, generating report cards, and maintaining academic
          records.
        </li>
        <li>
          <strong>School administration</strong> — managing enrolment, class
          assignments, staff assignments, and academic-year structure.
        </li>
        <li>
          <strong>Financial administration</strong> — recording fee structures,
          issuing invoices, tracking payments, and producing statements.
        </li>
        <li>
          <strong>Result access control</strong> — verifying scratch cards and
          protecting the confidentiality of student results.
        </li>
        <li>
          <strong>Security and audit</strong> — maintaining audit logs of
          privileged actions, detecting misuse, and responding to security
          incidents.
        </li>
        <li>
          <strong>Communication</strong> — enabling staff, students, and
          guardians to access the information relevant to them.
        </li>
        <li>
          <strong>Legal compliance</strong> — meeting the School's obligations
          under Ghanaian law.
        </li>
      </ul>

      <h2>6. Legal basis for processing</h2>
      <p>We rely on the following legal bases:</p>
      <ul>
        <li>
          <strong>Consent</strong> — from guardians for the processing of
          student data, and from staff for optional communications.
        </li>
        <li>
          <strong>Contract</strong> — the enrolment agreement between the School
          and a student's guardians; the employment agreement between the School
          and its staff.
        </li>
        <li>
          <strong>Legal obligation</strong> — for example, maintaining academic
          records as required by the Ghana Education Service.
        </li>
        <li>
          <strong>Legitimate interest</strong> — for security, fraud prevention,
          and administrative efficiency, balanced against individual rights.
        </li>
      </ul>

      <h2>7. Who we share data with</h2>
      <p>
        We do not sell personal data. We share it only with the following
        categories of recipients:
      </p>
      <ul>
        <li>
          <strong>Supabase, Inc.</strong> — database hosting, authentication,
          and serverless functions. Data is stored in Supabase's data centres;
          please see Supabase's own privacy policy for details of their security
          and transfer practices.
        </li>
        <li>
          <strong>Netlify, Inc.</strong> — static frontend hosting only. Netlify
          does not process personal data beyond the technical information
          required to serve the application (IP address, request metadata) as
          part of its CDN function.
        </li>
        <li>
          <strong>Authorised school staff</strong> — the Headmaster, Super
          Admin, and (within their permission scope) teachers and the Secretary.
        </li>
        <li>
          <strong>Government authorities</strong> — where required by law, such
          as reporting to the Ghana Education Service.
        </li>
      </ul>
      <p>
        We do not use personal data for advertising, profiling, or sale to third
        parties.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Our infrastructure providers (Supabase and Netlify) may process data on
        servers located outside Ghana, including in the United States and the
        European Union. Where this occurs, we rely on the providers' contractual
        commitments to protect personal data to a standard consistent with
        Ghana's Data Protection Act.
      </p>

      <h2>9. How long we keep data</h2>
      <ul>
        <li>
          <strong>Active students and staff</strong> — for as long as the
          individual remains enrolled or employed.
        </li>
        <li>
          <strong>Former students</strong> — academic records are retained for{" "}
          <strong>seven (7) years</strong> after departure to comply with
          record-keeping requirements and to service alumni requests for
          transcripts. Financial records are retained for the period required by
          tax and audit rules.
        </li>
        <li>
          <strong>Former staff</strong> — employment records are retained for
          seven (7) years after the end of employment.
        </li>
        <li>
          <strong>Audit logs</strong> — retained for two (2) years.
        </li>
        <li>
          <strong>Authentication logs</strong> — retained according to
          Supabase's default retention policy.
        </li>
      </ul>
      <p>
        After the relevant retention period, records are securely destroyed or
        anonymised.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Under the Data Protection Act, 2012 (Act 843), you (or, for students
        under 18, a guardian acting on the student's behalf) have the right to:
      </p>
      <ul>
        <li>
          <strong>Access</strong> — obtain a copy of the personal data we hold
          about you.
        </li>
        <li>
          <strong>Correction</strong> — request that inaccurate or incomplete
          data be corrected.
        </li>
        <li>
          <strong>Deletion</strong> — request deletion of data where it is no
          longer needed for the purpose for which it was collected, subject to
          legal retention requirements.
        </li>
        <li>
          <strong>Objection</strong> — object to certain types of processing,
          particularly where we rely on legitimate interest.
        </li>
        <li>
          <strong>Withdraw consent</strong> — where processing is based on
          consent, withdraw it at any time. Withdrawal does not affect the
          lawfulness of processing carried out before withdrawal.
        </li>
        <li>
          <strong>Complain</strong> — lodge a complaint with the Data Protection
          Commission of Ghana.
        </li>
      </ul>
      <p>
        To exercise any of these rights, contact us using the details in Section
        15. We will respond within thirty (30) days.
      </p>

      <h2>11. How we protect your information</h2>
      <p>We take the following measures to protect personal data:</p>
      <ul>
        <li>
          <strong>Row Level Security</strong> — database-level access controls
          that restrict each user to the data they are authorised to see.
        </li>
        <li>
          <strong>Hashed credentials</strong> — student login PINs and
          scratch-card PINs are stored only as bcrypt hashes. Raw PINs are never
          stored or logged.
        </li>
        <li>
          <strong>Server-side privilege checks</strong> — all privileged
          operations (creating users, publishing results, redeeming cards) run
          in server-side functions that re-verify the caller's role.
        </li>
        <li>
          <strong>Rate limiting</strong> — protection against brute-force
          attacks on PINs and passwords.
        </li>
        <li>
          <strong>Audit logging</strong> — every privileged action is recorded
          for accountability.
        </li>
        <li>
          <strong>Encrypted transport</strong> — all communication between your
          browser and our servers uses HTTPS.
        </li>
      </ul>
      <p>
        No system is perfectly secure. If we become aware of a breach that
        affects your data, we will notify you and the Data Protection Commission
        as required by law.
      </p>

      <h2>12. Cookies and local storage</h2>
      <p>
        The Service uses browser local storage to maintain your session and your
        preferences. We do not use third-party advertising cookies or cross-site
        tracking.
      </p>
      <p>
        You can clear local storage at any time through your browser settings,
        but doing so will sign you out.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes
        will be announced in the Service. The "last updated" date at the top of
        this page reflects the most recent revision.
      </p>

      <h2>14. Governing law</h2>
      <p>
        This Policy is governed by the laws of the Republic of Ghana, including
        the Data Protection Act, 2012 (Act 843).
      </p>

      <h2>15. Contact us</h2>
      <p>For any privacy question or request:</p>
      <p>
        <strong>Supreme Academy — Data Protection Contact</strong>
        <br />
        Accra, Ghana
        <br />
        Email: privacy@supremeacademy.edu.gh
      </p>
      <p>
        You also have the right to contact the Data Protection Commission of
        Ghana directly.
      </p>
    </LegalLayout>
  );
}
