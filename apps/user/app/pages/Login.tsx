import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser, setUserToken } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (loginMode === 'admin') {
      setAdminLoading(true);
      try {
        const result = await loginUser(email, password);

        if (!result.user.isAdmin) {
          setError('This account is not an admin account');
          return;
        }

        setUserToken(result.token);
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminEmail', result.user.email);
        navigate('/admin');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid admin credentials';
        setError(message);
      } finally {
        setAdminLoading(false);
      }
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-semibold">Lendly</span>
          </Link>
          <h1 className="text-3xl font-semibold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            {loginMode === 'admin'
              ? 'Log in to your admin account to manage the platform'
              : 'Log in to your account to continue'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              {loginMode === 'admin'
                ? 'Enter your admin credentials to continue'
                : 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant={loginMode === 'user' ? 'default' : 'outline'}
                onClick={() => {
                  setLoginMode('user');
                  setError('');
                }}
              >
                User Login
              </Button>
              <Button
                type="button"
                variant={loginMode === 'admin' ? 'default' : 'outline'}
                onClick={() => {
                  setLoginMode('admin');
                  setError('');
                }}
              >
                Admin Login
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={loginMode === 'admin' ? 'admin@platform.com' : 'you@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || adminLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || adminLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || adminLoading}
              >
                {loginMode === 'admin'
                  ? adminLoading
                    ? 'Signing in...'
                    : 'Sign In as Admin'
                  : isLoading
                    ? 'Logging in...'
                    : 'Log In'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {loginMode === 'admin'
                  ? 'Demo: admin@platform.com / admin123'
                  : 'Demo: Use any email/password to login'}
              </div>
            </form>

            {loginMode === 'user' && (
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
