import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const existingCustomer = await this.customersRepository.findByEmail(email);
    if (existingCustomer) {
      throw new AppError('E-mail already in use.');
    }
    return this.customersRepository.create({ name, email });
  }
}

export default CreateCustomerService;
