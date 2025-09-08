'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import RuleDialog from '@/components/dashboard/rule-dialog';
import { mockRules } from '@/lib/mock-data';
import { WAFRule } from '@/lib/types';
import { Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function RulesPage() {
  const [rules, setRules] = useState<WAFRule[]>(mockRules);
  const [filteredRules, setFilteredRules] = useState<WAFRule[]>(mockRules);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WAFRule | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(term.toLowerCase()) ||
        rule.description.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredRules(filtered);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditRule = (rule: WAFRule) => {
    setEditingRule(rule);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSaveRule = (ruleData: Partial<WAFRule>) => {
    if (dialogMode === 'create') {
      const newRule: WAFRule = {
        id: `rule-${Date.now()}`,
        name: ruleData.name || '',
        description: ruleData.description || '',
        content: ruleData.content || '',
        isActive: ruleData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ruleType: 'custom',
      };
      const updatedRules = [...rules, newRule];
      setRules(updatedRules);
      setFilteredRules(updatedRules.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else if (editingRule) {
      const updatedRules = rules.map((rule) =>
        rule.id === editingRule.id
          ? { ...rule, ...ruleData, updatedAt: new Date() }
          : rule
      );
      setRules(updatedRules);
      setFilteredRules(updatedRules.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    setRules(updatedRules);
    setFilteredRules(updatedRules.filter(rule => 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    ));
    setSelectedRules(selectedRules.filter((id) => id !== ruleId));
  };

  const handleToggleRuleStatus = (ruleId: string) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive, updatedAt: new Date() } : rule
    );
    setRules(updatedRules);
    setFilteredRules(updatedRules.filter(rule => 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

  const handleSelectRule = (ruleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRules([...selectedRules, ruleId]);
    } else {
      setSelectedRules(selectedRules.filter((id) => id !== ruleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRules(filteredRules.map((rule) => rule.id));
    } else {
      setSelectedRules([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Security Rules</h1>
          <p className="text-slate-600 mt-1">
            Manage your custom WAF rules and OWASP Core Rule Set configuration
          </p>
        </div>
        <Button onClick={handleCreateRule} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Rules</p>
                <p className="text-2xl font-bold text-slate-900">
                  {rules.filter((rule) => rule.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Custom Rules</p>
                <p className="text-2xl font-bold text-slate-900">
                  {rules.filter((rule) => rule.ruleType === 'custom').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Inactive Rules</p>
                <p className="text-2xl font-bold text-slate-900">
                  {rules.filter((rule) => !rule.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">All Rules</CardTitle>
              <CardDescription>
                Showing {filteredRules.length} of {rules.length} rules
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="flex items-center gap-4 py-2 px-4 bg-slate-50 rounded-lg">
              <Checkbox
                checked={selectedRules.length === filteredRules.length && filteredRules.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
                <div className="col-span-3">Name</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Updated</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Rows */}
            {filteredRules.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No rules found matching your search criteria.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 py-3 px-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Checkbox
                    checked={selectedRules.includes(rule.id)}
                    onCheckedChange={(checked) => handleSelectRule(rule.id, checked as boolean)}
                  />
                  <div className="flex-1 grid grid-cols-12 gap-4">
                    <div className="col-span-3">
                      <h4 className="font-medium text-slate-900">{rule.name}</h4>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${
                          rule.ruleType === 'custom'
                            ? 'border-blue-200 text-blue-700'
                            : 'border-purple-200 text-purple-700'
                        }`}
                      >
                        {rule.ruleType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-slate-600">{rule.description}</p>
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() => handleToggleRuleStatus(rule.id)}
                        className="flex items-center gap-2"
                      >
                        <Badge
                          variant={rule.isActive ? 'default' : 'secondary'}
                          className={
                            rule.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'hover:bg-slate-200'
                          }
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">
                        {format(rule.updatedAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {rule.ruleType === 'custom' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={handleSaveRule}
        mode={dialogMode}
      />
    </div>
  );
}