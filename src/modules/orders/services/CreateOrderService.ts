import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IProductMap {
  [key: string]: Product;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const foundProducts: IProductMap = {};
    (await this.productsRepository.findAllById(products)).forEach(product => {
      foundProducts[product.id] = product;
    });

    if (Object.keys(foundProducts).length < products.length) {
      throw new AppError('Product not found.');
    }
    const newQuantityProducts: IUpdateProductsQuantityDTO[] = [];
    const orderProducts = products.map(({ id, quantity }) => {
      if (quantity > foundProducts[id].quantity) {
        throw new AppError('Insuficient quantity.');
      }
      newQuantityProducts.push({
        id,
        quantity: foundProducts[id].quantity - quantity,
      });
      const { price } = foundProducts[id];
      return { product_id: id, price, quantity };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });
    await this.productsRepository.updateQuantity(newQuantityProducts);
    return order;
  }
}

export default CreateOrderService;
