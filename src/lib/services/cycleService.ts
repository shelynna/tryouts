
import { supabase } from '../supabaseClient';
import { realtimeService } from '../supabase/realtime';
import { dateUtils } from '../utils';
import { Cycle, CycleDates, CycleAccess, CyclePhase } from '../../types';

export class CycleService {
  async getCurrentCycle(): Promise<Cycle | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('cycles')
      .select(`
        id,
        name,
        month_year,
        status,
        open_date:start_date,
        lock_date:end_date,
        assessment_date,
        delivery_date,
        created_at
      `)
      .lte('start_date', now) 
      .gte('delivery_date', now)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting current cycle:', error);
      return null;
    }
    
    if (data) {
        return {
            id: data.id,
            name: data.name,
            month_year: data.month_year || data.name,
            status: data.status as any,
            open_date: data.open_date,
            lock_date: data.lock_date,
            paymentStartDate: data.open_date,
            paymentEndDate: data.lock_date,
            lockDate: data.lock_date,
            deliveryDate: data.delivery_date,
            assessmentDate: data.assessment_date || data.delivery_date,
            isActive: ['OPEN', 'LOCKED', 'active', 'locked'].includes(data.status)
        };
    }
    
    return null;
  }
  
  async getNextCycle(): Promise<Cycle | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('cycles')
      .select(`
        id, name, month_year, status,
        open_date:start_date,
        lock_date:end_date,
        assessment_date
      `)
      .gt('start_date', now)
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
        id: data.id,
        name: data.name,
        month_year: data.month_year || data.name,
        status: data.status as any,
        open_date: data.open_date,
        lock_date: data.lock_date,
        isActive: false
    } as Cycle;
  }
  
  async checkCycleAccess(userId: string, cycleId: string): Promise<CycleAccess> {
    try {
      const { data, error } = await supabase.rpc(
        'check_cycle_access',
        { p_user_id: userId, p_cycle_id: cycleId }
      );
      
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      
      return {
        canAccess: result.can_access,
        canAddToCart: result.can_add_to_cart,
        canPay: result.can_pay,
        phase: result.phase as CyclePhase,
        message: result.message,
      };
    } catch (error) {
      console.error('Error checking cycle access:', error);
      return {
        canAccess: false, canAddToCart: false, canPay: false, phase: 'no_access', message: 'Unable to determine access'
      };
    }
  }
  
  async getAllCycles(): Promise<Cycle[]> {
    const { data } = await supabase
        .from('cycles')
        .select('*, open_date:start_date, lock_date:end_date')
        .order('start_date', { ascending: false });
        
    return (data || []).map((c: any) => ({
        ...c,
        paymentStartDate: c.open_date,
        lockDate: c.lock_date
    })) as unknown as Cycle[];
  }
  
  async updateCycleDates(cycleId: string, dates: Partial<CycleDates>): Promise<Cycle | null> {
    const updateData: any = {};
    if (dates.open_date) {
      updateData.start_date = new Date(dates.open_date).toISOString();
      updateData.month_year = dateUtils.getMonthYearFromDate(new Date(dates.open_date));
    }
    if (dates.lock_date) updateData.end_date = new Date(dates.lock_date).toISOString();
    if (dates.assessment_date) updateData.assessment_date = new Date(dates.assessment_date).toISOString();
    
    const { data, error } = await supabase.from('cycles').update(updateData).eq('id', cycleId).select().single();
    if (error) throw error;
    return data as any;
  }
  
  async lockCycle(cycleId: string): Promise<void> {
    await supabase.rpc('lock_cycle_baskets');
  }
  
  getCurrentPhase(cycle: Cycle): CyclePhase {
    const now = new Date();
    const open = new Date(cycle.open_date || cycle.paymentStartDate || now);
    const lock = new Date(cycle.lock_date || cycle.lockDate || now);
    const assess = new Date(cycle.assessmentDate || cycle.deliveryDate || now);
    
    if (now < open) return 'upcoming';
    if (now >= open && now <= lock) return 'active';
    if (now > lock && now <= assess) return 'locked';
    return 'assessing';
  }
  
  getTimeUntilLock(cycle: Cycle): { days: number; hours: number; minutes: number } {
    const now = new Date();
    const lockDate = new Date(cycle.lock_date || cycle.lockDate || now);
    const diffMs = lockDate.getTime() - now.getTime();
    if(diffMs < 0) return { days: 0, hours: 0, minutes: 0 };
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  }
  
  subscribeToCycleUpdates(cycleId: string, callback: (cycle: Cycle) => void) {
    const mapper = (payload: any) => {
        const mapped: Cycle = {
            id: payload.id,
            name: payload.name,
            month_year: payload.month_year,
            status: payload.status,
            open_date: payload.start_date,
            lock_date: payload.end_date,
            paymentStartDate: payload.start_date,
            lockDate: payload.end_date,
            isActive: payload.status === 'OPEN' || payload.status === 'active'
        };
        callback(mapped);
    };
    return realtimeService.subscribeToCycle(cycleId, mapper as any);
  }
  
  subscribeToAllCycleUpdates(callback: (cycle: Cycle) => void) {
    return realtimeService.subscribeToAllCycles(callback as any);
  }
}

export const cycleService = new CycleService();
