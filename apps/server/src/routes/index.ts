import { Router } from 'express';
import * as users    from '../controllers/usersController';
import * as products from '../controllers/productsController';
import * as orders   from '../controllers/ordersController';

export const usersRouter = Router();
usersRouter.get   ('/',    users.getUsers);
usersRouter.post  ('/',    users.createUser);
usersRouter.get   ('/:id', users.getUserById);
usersRouter.patch ('/:id', users.updateUser);
usersRouter.delete('/:id', users.deleteUser);

export const productsRouter = Router();
productsRouter.get   ('/',    products.getProducts);
productsRouter.post  ('/',    products.createProduct);
productsRouter.get   ('/:id', products.getProductById);
productsRouter.patch ('/:id', products.updateProduct);
productsRouter.delete('/:id', products.deleteProduct);

export const ordersRouter = Router();
ordersRouter.get  ('/',             orders.getOrders);
ordersRouter.post ('/',             orders.createOrder);
ordersRouter.get  ('/:id',          orders.getOrderById);
ordersRouter.patch('/:id/status',   orders.updateOrderStatus);
