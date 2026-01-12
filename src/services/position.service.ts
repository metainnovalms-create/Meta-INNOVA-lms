import { CustomPosition, CreatePositionRequest, UpdatePositionRequest, SystemAdminFeature } from '@/types/permissions';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface PositionRow {
  id: string;
  position_name: string;
  display_name: string;
  description: string | null;
  visible_features: string[];
  is_ceo_position: boolean | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

const toCustomPosition = (row: PositionRow, userCount = 0): CustomPosition => ({
  id: row.id,
  position_name: row.position_name,
  display_name: row.display_name,
  description: row.description || '',
  visible_features: row.visible_features as SystemAdminFeature[],
  is_ceo_position: row.is_ceo_position || false,
  created_at: row.created_at,
  created_by: row.created_by || 'system',
  user_count: userCount
});

const positionsTable = () => supabase.from('positions' as any);

export const positionService = {
  getAllPositions: async (): Promise<CustomPosition[]> => {
    const { data: positions, error } = await positionsTable().select('*').order('created_at', { ascending: true });
    if (error) throw error;
    if (!positions) return [];

    const { data: profiles } = await supabase.from('profiles').select('position_id');
    const userCounts: Record<string, number> = {};
    profiles?.forEach((p: any) => {
      if (p.position_id) userCounts[p.position_id] = (userCounts[p.position_id] || 0) + 1;
    });

    return (positions as unknown as PositionRow[]).map(pos => toCustomPosition(pos, userCounts[pos.id] || 0));
  },

  getPositionById: async (id: string): Promise<CustomPosition | null> => {
    const { data: position, error } = await positionsTable().select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!position) return null;
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('position_id', id);
    return toCustomPosition(position as unknown as PositionRow, count || 0);
  },

  createPosition: async (data: CreatePositionRequest): Promise<CustomPosition> => {
    const { data: session } = await supabase.auth.getSession();
    const { data: newPosition, error } = await positionsTable().insert({
      position_name: data.position_name,
      display_name: data.display_name || data.position_name,
      description: data.description || '',
      visible_features: data.visible_features,
      is_ceo_position: false,
      created_by: session?.session?.user?.id || null
    }).select().single();
    if (error) throw error;
    return toCustomPosition(newPosition as unknown as PositionRow, 0);
  },

  updatePosition: async (id: string, data: UpdatePositionRequest): Promise<void> => {
    const { data: position, error: fetchError } = await positionsTable().select('*').eq('id', id).single();
    if (fetchError) throw fetchError;
    if (!position) throw new Error('Position not found');
    const pos = position as unknown as PositionRow;

    if (pos.is_ceo_position) {
      if (data.position_name && data.position_name !== pos.position_name) throw new Error('Cannot rename CEO position');
      let features = data.visible_features || (pos.visible_features as SystemAdminFeature[]);
      // Enforce position_management for CEO (non-negotiable)
      if (!features.includes('position_management')) features = [...features, 'position_management'];
      const { error } = await positionsTable().update({ display_name: data.display_name || pos.display_name, description: data.description || pos.description, visible_features: features }).eq('id', id);
      if (error) throw error;
      return;
    }
    
    const updateData: Record<string, unknown> = {};
    if (data.position_name !== undefined) updateData.position_name = data.position_name;
    if (data.display_name !== undefined) updateData.display_name = data.display_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.visible_features !== undefined) updateData.visible_features = data.visible_features;
    const { error } = await positionsTable().update(updateData).eq('id', id);
    if (error) throw error;
  },

  deletePosition: async (id: string): Promise<void> => {
    const { data: position, error: fetchError } = await positionsTable().select('is_ceo_position').eq('id', id).single();
    if (fetchError) throw fetchError;
    if (!position) throw new Error('Position not found');
    if ((position as unknown as PositionRow).is_ceo_position) throw new Error('Cannot delete CEO position');
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('position_id', id);
    if (count && count > 0) throw new Error(`Cannot delete position with ${count} assigned users`);
    const { error } = await positionsTable().delete().eq('id', id);
    if (error) throw error;
  },

  getUsersByPosition: async (positionId: string): Promise<User[]> => {
    const { data: profiles, error } = await supabase.from('profiles').select('*').eq('position_id', positionId);
    if (error) throw error;
    return (profiles || []).map((p: any) => ({ id: p.id, email: p.email, name: p.name, avatar: p.avatar || undefined, role: 'system_admin' as const, position_id: p.position_id || undefined, position_name: p.position_name || undefined, is_ceo: p.is_ceo || false, institution_id: p.institution_id || undefined, created_at: p.created_at || '' }));
  },

  assignUserToPosition: async (userId: string, positionId: string): Promise<void> => {
    const { data: position, error: posError } = await positionsTable().select('position_name, is_ceo_position').eq('id', positionId).single();
    if (posError) throw posError;
    if (!position) throw new Error('Position not found');
    const pos = position as unknown as PositionRow;
    const { error } = await supabase.from('profiles').update({ position_id: positionId, position_name: pos.position_name, is_ceo: pos.is_ceo_position || false }).eq('id', userId);
    if (error) throw error;
  },

  getPositionFeatures: async (positionId: string): Promise<SystemAdminFeature[]> => {
    const { data: position, error } = await positionsTable().select('visible_features').eq('id', positionId).maybeSingle();
    if (error) throw error;
    return ((position as unknown as PositionRow)?.visible_features as SystemAdminFeature[]) || [];
  }
};

let positionsCache: CustomPosition[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export const getPositionByIdSync = (id: string): CustomPosition | undefined => {
  if (!positionsCache || Date.now() - cacheTimestamp > CACHE_TTL) return undefined;
  return positionsCache.find(p => p.id === id);
};

export const preloadPositionsCache = async (): Promise<void> => {
  try { positionsCache = await positionService.getAllPositions(); cacheTimestamp = Date.now(); } catch (error) { console.error('Failed to preload positions cache:', error); }
};

export const clearPositionsCache = (): void => { positionsCache = null; cacheTimestamp = 0; };
