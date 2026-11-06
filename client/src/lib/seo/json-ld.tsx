import { SITE } from "@/lib/constants/site";
import type { Plan } from "@/types";

const ORGANIZATION_ID = `${SITE.url}/#organization`;

/** Structured data, escaped so that content can't break out of the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE.name,
      legalName: SITE.legalName,
      url: SITE.url,
      logo: `${SITE.url}/icons/icon-512.png`,
      description: SITE.description,
      email: SITE.supportEmail,
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SITE.supportEmail },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "en-NG",
      publisher: { "@id": ORGANIZATION_ID },
    },
  ],
};

export function pricingGraph(plans: Plan[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Business email hosting",
    serviceType: "Business email hosting",
    description: SITE.description,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "Country", name: "Nigeria" },
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: `${plan.name} plan`,
      description: plan.features.join(", "),
      url: `${SITE.url}/register?plan=${plan.slug}`,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.priceYearlyNgn,
        priceCurrency: SITE.currency,
        unitText: "YEAR",
      },
    })),
  };
}

export function faqGraph(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
