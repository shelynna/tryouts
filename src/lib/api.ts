
import * as authService from './services/authService';
import * as systemService from './services/systemService';
import * as productService from './services/productService';
import * as basketService from './services/basketService';
import * as paymentService from './services/paymentService';
import * as deliveryService from './services/deliveryService';
import * as adminService from './services/adminService';

// Consolidate all services into a single API object for backward compatibility
export const API = {
    ...authService,
    ...systemService,
    ...productService,
    ...basketService,
    ...paymentService,
    ...deliveryService,
    ...adminService
};
