'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';

interface GoogleLoginButtonProps {
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleLoginButton({
  className,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const { data } = await api.post('/auth/google', {
          credential: response.credential,
        });
        login(data.user, data.token);
        router.push('/dashboard');
      } catch (err) {
        console.error('Google login failed', err);
      }
    };

    const loadGoogleScript = () => {
      if (document.getElementById('google-identity')) return;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-identity';
      script.onload = () => {
        if (!window.google) return;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.warn('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        const btn = document.getElementById('google-signin-button');
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [login, router]);

  return <div id='google-signin-button' className={className} />;
}
