// 导入 LeanCloud SDK
const AV = window.AV;

// LeanCloud 配置信息
const appId = 'MUcdt9CloFW8yPC38kmZPHhN-gzGzoHsz';
const appKey = 'GJ9AlliMtPzYwsVTJDjRyKkg';
const serverURL = 'https://mucdt9cl.lc-cn-n1-shared.com';

// 允许的域名列表
const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'tby123.github.io',  // 替换为您的 GitHub Pages 域名
    'github.io',         // 允许所有 GitHub Pages 子域名
    'your-app.netlify.app',
    'your-domain.com'
];

// 初始化 LeanCloud
try {
    AV.init({
        appId,
        appKey,
        serverURL
    });
    
    // 检查当前域名是否允许访问
    const currentDomain = window.location.hostname;
    if (allowedDomains.includes(currentDomain) || 
        /^192\.168\./.test(currentDomain) || 
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(currentDomain) ||
        /^10\./.test(currentDomain)) {
        
        // 允许本地开发和已授权的域名
        AV.debug.enable();
        console.log('域名验证通过，初始化成功');
    } else {
        console.warn('未授权的域名访问');
    }
    
    console.log('LeanCloud 初始化成功');
} catch (error) {
    console.error('LeanCloud 初始化失败:', error);
}

// 自定义类名配置
const CLASS_NAMES = {
    USER: '_User',        // 使用内置的用户类
    MERCHANT: 'Merchant',
    PRODUCT: 'Product',
    ORDER: 'Order'
};

// 创建数据库类
class LeanDB {
    // 用户相关操作
    static async addUser(user) {
        try {
            // 使用 LeanCloud 内置的 User 类
            const userObj = new AV.User();
            userObj.setUsername(user.username);
            userObj.setPassword(user.password);
            if (user.email) {
                userObj.setEmail(user.email);
            }
            await userObj.signUp();
            return true;
        } catch (error) {
            console.error('添加用户失败:', error);
            throw new Error(error.message || '添加用户失败');
        }
    }

    static async getUser(username) {
        try {
            const query = new AV.Query(CLASS_NAMES.USER);
            query.equalTo('username', username);
            const user = await query.first();
            return user ? user.toJSON() : null;
        } catch (error) {
            console.error('获取用户失败:', error);
            return null;
        }
    }

    // 商家相关操作
    static async addMerchant(merchant) {
        try {
            const MerchantClass = AV.Object.extend(CLASS_NAMES.MERCHANT);
            const merchantObj = new MerchantClass();
            merchantObj.set({
                ...merchant,
                createdAt: new Date(),
                status: 'active'
            });
            await merchantObj.save();
            return true;
        } catch (error) {
            console.error('添加商家失败:', error);
            throw new Error(error.message || '添加商家失败');
        }
    }

    static async getMerchant(username) {
        try {
            const query = new AV.Query(CLASS_NAMES.MERCHANT);
            query.equalTo('username', username);
            const merchant = await query.first();
            return merchant ? merchant.toJSON() : null;
        } catch (error) {
            console.error('获取商家失败:', error);
            return null;
        }
    }

    // 商品相关操作
    static async addProduct(merchantId, product) {
        try {
            const ProductClass = AV.Object.extend(CLASS_NAMES.PRODUCT);
            const productObj = new ProductClass();
            productObj.set({
                ...product,
                merchantId,
                createdAt: new Date(),
                status: 'active',
                sales: 0
            });
            const savedProduct = await productObj.save();
            return savedProduct.toJSON();
        } catch (error) {
            console.error('添加商品失败:', error);
            throw new Error(error.message || '添加商品失败');
        }
    }

    static async updateProduct(productId, productData) {
        try {
            const query = new AV.Query(CLASS_NAMES.PRODUCT);
            const product = await query.get(productId);
            if (!product) {
                throw new Error('商品不存在');
            }
            Object.keys(productData).forEach(key => {
                product.set(key, productData[key]);
            });
            product.set('updatedAt', new Date());
            await product.save();
            return true;
        } catch (error) {
            console.error('更新商品失败:', error);
            throw new Error(error.message || '更新商品失败');
        }
    }

    static async deleteProduct(productId) {
        try {
            const query = new AV.Query(CLASS_NAMES.PRODUCT);
            const product = await query.get(productId);
            if (!product) {
                throw new Error('商品不存在');
            }
            await product.destroy();
            return true;
        } catch (error) {
            console.error('删除商品失败:', error);
            throw new Error(error.message || '删除商品失败');
        }
    }

    static async getMerchantProducts(merchantId) {
        try {
            const query = new AV.Query(CLASS_NAMES.PRODUCT);
            query.equalTo('merchantId', merchantId);
            query.descending('createdAt');
            const products = await query.find();
            return products.map(product => product.toJSON());
        } catch (error) {
            console.error('获取商品失败:', error);
            return [];
        }
    }

    // 实时数据订阅
    static async subscribeToProducts(merchantId, callback) {
        try {
            const query = new AV.Query(CLASS_NAMES.PRODUCT);
            query.equalTo('merchantId', merchantId);
            const subscription = await query.subscribe();
            
            subscription.on('create', object => {
                callback('create', object.toJSON());
            });
            
            subscription.on('update', object => {
                callback('update', object.toJSON());
            });
            
            subscription.on('delete', object => {
                callback('delete', object.toJSON());
            });

            return subscription;
        } catch (error) {
            console.error('订阅商品更新失败:', error);
            throw new Error(error.message || '订阅商品更新失败');
        }
    }

    // 错误处理
    static handleError(error) {
        if (error.code === 101) {
            return '对象不存在';
        } else if (error.code === 137) {
            return '无操作权限';
        } else if (error.code === 139) {
            return '角色名称已经存在';
        } else {
            return error.message || '操作失败';
        }
    }
}

export default LeanDB; 