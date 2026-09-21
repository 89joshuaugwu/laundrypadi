import type { Metadata } from "next";
import Link from "next/link";
import { Faq, type FaqItem } from "@/components/Faq";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Help",
  description: "Answers to common questions about booking laundry, tracking an order and using LaundryPadi.",
  alternates: { canonical: "/help" },
};

const faqs: FaqItem[] = [
  {
    q: "Do I need an account to book or track my laundry?",
    a: "No. Open your shop's page, send a booking request, and track your order with the order reference and the phone number you used. An account is optional and keeps your orders in one place.",
  },
  {
    q: "What happens after I send a booking request?",
    a: "The shop reviews your request and confirms the final price and collection date. Only then does it become an order with a reference you can track.",
  },
  {
    q: "Where do I find my order reference?",
    a: "It is on your receipt and in any message the shop sends you. It looks like LP-1042.",
  },
  {
    q: "How do I pay?",
    a: "You pay the shop directly, in cash or by bank transfer. The shop records your payment against the order, and you can see the balance when you track it.",
  },
  {
    q: "My order cannot be found. What should I do?",
    a: "Check that the reference is typed correctly and that you are using the same phone number you gave the shop. If it still fails, contact the shop directly.",
  },
];

export default function HelpPage() {
  return (
    <LegalPage title="Help" intro="Quick answers about booking, tracking and paying for your laundry.">
      <section>
        <h2 className="sr-only">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>
      <section>
        <h2>Still stuck?</h2>
        <p>
          Contact your laundry shop first, since they hold your items.{" "}
          <Link href="/track" className="font-semibold text-primary underline underline-offset-4">Track your order</Link> to see their details.
        </p>
        {(site.supportWhatsapp || site.supportEmail) && (
          <p>
            For problems with LaundryPadi itself:
            {site.supportWhatsapp && (
              <>
                {" "}
                <a className="font-semibold text-primary underline underline-offset-4" href={waLink(site.supportWhatsapp, "Hello LaundryPadi, I need help.")} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              </>
            )}
            {site.supportWhatsapp && site.supportEmail && " or"}
            {site.supportEmail && (
              <>
                {" "}
                <a className="font-semibold text-primary underline underline-offset-4" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
              </>
            )}
            .
          </p>
        )}
      </section>
    </LegalPage>
  );
}
