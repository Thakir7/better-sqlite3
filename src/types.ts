export type Role = 'admin' | 'nursery' | 'volunteer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  location?: string;
  status: string;
}

export interface Seedling {
  id: number;
  nursery_id: number;
  nursery_name?: string;
  type: string;
  count: number;
  description: string;
  requirements: string;
  image_url: string;
  status: string;
  created_at: string;
}

export interface VolunteerRequest {
  id: number;
  volunteer_id: number;
  volunteer_name?: string;
  seedling_id: number;
  seedling_type?: string;
  nursery_name?: string;
  count: number;
  location: string;
  status: 'pending_nursery' | 'approved_nursery' | 'rejected_nursery' | 'picked_up' | 'proof_uploaded' | 'approved_admin' | 'rejected_admin';
  rejection_reason?: string;
  created_at: string;
}

export interface Proof {
  id: number;
  request_id: number;
  before_image_url: string;
  after_image_url: string;
  notes: string;
  volunteer_name?: string;
  seedling_type?: string;
  count?: number;
  volunteer_id?: number;
}

export interface Stats {
  totalSeedlings: number;
  plantedSeedlings: number;
  totalVolunteers: number;
  totalHours: number;
  topVolunteers: { name: string; hours: number }[];
}
