
import { supabase } from '../../supabaseClient';
import { AdminStats } from '../../../types';

export const getAdminStats = async (): Promise<AdminStats> => {
    const { data: baskets, error } = await supabase
        .from('baskets')
        .select(`
            id, total_price, amount_paid, status, created_at,
            items:basket_items (
                quantity, total_price,
                product:products (id, name, category)
            )
        `);
    
    if (error || !baskets) {
        return {
            projectedRevenue: 0, collectedRevenue: 0, completionRate: 0, totalOrders: 0, avgOrderValue: 0,
            salesByCategory: [], revenueTrend: [], topProducts: [], statusBreakdown: {}
        };
    }
    
    const totalOrders = baskets.length;
    const projectedRevenue = baskets.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
    const collectedRevenue = baskets.reduce((sum: number, b: any) => sum + (b.amount_paid || 0), 0);
    const avgOrderValue = totalOrders > 0 ? projectedRevenue / totalOrders : 0;
    const completed = baskets.filter((b: any) => b.status === 'PAID' || b.status === 'COLLECTED' || b.status === 'DELIVERED').length;
    const completionRate = totalOrders > 0 ? (completed / totalOrders) * 100 : 0;

    const statusBreakdown: Record<string, number> = {};
    baskets.forEach((b: any) => {
        statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
    });

    const categoryMap: Record<string, { value: number, count: number }> = {};
    const productMap: Record<string, { name: string, sold: number, revenue: number }> = {};

    baskets.forEach((b: any) => {
        b.items.forEach((item: any) => {
            if (!item.product) return;
            const cat = item.product.category || 'Uncategorized';
            const val = item.total_price || 0;
            const qty = item.quantity || 0;

            if (!categoryMap[cat]) categoryMap[cat] = { value: 0, count: 0 };
            categoryMap[cat].value += val;
            categoryMap[cat].count += qty;

            const pid = item.product.id;
            if (!productMap[pid]) productMap[pid] = { name: item.product.name, sold: 0, revenue: 0 };
            productMap[pid].sold += qty;
            productMap[pid].revenue += val;
        });
    });

    const salesByCategory = Object.keys(categoryMap).map(cat => ({
        category: cat,
        value: categoryMap[cat].value,
        count: categoryMap[cat].count
    })).sort((a, b) => b.value - a.value);

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    const trendMap: Record<string, number> = {};
    const today = new Date();
    for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trendMap[key] = 0; 
    }

    baskets.forEach((b: any) => {
        const dateKey = new Date(b.created_at).toISOString().split('T')[0];
        if (trendMap[dateKey] !== undefined) {
            trendMap[dateKey] += (b.total_price || 0);
        }
    });

    const revenueTrend = Object.keys(trendMap).map(date => ({
        date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }),
        amount: trendMap[date]
    }));

    return {
        projectedRevenue, collectedRevenue, completionRate, totalOrders, avgOrderValue,
        salesByCategory, revenueTrend, topProducts, statusBreakdown
    };
};
