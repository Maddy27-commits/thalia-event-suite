import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export function PrivacyPage() {
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
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Privacy</span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-stone-500">Last updated 2026-05-04</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">1. Overview</h2>
            <p>
              Thalia is an early-stage event-planning tool. This policy explains
              what information we collect, how we store it, and the choices you
              have over your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">2. Account information</h2>
            <p>
              When you sign up, we collect your name, email address, and the
              role you select (planner or client). This information is used to
              identify you within the app and route you to the correct workspace.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">3. Event data</h2>
            <p>
              You may add details about events, vendors, tasks, and clients.
              This is your content, and you remain in control of it. We do not
              sell or share event data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">4. Message content</h2>
            <p>
              Conversations between planners and clients are stored alongside
              the relevant event so the thread remains accessible to both
              participants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">5. How we store data</h2>
            <p>
              The current preview stores data in your browser using
              <code className="px-1 mx-1 bg-stone-100 rounded text-stone-700">localStorage</code>.
              Data stays on your device unless you explicitly send it to our
              AI helper.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">6. AI generation</h2>
            <p>
              When you use the AI generator, the prompt is sent to a Cloudflare
              Pages Function that forwards it to a third-party model provider.
              We do not retain prompts beyond the lifetime of the request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">7. What we do not collect</h2>
            <p>
              Thalia does not run analytics, tracking pixels, advertising SDKs,
              or session replay tools. We do not build behavioural profiles and
              we do not fingerprint your device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">8. Cookies</h2>
            <p>
              We do not use tracking cookies. The app uses
              <code className="px-1 mx-1 bg-stone-100 rounded text-stone-700">localStorage</code>
              for your session and preferences, which is technically required
              for the app to function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">9. Data retention</h2>
            <p>
              Your data persists in your browser until you delete it or clear
              site storage. If you delete your account, the associated records
              are removed from our systems within thirty days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">10. Export your data</h2>
            <p>
              You can export your events, vendors, and messages at any time
              from the Settings page. Exports are provided as a JSON file.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">11. Delete your data</h2>
            <p>
              You can delete individual records from within the app, or wipe
              your entire workspace via Settings. Deletion is permanent and
              cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">12. Children</h2>
            <p>
              Thalia is intended for users aged 16 and over. We do not
              knowingly collect information from anyone younger.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">13. Security</h2>
            <p>
              We use industry-standard transport encryption for any traffic to
              our Cloudflare endpoints. No system is perfectly secure, so we
              encourage strong, unique passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">14. Changes to this policy</h2>
            <p>
              We may update this policy as Thalia evolves. Material changes
              will be reflected in the "Last updated" date at the top of this
              page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">15. Contact</h2>
            <p>
              Questions or requests about your data can be sent to
              <a
                href="mailto:eventbythalia@gmail.com"
                className="ml-1 text-plum-700 hover:underline"
              >
                eventbythalia@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}
