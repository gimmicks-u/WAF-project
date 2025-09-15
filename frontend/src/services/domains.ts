import api from '@/lib/api';

export interface Domain {
  id: string;
  user_id: string;
  domain: string;
  origin_ip: string;
  status: 'pending' | 'enabled' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface CreateDomainDto {
  domain: string;
  origin_ip: string;
}

export interface UpdateDomainDto {
  origin_ip?: string;
  status?: 'pending' | 'enabled' | 'disabled';
}

export interface DomainStatus {
  status: 'pending' | 'enabled' | 'disabled';
  message: string;
}

class DomainsService {
  async createDomain(data: CreateDomainDto): Promise<Domain> {
    const response = await api.post('/api/domains', data);
    return response.data;
  }

  async getDomains(): Promise<Domain[]> {
    const response = await api.get('/api/domains');
    return response.data;
  }

  async getDomain(id: string): Promise<Domain> {
    const response = await api.get(`/api/domains/${id}`);
    return response.data;
  }

  async getDomainStatus(id: string): Promise<DomainStatus> {
    const response = await api.get(`/api/domains/${id}/status`);
    return response.data;
  }

  async updateDomain(id: string, data: UpdateDomainDto): Promise<Domain> {
    const response = await api.put(`/api/domains/${id}`, data);
    return response.data;
  }

  async deleteDomain(id: string): Promise<void> {
    await api.delete(`/api/domains/${id}`);
  }
}

export default new DomainsService();
