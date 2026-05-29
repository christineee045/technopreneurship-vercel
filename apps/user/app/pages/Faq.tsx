import { Link } from "react-router";
import { Header } from "../components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export default function Faq() {
  const sections = [
    {
      id: "how-borrowing-works",
      title: "How Borrowing Works",
      items: [
        {
          q: "How do I request an item?",
          a: "Open an item page, choose your dates, and submit a request. The owner will review and respond.",
        },
        {
          q: "How long does approval take?",
          a: "Most owners reply within 24 hours, but timing can vary based on availability.",
        },
        {
          q: "Can I cancel my request?",
          a: "Yes. You can cancel a pending request before the owner approves it.",
        },
        {
          q: "Do I need to meet in person?",
          a: "Usually yes. Borrowers and owners coordinate pickup and return details directly.",
        },
      ],
    },
    {
      id: "deposits-insurance",
      title: "Deposits & Insurance",
      items: [
        {
          q: "Why is a deposit required?",
          a: "Deposits protect owners from damage or non-return and encourage responsible borrowing.",
        },
        {
          q: "When do I get my deposit back?",
          a: "After the item is returned in agreed condition, the owner releases the deposit.",
        },
        {
          q: "What if an item is damaged?",
          a: "The owner and borrower should document the issue and follow platform dispute steps.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns",
      items: [
        {
          q: "How do returns work?",
          a: "Borrowers return items at the agreed date, time, and location set with the owner.",
        },
        {
          q: "What if I need an extension?",
          a: "Message the owner as early as possible and request approval for new return dates.",
        },
        {
          q: "Do I need to clean the item first?",
          a: "Yes. Return items clean and in the same condition to avoid penalties.",
        },
        {
          q: "What happens if I return late?",
          a: "Late returns may include extra fees or reduced trust score depending on owner terms.",
        },
      ],
    },
    {
      id: "community-rules",
      title: "Community Rules",
      items: [
        {
          q: "What behavior is expected?",
          a: "Be respectful, communicate clearly, and honor agreed pickup and return schedules.",
        },
        {
          q: "Can I list prohibited items?",
          a: "No. Illegal, unsafe, or restricted items are not allowed on the platform.",
        },
        {
          q: "How can I report a user?",
          a: "Use the report option on the listing or profile and include clear details.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link> / FAQ
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-3">
            Quick answers about borrowing, deposits, returns, and community expectations.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.id} className="rounded-lg border bg-card p-5 md:p-6">
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <Accordion type="single" collapsible className="w-full">
                {section.items.map((item, index) => (
                  <AccordionItem key={`${section.id}-${index}`} value={`${section.id}-${index}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
