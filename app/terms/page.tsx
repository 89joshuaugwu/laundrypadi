import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using LaundryPadi as a customer or as a laundry shop owner.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="These terms explain how LaundryPadi works for customers and for laundry shop owners."
      updated="September 21, 2026"
    >
      <section>
        <h2>What LaundryPadi is</h2>
        <p>LaundryPadi is software that connects customers with independent laundry shops and helps those shops manage orders. The laundry service itself is provided by the shop, not by LaundryPadi.</p>
      </section>
      <section>
        <h2>For customers</h2>
        <ul>
          <li>A booking request is not an order until the shop confirms it.</li>
          <li>The shop sets its prices and confirms the final price and collection date.</li>
          <li>You pay the shop directly. Questions about your items, quality or damage go to the shop.</li>
          <li>Give accurate contact details so the shop can reach you.</li>
        </ul>
      </section>
      <section>
        <h2>For shop owners</h2>
        <ul>
          <li>You are responsible for your prices, your customers&rsquo; items and the accuracy of the orders and payments you record.</li>
          <li>Launch pricing is a one-time setup fee and a monthly fee, shown on the shop owners page. The monthly plan can be stopped at any time.</li>
          <li>Keep your sign-in details private. Actions taken from your account are treated as yours.</li>
        </ul>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>Do not misuse the service, attempt to access other people&rsquo;s data, or submit false or abusive requests. We may limit or suspend accounts that do.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update these terms as the service grows. The date above shows the latest version.</p>
      </section>
    </LegalPage>
  );
}
