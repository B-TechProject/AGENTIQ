import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiPost, ApiError } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Button, Card, Field, Input, Alert } from '@/components/ui';
import type { User } from '@/types';

/** docs/04_App_UI.md §7 — centred 400px card, clear error text. */
export function LoginPage({ signup = false }: { signup?: boolean }) {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const path = signup ? '/auth/register' : '/auth/login';
      const body = signup ? form : { email: form.email, password: form.password };
      const data = await apiPost<{ user: User; token: string }>(path, body);
      signIn(data.user, data.token);
      navigate(params.get('next') ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid min-h-screen place-items-center bg-surface-2 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid size-7 place-items-center rounded-[4px] bg-primary text-xs font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">AGENTIQ</span>
        </div>

        <Card className="p-6">
          <h1 className="t-h1 mb-1">{signup ? 'Create an account' : 'Sign in'}</h1>
          <p className="t-small mb-5 text-ink-muted">
            Executed API tests, real security evidence, an audited tool layer.
          </p>

          {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}

          <form onSubmit={submit} className="space-y-4">
            {signup && (
              <Field label="Name" htmlFor="displayName" required>
                <Input id="displayName" value={form.displayName} onChange={set('displayName')} required />
              </Field>
            )}
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" autoComplete="email"
                value={form.email} onChange={set('email')} required />
            </Field>
            <Field label="Password" htmlFor="password" required
              hint={signup ? 'At least 8 characters.' : undefined}>
              <Input id="password" type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                value={form.password} onChange={set('password')} required />
            </Field>
            {signup && (
              <Field label="Confirm password" htmlFor="confirmPassword" required>
                <Input id="confirmPassword" type="password" autoComplete="new-password"
                  value={form.confirmPassword} onChange={set('confirmPassword')} required />
              </Field>
            )}

            <Button type="submit" loading={busy} className="w-full">
              {signup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="t-small mt-5 text-center text-ink-muted">
            {signup ? 'Already have an account? ' : "Don't have an account? "}
            <Link to={signup ? '/login' : '/signup'} className="font-medium text-accent hover:underline">
              {signup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
