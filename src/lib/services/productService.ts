
import { supabase } from '../supabaseClient';
import { Product } from '../../types';
import { ASSETS } from '../../assets';

// Helper to sanitize image URLs
const sanitizeImage = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('blob:')) return undefined; // Reject local blobs
    return url;
};

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

    return data.map((p: any) => {
        // Prioritize images array, fallback to legacy image string, then ensure validity
        const rawImage = (p.images && p.images.length > 0) ? p.images[0] : p.image;
        const validImage = sanitizeImage(rawImage);

        return {
            id: p.id,
            name: p.name,
            category: p.category,
            size: p.size,
            price: p.price,
            description: p.description,
            image: validImage || ASSETS.PRODUCT_PLACEHOLDER,
            images: p.images, 
            isActive: p.is_active,
            stockStatus: p.stock_status || (p.stock_quantity > 0 ? 'IN_STOCK' : 'SOLD_OUT'),
            stockQuantity: p.stock_quantity,
            metadata: p.metadata
        };
    });
};

export const saveProduct = async (p: Partial<Product>) => {
    // Sanitize images before saving to ensure no blobs persist
    const imagesArr = (p.images || (p.image ? [p.image] : [])).filter(img => img && !img.startsWith('blob:'));

    const payload = {
        name: p.name,
        category: p.category,
        size: p.size,
        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
        description: p.description,
        images: imagesArr,
        // Also update legacy image column for backward compat
        image: imagesArr.length > 0 ? imagesArr[0] : null,
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
