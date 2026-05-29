import { Header } from "../components/Header";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Placeholder policy text for your platform terms.</p>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>By using this platform, you agree to follow borrowing rules, respect owners, and return items on time.</p>
          <p>Users are responsible for the accuracy of listings and communication between parties.</p>
          <p>Disputes should be reported with clear documentation and supporting details.</p>
        </div>
      </main>
    </div>
  );
}
