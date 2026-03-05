import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for There's Always a Deal, including usage terms, intellectual property, and liability information.",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>

      <p className="mb-6 text-sm text-muted-foreground">
        Last updated: March 2026
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Acceptance of Terms</h2>
        <p className="mb-2">
          By accessing or using There&rsquo;s Always a Deal
          (&ldquo;the&nbsp;Site&rdquo;), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the
          Site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Use of Service</h2>
        <p className="mb-2">
          The Site provides aggregated pricing information for PC video games
          from third-party stores. You agree to use the Site only for lawful
          purposes and in accordance with these terms. You must not:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>
            Use the Site in any way that violates applicable laws or regulations
          </li>
          <li>
            Attempt to interfere with or disrupt the Site&rsquo;s
            infrastructure or services
          </li>
          <li>
            Scrape, crawl, or otherwise extract data from the Site without
            written permission
          </li>
          <li>
            Use the Site to transmit any harmful, offensive, or unlawful content
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Intellectual Property</h2>
        <p className="mb-2">
          All content on the Site, including text, graphics, logos, and software,
          is the property of There&rsquo;s Always a Deal or its content
          suppliers and is protected by intellectual property laws. Game names,
          images, and trademarks belong to their respective owners.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">
          Limitation of Liability
        </h2>
        <p className="mb-2">
          The Site provides pricing information on an &ldquo;as&nbsp;is&rdquo;
          and &ldquo;as&nbsp;available&rdquo; basis. We do not guarantee the
          accuracy, completeness, or timeliness of pricing data displayed on the
          Site. Prices are sourced from third-party stores and may change without
          notice.
        </p>
        <p className="mb-2">
          To the fullest extent permitted by law, There&rsquo;s Always a Deal
          shall not be liable for any indirect, incidental, special, or
          consequential damages arising out of or in connection with your use of
          the Site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Third-Party Links</h2>
        <p className="mb-2">
          The Site contains links to third-party websites, including game
          stores. These links may be affiliate links. We are not responsible for
          the content, privacy practices, or terms of service of any third-party
          sites.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Changes to Terms</h2>
        <p className="mb-2">
          We reserve the right to modify these Terms of Service at any time.
          Changes will be posted on this page with an updated revision date.
          Your continued use of the Site after changes are posted constitutes
          acceptance of the revised terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Contact</h2>
        <p>
          If you have questions about these Terms of Service, please contact us
          at{" "}
          <a
            href="mailto:legal@theresalwaysadeal.com"
            className="text-primary underline"
          >
            legal@theresalwaysadeal.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
