'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import { Chrome } from 'lucide-react';

interface GoogleLoginButtonProps {
  className?: string;
}

export default function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const { mockGoogleLogin } = useAuthStore();

  const handleGoogleLogin = () => {
    // In a real implementation, this would redirect to Google OAuth
    // For demo purposes, we'll use mock login
    mockGoogleLogin();
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      size="lg"
      className={`gap-2 ${className}`}
    >
      <Chrome className="w-5 h-5" />
      Continue with Google
    </Button>
  );
}