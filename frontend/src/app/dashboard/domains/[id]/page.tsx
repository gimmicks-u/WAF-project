'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import domainsService, { Domain, UpdateDomainDto } from '@/services/domains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

export default function DomainDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [originIp, setOriginIp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      setError(null);
      try {
        const d = await domainsService.getDomain(params.id);
        setDomain(d);
        setOriginIp(d.origin_ip);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push('/');
          return;
        }
        setError('Failed to load domain');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: UpdateDomainDto = {};
      if (originIp && originIp !== domain.origin_ip) {
        payload.origin_ip = originIp;
      }
      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to save');
        setSaving(false);
        return;
      }
      const updated = await domainsService.updateDomain(domain.id, payload);
      setDomain(updated);
      setSuccess('Domain updated successfully');
      // 돌아가고 싶으면 아래 주석 해제
      // router.push('/dashboard/domains');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update domain');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/domains')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Domains
        </Button>
        <div className="text-red-600">Domain not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/domains')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Domains
      </Button>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Edit Domain</CardTitle>
          <CardDescription>Update origin server configuration for your domain</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" value={domain.domain} readOnly className="mt-1" />
            </div>

            <div>
              <Label htmlFor="origin_ip">Origin Server IP</Label>
              <Input
                id="origin_ip"
                value={originIp}
                onChange={(e) => setOriginIp(e.target.value)}
                placeholder="11.22.33.44"
                className="mt-1"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-2" disabled={saving}>
                <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
