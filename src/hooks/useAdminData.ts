
import { useState, useEffect, useCallback } from 'react';
import { API } from '../lib/api';
import { Logger } from '../lib/logger';
import { ProcurementItem, Product, SystemSettings, TopUpRequest, AdminBasketEntry, AdminStats } from '../types';

export const useAdminData = (isAdmin: boolean) => {
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [topUps, setTopUps] = useState<TopUpRequest[]>([]);
    const [procurementList, setProcurementList] = useState<ProcurementItem[]>([]);
    const [allOrders, setAllOrders] = useState<AdminBasketEntry[]>([]);
    
    const [stats, setStats] = useState<AdminStats>({ 
        projectedRevenue: 0, collectedRevenue: 0, completionRate: 0, totalOrders: 0, avgOrderValue: 0,
        salesByCategory: [], revenueTrend: [], topProducts: [], statusBreakdown: {}
    });

    const refreshAdminData = useCallback(async () => {
        if (!isAdmin) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            // 1. Fetch Settings First (Critical)
            // If this fails, we try to proceed with defaults handled in systemService
            const settingsData = await API.getSettings(true);
            setSettings(settingsData);

            // 2. Fetch other data independently using allSettled
            // This ensures if TopUps fail (due to schema issues), Products still load.
            const results = await Promise.allSettled([
                API.getProducts({ isAdmin: true }),
                API.getTopUpRequests(),
                API.getProcurementList(),
                API.getAllBaskets(),
                API.getAdminStats()
            ]);

            // 3. Safely Unwrap Results
            setProducts(results[0].status === 'fulfilled' ? results[0].value : []);
            setTopUps(results[1].status === 'fulfilled' ? results[1].value : []);
            setProcurementList(results[2].status === 'fulfilled' ? results[2].value : []);
            setAllOrders(results[3].status === 'fulfilled' ? results[3].value : []);
            setStats(results[4].status === 'fulfilled' ? results[4].value : {
                projectedRevenue: 0, collectedRevenue: 0, completionRate: 0, totalOrders: 0, avgOrderValue: 0,
                salesByCategory: [], revenueTrend: [], topProducts: [], statusBreakdown: {}
            });

            // 4. Log Warnings for Partial Failures to help debugging
            results.forEach((r, i) => {
                if (r.status === 'rejected') {
                    const endpoints = ['Products', 'TopUps', 'Procurement', 'Orders', 'Stats'];
                    console.warn(`[SMM Admin] Failed to load ${endpoints[i]}:`, r.reason);
                }
            });

        } catch (err: any) {
            Logger.error('Critical: Failed to refresh admin data', err);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        refreshAdminData();
    }, [refreshAdminData]);

    return {
        isLoading,
        settings,
        products,
        topUps,
        procurementList,
        allOrders,
        stats,
        refreshAdminData
    };
};
