import { supabase } from '../supabaseClient';
import { Product } from '../../types';

export const getProducts = async (params?: { isAdmin?: boolean, search?: string, category?: string }) => {
    let query = supabase.from('products').select('*');
    
    if (!params?.isAdmin) {
        query = query.eq('is_active', true);
    }
    if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
    }
    if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        size: p.size,
        price: p.price,
        description: p.description,
        image: p.images && p.images.length > 0 ? p.images[0] : p.image,
        images: p.images, 
        isActive: p.is_active,
        stockStatus: p.stock_status || (p.stock_quantity > 0 ? 'IN_STOCK' : 'SOLD_OUT'),
        stockQuantity: p.stock_quantity,
        metadata: p.metadata
    }));
};

export const saveProduct = async (p: Partial<Product>) => {
    const imagesArr = p.images || (p.image ? [p.image] : []);

    const payload = {
        name: p.name,
        category: p.category,
        size: p.size,
        price: p.price,
        description: p.description,
        images: imagesArr,
        is_active: p.isActive,
        stock_status: p.stockStatus,
        stock_quantity: p.stockQuantity ?? 100,
        metadata: p.metadata
    };

    if (p.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', p.id);
        if(error) throw error;
    } else {
        const { error } = await supabase.from('products').insert([payload]);
        if(error) throw error;
    }
};
