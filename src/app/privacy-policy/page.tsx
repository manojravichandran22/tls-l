'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div
      style={{
        '--color-input': '#ffffff',
        '--color-input-line': '#CBD5E0',
        '--color-t-primary': '#1A202C',
        '--color-t-secondary': '#2D3748',
        '--color-t-body': '#4A5568',
        '--color-t-light': '#718096',
        '--color-t-lighter': '#A0AEC0',
        '--color-card': '#ffffff',
        '--color-page': '#F5F6FA',
      } as React.CSSProperties}
      className="fixed inset-0 flex flex-col m-0 p-0 bg-white select-text overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto px-6 py-8 flex justify-center">
        <div className="w-full max-w-[640px] py-2 pb-12">

          {/* Logo */}
          <div className="text-center mb-4">
            <Image src="/logoo.png" alt="iQ2 TLS" width={150} height={150} className="inline-block" />
          </div>

          {/* Back to Login */}
          {/* <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-t-light hover:text-accent mb-4 transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            <span>Back to Login</span>
          </Link> */}

          {/* Title */}
          <div className="mb-5 border-b border-table-line pb-3">
            <h1 className="m-0 mb-1 text-xl sm:text-2xl font-bold text-t-primary leading-tight">
              Privacy Policy — TLS Quality Control App
            </h1>
            <p className="m-0 text-xs text-t-light mt-1">
              Last updated: September 9, 2026
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-5 text-sm text-t-body leading-relaxed">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                1. Introduction
              </h2>
              <p>
                This Privacy Policy explains how the TLS Quality Control application (&quot;the App,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, stores, and protects information when used by inspectors, quality control staff, and other authorized personnel within a textile manufacturing organization. The App is designed for internal use by employees of the manufacturing unit to conduct quality audits, track defects, manage rework and rejection workflows, and map physical devices to production machines. By using this App, you agree to the practices described in this policy. If you do not agree with these terms, please do not use the App and contact your organization&apos;s administrator.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                2. Information We Collect
              </h2>
              <p>
                The App collects information necessary to support quality control operations on the manufacturing floor. This includes employee identification details such as name, employee code, role, department, and shift information, which are used to authenticate users and attribute audit records to the correct inspector. We also collect operational data generated through app usage, including quality audit entries, defect records (rework, rejection, and escalation logs), AQL audit results, zone and production line check-in data, and device-to-machine mapping information. Additionally, the App may access device-level information such as device identifiers and network connectivity status to support the device-mapping feature, which links a specific handheld device to a specific stitching machine for traceability purposes. We do not collect sensitive personal information such as financial details, health data, or biometric identifiers through this App.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                3. How We Use Your Information
              </h2>
              <p>
                Information collected through the App is used exclusively to support internal quality management operations. This includes verifying user identity and role-based permissions, associating quality audits and defect reports with the correct employee, zone, production line, and machine, generating quality trend reports for management review, and enabling QC Verification workflows where supervisors review and approve corrective action plans. Check-in and shift data are used to ensure audits are properly attributed to active shifts and to maintain accountability across the production floor. We do not use collected data for advertising, marketing, or any purpose unrelated to the operation of quality control processes within the organization.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                4. Data Storage and Security
              </h2>
              <p>
                Data collected through the App is transmitted securely to servers operated by or on behalf of the manufacturing organization and is stored in accordance with the organization&apos;s internal data retention and security practices. We implement reasonable technical and organizational measures, including authentication tokens and role-based access controls, to protect data from unauthorized access, alteration, or disclosure. Access to audit records, defect logs, and employee data within the App is restricted based on the permissions assigned to each user&apos;s role, meaning individuals can only view and act on information relevant to their assigned zones, lines, or responsibilities. However, no method of electronic transmission or storage is completely secure, and while we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                5. Data Sharing
              </h2>
              <p>
                Information collected through the App is shared only within the organization and only with personnel who require access to perform their job functions, such as QC managers, department heads, or system administrators. We do not sell, rent, or share employee or operational data with third parties for marketing or commercial purposes. Data may be disclosed if required by law, regulation, legal process, or governmental request, or if necessary to protect the rights, property, or safety of the organization, its employees, or others. Any third-party service providers involved in hosting or maintaining the App&apos;s backend infrastructure are contractually bound to protect data confidentiality and use it solely for providing the agreed services.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                6. User Rights and Data Retention
              </h2>
              <p>
                Employees using the App may request access to, correction of, or clarification about the personal information associated with their account by contacting their organization&apos;s HR or IT administrator. Operational records such as audit logs and defect histories are retained for as long as necessary to support quality management, compliance, and reporting requirements, and may be retained beyond an employee&apos;s tenure for historical trend analysis and audit trail purposes. Employee account data is deactivated when an individual leaves the organization, though historical records linked to their past activity within the App may be retained in accordance with the organization&apos;s record-keeping policies.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                7. Children&apos;s Privacy
              </h2>
              <p>
                This App is intended solely for use by adult employees of the manufacturing organization in a professional capacity. It is not directed at children, and we do not knowingly collect information from individuals under the age of 18.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Any changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the App after changes are posted constitutes acceptance of the revised policy.
              </p>
            </div>

            <div className="pt-2 border-t border-table-line">
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                9. Contact Us
              </h2>
              <p className="mb-2">
                If you have questions, concerns, or requests regarding this Privacy Policy or how your information is handled within the App, please contact:
              </p>
              <div className="bg-[#F8F9FB] border border-table-line rounded-lg p-3 space-y-1 mb-8">
                <div className="font-semibold text-t-primary">Prasand</div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-t-light font-medium">Email:</span>
                  <a href="mailto:prasand@pro-z.in" className="text-accent hover:underline font-medium">
                    prasand@pro-z.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-t-light font-medium">Phone:</span>
                  <a href="tel:+919944288651" className="text-accent hover:underline font-medium">
                    +91 99442 88651
                  </a>
                </div>
              </div>
            </div>
          </div>
   <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-t border-table-line text-xs text-t-body bg-white">
          <span>&copy; 2026 iQ2 </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            help@tlssystem
          </span>
        </div>
        </div>
      </div>
    </div>
  )
}
