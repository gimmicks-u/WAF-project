'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import GoogleLoginButton from '@/components/auth/google-login-button';
import { useAuthStore } from '@/lib/auth-store';
import { Shield, Lock, Activity, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Shield,
      title: 'Advanced Security',
      description:
        'OWASP ModSecurity CRS protection against common web attacks',
    },
    {
      icon: Lock,
      title: 'Custom Rules',
      description:
        'Create and manage custom security rules tailored to your application',
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description:
        'Monitor threats and attacks in real-time with detailed logs',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description:
        'Comprehensive analytics and reporting for security insights',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-16'>
        {/* Hero Section */}
        <div className='text-center max-w-4xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6'>
            <Shield className='w-4 h-4' />
            Enterprise-Grade Web Security
          </div>

          <h1 className='text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight'>
            Modern Web Application
            <br />
            <span className='text-blue-600'>Firewall Solution</span>
          </h1>

          <p className='text-xl text-slate-600 mb-8 max-w-2xl mx-auto'>
            Protect your web applications with our advanced WAF powered by
            Nginx, ModSecurity, and OWASP Core Rule Set. <br />
            Easy to use, enterprise-ready security.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <GoogleLoginButton className='w-full sm:w-auto' />
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='border-slate-200 hover:shadow-lg transition-shadow'
            >
              <CardHeader className='pb-4'>
                <div className='w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4'>
                  <feature.icon className='w-6 h-6 text-blue-600' />
                </div>
                <CardTitle className='text-lg text-slate-900'>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-slate-600'>
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
