"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WAFRule } from "@/lib/types";
import { crsHelp, ruleTemplates } from "@/lib/rule-templates";
import { useAuthStore } from "@/lib/auth-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: WAFRule | null;
  onSave: (rule: Partial<WAFRule>) => void;
  mode: "create" | "edit";
}

function RuleDialog(props: Props) {
  const { open, onOpenChange, rule, onSave, mode } = props;
  
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setName(rule?.name || "");
      setDescription(rule?.description || "");
      setContent(rule?.content || "");
      setIsActive(rule?.isActive ?? true);
    }
  }, [open, rule]);

  const userId = useAuthStore((s) => s.user?.id);
  
  const idHint = React.useMemo(() => {
    if (!userId) return "";
    try {
      const base = 1200000 + Number(BigInt(userId)) * 1000;
      return `권장 Rule ID 범위: ${base} ~ ${base + 999} (자동 부여됨)`;
    } catch {
      return "권장 Rule ID는 시스템에서 자동 부여됩니다.";
    }
  }, [userId]);

  const handleSave = () => {
    onSave({
      name,
      description,
      content,
      isActive,
      id: rule?.id,
    });
    onOpenChange(false);
  };

  const insertTemplate = (templateContent: string) => {
    setContent(templateContent);
  };

  if (!open) {
    return null;
  }

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 flex items-center justify-center" },
    React.createElement("div", {
      className: "absolute inset-0 bg-black/50",
      onClick: () => onOpenChange(false),
    }),
    React.createElement(
      "div",
      { className: "relative z-10 w-full max-w-[760px] rounded-lg border bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto" },
      React.createElement(
        "div",
        { className: "mb-4" },
        React.createElement(
          "h2",
          { className: "text-lg font-semibold" },
          mode === "create" ? "새 규칙 생성" : "규칙 수정"
        ),
        React.createElement(
          "p",
          { className: "text-sm text-slate-600 mt-1" },
          "사용자별 커스텀 규칙을 추가/수정할 수 있습니다. ",
          idHint
        )
      ),
      React.createElement(
        "div",
        { className: "grid gap-6 py-2 grid-cols-1 md:grid-cols-5" },
        React.createElement(
          "div",
          { className: "md:col-span-3 grid gap-4" },
          React.createElement(
            "div",
            { className: "grid gap-2" },
            React.createElement(Label, { htmlFor: "name" }, "규칙 이름"),
            React.createElement(Input, {
              id: "name",
              value: name,
              onChange: (e: any) => setName(e.target.value),
              placeholder: "규칙 이름 입력...",
            })
          ),
          React.createElement(
            "div",
            { className: "grid gap-2" },
            React.createElement(Label, { htmlFor: "description" }, "설명"),
            React.createElement(Textarea, {
              id: "description",
              value: description,
              onChange: (e: any) => setDescription(e.target.value),
              placeholder: "이 규칙이 무엇을 하는지 설명...",
              className: "min-h-[80px]",
            })
          ),
          React.createElement(
            "div",
            { className: "grid gap-2" },
            React.createElement(Label, { htmlFor: "content" }, "규칙 내용(ModSecurity)"),
            React.createElement(Textarea, {
              id: "content",
              value: content,
              onChange: (e: any) => setContent(e.target.value),
              placeholder: "SecRule REQUEST_URI \"@contains admin\" \"phase:1,deny,status:403,msg:'차단'\"",
              className: "min-h-[160px] font-mono text-sm",
            })
          ),
          React.createElement(
            "div",
            { className: "flex items-center space-x-2" },
            React.createElement(Checkbox, {
              id: "isActive",
              checked: isActive,
              onCheckedChange: (checked: any) => setIsActive(checked === true),
            }),
            React.createElement(Label, { htmlFor: "isActive" }, "활성화")
          )
        ),
        React.createElement(
          "div",
          { className: "md:col-span-2 space-y-4" },
          React.createElement(
            "div",
            null,
            React.createElement("h4", { className: "text-sm font-medium mb-2" }, "템플릿"),
            React.createElement(
              "div",
              { className: "space-y-2 max-h-64 overflow-auto pr-1" },
              ruleTemplates.map((tpl, idx) =>
                React.createElement(
                  "div",
                  { key: idx, className: "border rounded p-2" },
                  React.createElement("div", { className: "text-sm font-medium" }, tpl.name),
                  React.createElement("div", { className: "text-xs text-slate-600" }, tpl.description),
                  React.createElement(
                    "div",
                    { className: "flex justify-end mt-2" },
                    React.createElement(
                      Button,
                      {
                        size: "sm",
                        variant: "outline",
                        onClick: () => insertTemplate(tpl.content),
                      },
                      "삽입"
                    )
                  )
                )
              )
            )
          ),
          React.createElement(
            "div",
            null,
            React.createElement("h4", { className: "text-sm font-medium mb-2" }, "CRS 문법 가이드"),
            React.createElement(
              "div",
              { className: "space-y-2 text-xs text-slate-700 max-h-64 overflow-auto pr-1" },
              crsHelp.sections.map((sec, i) =>
                React.createElement(
                  "div",
                  { key: i },
                  React.createElement("div", { className: "font-semibold" }, "• " + sec.title),
                  React.createElement("div", { className: "whitespace-pre-wrap" }, sec.content)
                )
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "mt-4 flex justify-end gap-2" },
        React.createElement(
          Button,
          { variant: "outline", onClick: () => onOpenChange(false) },
          "취소"
        ),
        React.createElement(
          Button,
          { onClick: handleSave },
          mode === "create" ? "생성" : "저장"
        )
      )
    )
  );
}

export default RuleDialog;