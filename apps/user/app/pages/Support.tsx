import { Link } from "react-router";
import { Header } from "../components/Header";

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Support</h1>
        <p className="text-muted-foreground mb-8">
          Need help? Use the links below for guidance and policies.
        </p>

        <ul className="space-y-3 text-sm">
          <li><Link to="/contact-us" className="text-primary hover:underline">Contact Us</Link></li>
          <li><Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link></li>
          <li><Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></li>
        </ul>
      </main>
    </div>
  );
}
