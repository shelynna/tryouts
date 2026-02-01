
import { supabase } from '../supabaseClient';
import { realtimeService } from '../supabase/realtime';
import { dateUtils } from '../utils';
import { Cycle, CycleDates, CycleAccess, CyclePhase } from '../../types';

export class CycleService {
  async getCurrentCycle(): Promise<Cycle | null> {
    // 1. First, check for explicitly OPEN or LOCKED status cycles.
    // This allows admins to override dates by manually setting status.
    const { data: statusCycle } = await supabase
      .from('cycles')
      .select('*')
      .in('status', ['OPEN', 'LOCKED', 'active', 'locked']) 
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (statusCycle) {
       return this.mapCycle(statusCycle);
    }

    // 2. Fallback: If no cycle is explicitly open, check date ranges.
    // This handles auto-opening if a cron job isn't running.
    const now = new Date().toISOString();
    const { data: dateCycle } = await supabase
      .from('cycles')
      .select('*')
      .lte('start_date', now)
      .gte('delivery_date', now)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (dateCycle) {
        return this.mapCycle(dateCycle);
    }
    
    return null;
  }

  private mapCycle(data: any): Cycle {
      return {
            id: data.id,
            name: data.name,
            month_year: data.month_year || data.name,
            status: data.status as any,
            open_date: data.start_date,
            lock_date: data.end_date,
            // Fallback to end_date if standard_lock_date column is missing in DB
            standardLockDate: data.standard_lock_date || data.end_date, 
            paymentStartDate: data.start_date,
            paymentEndDate: data.end_date,
            lockDate: data.end_date,
            deliveryDate: data.delivery_date,
            assessmentDate: data.assessment_date || data.delivery_date,
            isActive: ['OPEN', 'LOCKED', 'active', 'locked'].includes(data.status)
      };
  }
  
  async getNextCycle(): Promise<Cycle | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .gt('start_date', now)
      .eq('status', 'CLOSED') 
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    return this.mapCycle(data);
  }
  
  async checkCycleAccess(userId: string, cycleId: string): Promise<CycleAccess> {
    try {
      const { data, error } = await supabase.rpc(
        'check_cycle_access',
        { p_user_id: userId, p_cycle_id: cycleId }
      );
      
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) throw new Error("No access data returned");

      return {
        canAccess: result.can_access,
        canAddToCart: result.can_add_to_cart,
        canPay: result.can_pay,
        phase: result.phase as CyclePhase,
        message: result.message,
      };
    } catch (error) {
      console.error('Error checking cycle access:', error);
      // Fail open for basic read access, but closed for cart to prevent errors
      return {
        canAccess: true, canAddToCart: false, canPay: false, phase: 'active', message: 'Verifying access...'
      };
    }
  }
  
  async getAllCycles(): Promise<Cycle[]> {
    const { data } = await supabase
        .from('cycles')
        .select('*')
        .order('start_date', { ascending: false });
        
    return (data || []).map((c: any) => this.mapCycle(c));
  }
  
  async updateCycleDates(cycleId: string, dates: Partial<CycleDates>): Promise<Cycle | null> {
    const updateData: any = {};
    if (dates.open_date) {
      updateData.start_date = new Date(dates.open_date).toISOString();
      updateData.month_year = dateUtils.getMonthYearFromDate(new Date(dates.open_date));
    }
    if (dates.lock_date) updateData.end_date = new Date(dates.lock_date).toISOString();
    if (dates.standard_lock_date) updateData.standard_lock_date = new Date(dates.standard_lock_date).toISOString(); 
    if (dates.assessment_date) updateData.assessment_date = new Date(dates.assessment_date).toISOString();
    
    const { data, error } = await supabase.from('cycles').update(updateData).eq('id', cycleId).select().single();
    if (error) throw error;
    return this.mapCycle(data);
  }
  
  async lockCycle(cycleId: string): Promise<void> {
    await supabase.rpc('lock_cycle_baskets'); // Ensure this RPC exists or use UPDATE
    // Fallback if RPC missing
    await supabase.from('cycles').update({ status: 'LOCKED' }).eq('id', cycleId);
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
        callback(this.mapCycle(payload));
    };
    return realtimeService.subscribeToCycle(cycleId, mapper as any);
  }
  
  subscribeToAllCycleUpdates(callback: (cycle: Cycle) => void) {
    const mapper = (payload: any) => {
        callback(this.mapCycle(payload));
    };
    return realtimeService.subscribeToAllCycles(mapper as any);
  }
}

export const cycleService = new CycleService();
