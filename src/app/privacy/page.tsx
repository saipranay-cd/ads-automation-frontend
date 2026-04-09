export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1
          className="mb-8 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p><strong style={{ color: "var(--text-primary)" }}>Last updated:</strong> April 2026</p>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>1. Information We Collect</h2>
            <p>When you use Adsflow, we collect information necessary to provide our ad management services:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Account information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Ad platform data:</strong> When you connect Meta Ads, Google Ads, or Zoho CRM, we access your ad campaign data, performance metrics, and lead information through their official APIs using OAuth tokens you authorize.</li>
              <li><strong>Usage data:</strong> How you interact with our platform to improve the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>2. How We Use Your Information</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Display your ad campaign performance data in a unified dashboard.</li>
              <li>Generate AI-powered optimization suggestions for your campaigns.</li>
              <li>Compute lead quality metrics (CPQL) by matching CRM data with ad platform data.</li>
              <li>Send notifications about campaign performance and sync status.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>3. Data Sharing</h2>
            <p>We do not sell, rent, or share your personal information or ad data with third parties. Your data is only accessed by:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Members of your organization (based on their assigned role).</li>
              <li>The ad platform APIs (Meta, Google, Zoho) to read and manage your campaigns on your behalf.</li>
              <li>AI services (Anthropic Claude, OpenAI) to generate optimization suggestions — only aggregated metrics are sent, never raw personal data.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>4. Data Security</h2>
            <p>We protect your data with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Encrypted storage for all OAuth tokens and API credentials.</li>
              <li>JWT-based authentication with 7-day expiry.</li>
              <li>Role-based access control (Admin, Editor, Viewer).</li>
              <li>Organization-level data isolation — each workspace is fully separated.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you disconnect a platform or delete your account, the associated OAuth tokens and cached data are removed. Historical campaign performance data may be retained in aggregated form.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>6. Your Rights</h2>
            <p>You can:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Disconnect any connected platform at any time from Settings.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Export your data by contacting your organization administrator.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>7. Third-Party Services</h2>
            <p>Adsflow integrates with the following third-party services, each with their own privacy policies:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Meta (Facebook) — <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>Meta Privacy Policy</a></li>
              <li>Google Ads — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>Google Privacy Policy</a></li>
              <li>Zoho CRM — <a href="https://www.zoho.com/privacy.html" target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>Zoho Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>8. Changes</h2>
            <p>We may update this policy from time to time. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>9. Contact</h2>
            <p>For questions about this privacy policy or your data, contact your organization administrator or the platform operator.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
