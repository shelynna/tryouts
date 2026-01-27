
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
            const [
                settingsData, productsData, topUpsData, procurementData, ordersData, statsData
            ] = await Promise.all([
                API.getSettings(),
                API.getProducts({ isAdmin: true }),
                API.getTopUpRequests(),
                API.getProcurementList(),
                API.getAllBaskets(),
                API.getAdminStats()
            ]);

            setSettings(settingsData);
            setProducts(productsData);
            setTopUps(topUpsData);
            setProcurementList(procurementData);
            setAllOrders(ordersData);
            setStats(statsData);
        } catch (err: any) {
            Logger.error('Failed to refresh admin data', err);
            throw err;
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
