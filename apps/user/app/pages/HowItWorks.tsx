import { Header } from "../components/Header";

export default function HowItWorks() {
  const steps = [
    "Browse items and open a listing.",
    "Send a borrow request with your preferred dates.",
    "Coordinate pickup and deposit details with the owner.",
    "Return the item on time and in good condition.",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h1>
        <p className="text-muted-foreground mb-8">
          Lendly helps neighbors borrow and share useful items in a simple flow.
        </p>

        <ol className="space-y-4 list-decimal pl-5">
          {steps.map((step, index) => (
            <li key={index} className="text-foreground">{step}</li>
          ))}
        </ol>
      </main>
    </div>
  );
}
