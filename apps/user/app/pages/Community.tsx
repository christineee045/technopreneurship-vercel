import { Link } from "react-router";
import { Header } from "../components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Community</h1>
        <p className="text-muted-foreground mb-8">
          Learn how to borrow responsibly, stay safe, and contribute to a trusted lending network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Step-by-step borrowing and listing flow.</p>
              <Link to="/how-it-works" className="text-sm text-primary hover:underline">Read guide</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Best practices for handoff, checks, and communication.</p>
              <Link to="/safety-guidelines" className="text-sm text-primary hover:underline">View safety tips</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Quick answers on deposits, returns, and rules.</p>
              <Link to="/faq" className="text-sm text-primary hover:underline">Open FAQ</Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
