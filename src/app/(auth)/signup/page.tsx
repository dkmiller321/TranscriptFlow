'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/lib/utils/constants';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <AnimatedBackground />
        <GlassCard glow className="w-full max-w-md p-8 animate-scale-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">
              <span className="gradient-text">Check your email</span>
            </h1>
            <p className="text-muted-foreground">
              We&apos;ve sent a confirmation link to {email}. Please check your
              inbox and click the link to activate your account.
            </p>
          </div>
          <Link href={ROUTES.LOGIN}>
            <GradientButton variant="secondary" className="w-full">
              Back to login
            </GradientButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <AnimatedBackground />
      <GlassCard glow className="w-full max-w-md p-8 animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            <span className="gradient-text">Create account</span>
          </h1>
          <p className="text-muted-foreground">Start extracting transcripts today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Must be at least 6 characters"
            required
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <GradientButton type="submit" className="w-full" loading={isLoading}>
            Create Account
          </GradientButton>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
