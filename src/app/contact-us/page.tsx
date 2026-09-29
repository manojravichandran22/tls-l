'use client'

import Image from 'next/image'

export default function ContactUsPage() {
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

          {/* Title */}
          <div className="mb-5 border-b border-table-line pb-3">
            <h1 className="m-0 mb-1 text-xl sm:text-2xl font-bold text-t-primary leading-tight">
              Contact Us — TLS Quality Control App
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-5 text-sm text-t-body leading-relaxed">
            <p>
              For questions about the App, feedback on your experience using it, or inquiries about deploying it within your own manufacturing operation, please reach out to us:
            </p>

            <div className="bg-[#F8F9FB] border border-table-line rounded-lg p-4 space-y-2.5 mb-8">
              <div>
                <span className="text-xs text-t-light uppercase font-semibold tracking-wider block">Contact Person</span>
                <span className="font-bold text-base text-t-primary">Prasand</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-t-light font-medium">Email:</span>
                <a href="mailto:prasand@pro-z.in" className="text-accent hover:underline font-medium">
                  prasand@pro-z.in
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-t-light font-medium">Phone:</span>
                <a href="tel:+919944288651" className="text-accent hover:underline font-medium">
                  +91 99442 88651
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
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
