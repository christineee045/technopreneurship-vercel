import { Header } from "../components/Header";

export default function SafetyGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Safety Guidelines</h1>
        <p className="text-muted-foreground mb-8">
          Follow these best practices for safe and reliable borrowing.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Verify Item Condition</h2>
            <p className="text-sm text-muted-foreground">Inspect and document item condition during pickup and return.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Meet in Safe Locations</h2>
            <p className="text-sm text-muted-foreground">Prefer public, well-lit places for exchanges whenever possible.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Communicate Clearly</h2>
            <p className="text-sm text-muted-foreground">Confirm dates, return times, and payment expectations in advance.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
