import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "Learn about the affiliate relationships used by There's Always a Deal and how we earn commissions from game store links.",
};

export default function AffiliateDisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Affiliate Disclosure</h1>

      <p className="mb-6 text-sm text-muted-foreground">
        Last updated: March 2026
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">FTC Disclosure</h2>
        <p className="mb-2">
          In accordance with the Federal Trade Commission&rsquo;s guidelines
          concerning the use of endorsements and testimonials in advertising,
          we want you to be aware that There&rsquo;s Always a Deal participates
          in affiliate programs with various game stores. This means that when
          you click on links to those stores from our site and make a purchase,
          we may earn a commission at no additional cost to you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">
          Our Affiliate Relationships
        </h2>
        <p className="mb-2">
          We participate in affiliate programs with the following game stores:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-4">
          <li>
            <strong>Steam</strong> &mdash; via the Steam Partner program
            (Xsolla)
          </li>
          <li>
            <strong>GOG</strong> &mdash; via the GOG Affiliate program
          </li>
          <li>
            <strong>Epic Games Store</strong> &mdash; via the Epic Games
            Support-a-Creator program
          </li>
          <li>
            <strong>Humble Bundle</strong> &mdash; via the Humble Partner
            program
          </li>
          <li>
            <strong>Fanatical</strong> &mdash; via the Fanatical Affiliate
            program
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">How It Works</h2>
        <p className="mb-2">
          When you visit a game store through a link on our site, a special
          tracking parameter is added to the URL. If you make a purchase during
          that session, the store recognizes that the referral came from
          There&rsquo;s Always a Deal and may pay us a small commission. This
          commission comes from the store&rsquo;s marketing budget and does not
          increase the price you pay.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">
          Our Commitment to You
        </h2>
        <p className="mb-2">
          Affiliate relationships do not influence our price comparisons or
          which deals we display. Our goal is to help you find the best price
          for the games you want, regardless of which store offers it. All
          prices shown on the Site are sourced directly from each store and are
          not modified based on affiliate status.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Contact</h2>
        <p>
          If you have questions about our affiliate relationships, please
          contact us at{" "}
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
