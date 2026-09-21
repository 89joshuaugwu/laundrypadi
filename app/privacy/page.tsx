import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What LaundryPadi collects, why, who sees it and how to ask for your data to be removed.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="LaundryPadi collects only what is needed to book, track and manage laundry orders. We do not sell personal data."
      updated="September 21, 2026"
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Booking details: your name, phone number, the items, your preferred collection date and any notes you add.</li>
          <li>Account details, if you create an account: your name, email address and account type.</li>
          <li>Shop details, if you run a shop: business name, address, opening hours, prices, customers and orders you record.</li>
          <li>Images you upload, such as a shop logo or photo.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>To send your booking request to the shop you chose, let you track an order, let shops manage their own orders and customers, and keep the service secure. Your phone number is used to confirm it is you when you track an order.</p>
      </section>
      <section>
        <h2>Who can see it</h2>
        <p>A shop sees the requests and orders made to that shop only. Shops cannot see each other&rsquo;s data. Our service providers process data on our behalf: Google Firebase for accounts and the database, Cloudinary for images, and Vercel for hosting.</p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>LaundryPadi does not process your laundry payments. You pay the shop directly, and the shop records the payment.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can ask us or your shop to correct or delete your information. Contact details are on the Help page.</p>
      </section>
    </LegalPage>
  );
}
