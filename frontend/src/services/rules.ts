import api from '@/lib/api';

export interface RuleDTO {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  content: string;
  isActive: boolean;
  ruleType: string;
  createdAt: string;
  updatedAt: string;
}

export const rulesService = {
  list: async () => {
    const { data } = await api.get<RuleDTO[]>('/api/rules');
    return data;
  },
  create: async (payload: Partial<RuleDTO>) => {
    // map camelCase to snake_case for backend DTO
    const body: any = {
      name: payload.name,
      description: payload.description,
      content: payload.content,
      is_active: payload.isActive,
    };
    const { data } = await api.post<RuleDTO>('/api/rules', body);
    return data;
  },
  update: async (id: string, payload: Partial<RuleDTO>) => {
    const body: any = {
      name: payload.name,
      description: payload.description,
      content: payload.content,
      is_active: payload.isActive,
    };
    const { data } = await api.put<RuleDTO>(`/api/rules/${id}`, body);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/api/rules/${id}`);
  },
};
