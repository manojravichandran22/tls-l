'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutUsPage() {
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
              About Us — TLS Quality Control App
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-5 text-sm text-t-body leading-relaxed">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                Who We Are
              </h2>
              <p>
                We are a technology team dedicated to building practical, floor-ready solutions for the textile and garment manufacturing industry. The TLS Quality Control App was created in close collaboration with quality inspectors, production managers, and QC teams who work directly on the manufacturing floor every day. Rather than designing a generic quality management tool, we built this App around the real, day-to-day workflows of textile production — from the moment an order enters the line to the point a finished garment passes final inspection. Our goal has always been to replace fragmented paper logs, disconnected spreadsheets, and manual communication with a single, reliable digital system that keeps every stakeholder aligned.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                What We Do
              </h2>
              <p>
                Our App digitizes the complete quality control lifecycle within a textile manufacturing unit. Inspectors use it to conduct TLS audits directly on the shop floor, checking stitching and cloth quality against defined standards as production moves through each line. When defects are identified, the App allows inspectors to raise Rework or Rejection cases instantly, track them through resolution, and escalate unresolved issues so they don&apos;t fall through the cracks. QC teams use the App&apos;s verification tools to review and approve Corrective Action Plans, ensuring that identified issues are genuinely resolved rather than simply logged and forgotten. Beyond individual garment checks, the App supports AQL-based bulk audits for evaluating entire batches before dispatch, and includes configuration tools for mapping production lines to orders, tracking production continuity, and physically linking handheld devices to specific stitching machines — giving management precise, machine-level visibility into where quality issues originate.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                Why We Built This
              </h2>
              <p>
                Quality control in textile manufacturing has traditionally relied on manual registers, verbal handoffs between shifts, and quality data that lives in disconnected systems or, often, nowhere at all. This makes it difficult for manufacturing units to spot recurring defect patterns, hold the right line or machine accountable, or respond quickly when a batch starts drifting out of spec. We built this App because we believe every defect caught on the floor is also a data point that, when captured properly, can help a manufacturing unit improve its yield, reduce rejection rates, and tighten the feedback loop between inspection and correction. By giving every inspector, QC verifier, and manager a shared, real-time view of quality data — tied to specific zones, lines, shifts, and machines — we aim to turn quality control from a reactive, paperwork-heavy task into a proactive, data-driven part of daily operations.
              </p>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                Our Commitment
              </h2>
              <p>
                We are committed to building tools that genuinely fit the realities of a manufacturing floor — fast enough to use between garments on a moving line, simple enough for inspectors of any technical background toadopt without extensive retraining, and structured enough to give management the reporting and traceability they need. We continue to work closely with the manufacturing teams who use this App daily, incorporating their feedback to refine workflows, add new quality modules, and ensure the system evolves alongside the operational needs of the business. Our focus remains on reliability, data accuracy, and making quality control something that strengthens the manufacturing process rather than slowing it down.
              </p>
            </div>

            <div className="pt-2 border-t border-table-line">
              <h2 className="text-sm sm:text-base font-bold text-t-secondary mb-1.5">
                Get in Touch
              </h2>
              <p className="mb-2">
                For questions about the App, feedback on your experience using it, or inquiries about deploying it within your own manufacturing operation, please reach out to us at:
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
