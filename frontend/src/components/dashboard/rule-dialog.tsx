"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { WAFRule } from '@/lib/types';
import { crsHelp, ruleTemplates } from '@/lib/rule-templates';
import { useAuthStore } from '@/lib/auth-store';

export interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: WAFRule | null;
  onSave: (rule: Partial<WAFRule>) => void;
  mode: 'create' | 'edit';
}

export default function RuleDialog({ open, onOpenChange, rule, onSave, mode }: RuleDialogProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    content: string;
    isActive: boolean;
  }>({
    name: rule?.name || '',
    description: rule?.description || '',
    content: rule?.content || '',
    isActive: rule?.isActive ?? true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: rule?.name || '',
        description: rule?.description || '',
        content: rule?.content || '',
        isActive: rule?.isActive ?? true,
      });
    }
  }, [open, rule]);

  const userId = useAuthStore((s) => s.user?.id);
  const idHint = useMemo(() => {
    if (!userId) return '';
    try {
      const base = 1200000 + Number(BigInt(userId)) * 1000;
      return `권장 Rule ID 범위: ${base} ~ ${base + 999} (자동 부여됨)`;
    } catch {
      return '권장 Rule ID는 시스템에서 자동 부여됩니다.';
    }
  }, [userId]);

  const handleSave = () => {
    onSave({
      ...formData,
      id: rule?.id,
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-[760px] rounded-lg border bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? '새 규칙 생성' : '규칙 수정'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            사용자별 커스텀 규칙을 추가/수정할 수 있습니다. {idHint}
          </p>
        </div>

        <div className="grid gap-6 py-2 grid-cols-1 md:grid-cols-5">
          <div className="md:col-span-3 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">규칙 이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="규칙 이름 입력..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="이 규칙이 무엇을 하는지 설명..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">규칙 내용(ModSecurity)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="SecRule ... &quot;phase:1,deny,status:403,msg:'설명'&quot;"
                className="min-h-[160px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">템플릿</h4>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {ruleTemplates.map((tpl, idx) => (
                  <div key={idx} className="border rounded p-2">
                    <div className="text-sm font-medium">{tpl.name}</div>
                    <div className="text-xs text-slate-600">{tpl.description}</div>
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, content: tpl.content })}>삽입</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">CRS 문법 가이드</h4>
              <div className="space-y-2 text-xs text-slate-700 max-h-64 overflow-auto pr-1">
                {crsHelp.sections.map((sec, i) => (
                  <div key={i}>
                    <div className="font-semibold">• {sec.title}</div>
                    <div className="whitespace-pre-wrap">{sec.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? '생성' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
