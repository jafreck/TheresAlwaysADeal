import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how There's Always a Deal collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>

      <p className="mb-6 text-sm text-muted-foreground">
        Last updated: March 2026
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data We Collect</h2>
        <p className="mb-2">
          When you use There&rsquo;s Always a Deal we may collect the following
          information:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>
            Account information (email address, display name) when you register
          </li>
          <li>
            Usage data such as pages visited, search queries, and interactions
            with game listings
          </li>
          <li>
            Device and browser information including IP address, browser type,
            and operating system
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">
          Advertising &amp; Google AdSense
        </h2>
        <p className="mb-2">
          We use Google AdSense to display advertisements on our site. Google
          AdSense may use cookies and web beacons to serve ads based on your
          prior visits to this and other websites. Specifically:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>
            Google&rsquo;s use of advertising cookies enables it and its
            partners to serve ads based on your browsing history.
          </li>
          <li>
            You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Ads Settings
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Cookies</h2>
        <p className="mb-2">
          We use cookies for essential site functionality, authentication, and
          advertising. Cookies fall into the following categories:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>
            <strong>Essential cookies:</strong> Required for the site to function
            (e.g., session tokens).
          </li>
          <li>
            <strong>Advertising cookies:</strong> Used by Google AdSense and
            third-party ad partners to deliver relevant ads.
          </li>
          <li>
            <strong>Analytics cookies:</strong> Help us understand how visitors
            interact with the site.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Managing Cookie Consent</h2>
        <p className="mb-2">
          When you first visit our site, a cookie consent banner will appear
          allowing you to accept or decline non-essential cookies. You can change
          your preference at any time by clearing your browser cookies and
          revisiting the site. If you decline consent, ads will be shown in
          non-personalized mode.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Your Rights</h2>
        <p className="mb-2">
          Depending on your jurisdiction, you may have the right to:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>Access the personal data we hold about you</li>
          <li>Request correction or deletion of your data</li>
          <li>Opt out of personalized advertising</li>
          <li>Withdraw consent for non-essential cookie usage</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Contact</h2>
        <p>
          If you have questions about this privacy policy, please contact us at{" "}
          <a
            href="mailto:privacy@theresalwaysadeal.com"
            className="text-primary underline"
          >
            privacy@theresalwaysadeal.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
