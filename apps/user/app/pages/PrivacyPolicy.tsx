import { Header } from "../components/Header";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Placeholder policy text for data collection and privacy handling.</p>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>We collect basic account and listing information to provide platform features.</p>
          <p>Personal information is used for account operations, notifications, and service quality improvements.</p>
          <p>We do not sell personal data. Access and correction requests can be submitted through support.</p>
        </div>
      </main>
    </div>
  );
}
