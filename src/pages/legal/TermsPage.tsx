import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800">
      <div className="sticky top-0 z-10 bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Thalia
          </Link>
          <div className="inline-flex items-center gap-2 text-stone-500">
            <FileText size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Terms</span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-stone-500">Last updated 2026-05-04</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">1. Agreement</h2>
            <p>
              By creating an account or using Thalia, you agree to these
              Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">2. Preview status</h2>
            <p>
              Thalia is currently a free preview. Features may change, break,
              or be removed without notice as we develop the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">3. Acceptable use</h2>
            <p>
              You agree to use Thalia only for lawful purposes related to
              planning events. You will not abuse the service, attempt to
              breach security, or use it to send unlawful or harmful content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">4. Account responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              login details and for any activity that occurs under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">5. Content ownership</h2>
            <p>
              Planners retain full ownership of the event data, vendor lists,
              and messages they create in Thalia. We claim no rights over
              your content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">6. Licence to operate</h2>
            <p>
              You grant Thalia a limited licence to store, process, and display
              your content solely for the purpose of providing the service to
              you and your invited collaborators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">7. AI-generated content</h2>
            <p>
              Suggestions produced by the AI generator are provided as
              creative starting points. They are not professional advice and
              may contain errors. You are responsible for reviewing and
              verifying anything you choose to use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">8. Third-party services</h2>
            <p>
              Thalia relies on Cloudflare and AI model providers to deliver
              parts of the service. Their availability and policies are
              outside of our direct control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">9. Payment terms</h2>
            <p>
              Thalia is free to use during the preview. If we introduce paid
              plans in the future, we will give clear notice and you will be
              able to opt in or stop using paid features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">10. Termination</h2>
            <p>
              You may stop using Thalia at any time and delete your account
              from Settings. We may suspend or terminate accounts that
              violate these Terms or place the service at risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">11. Disclaimer of warranties</h2>
            <p>
              Thalia is provided on an "as is" and "as available" basis. We do
              not warrant that the service will be uninterrupted, error-free,
              or fit for any specific purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">12. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Thalia is not liable for
              indirect, incidental, or consequential damages arising from your
              use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">13. Changes to the service</h2>
            <p>
              We may add, modify, or remove features at our discretion. We
              will try to communicate significant changes that affect how you
              use the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">14. Changes to these Terms</h2>
            <p>
              These Terms may be updated from time to time. Continued use of
              Thalia after changes are posted constitutes acceptance of the
              new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">15. Governing law</h2>
            <p>
              These Terms are governed by the laws of the United Kingdom.
              Disputes will be handled in the appropriate courts of that
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">16. Contact</h2>
            <p>
              For questions about these Terms, please contact
              <a
                href="mailto:hello@thalia-events.com"
                className="ml-1 text-plum-700 hover:underline"
              >
                hello@thalia-events.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}
