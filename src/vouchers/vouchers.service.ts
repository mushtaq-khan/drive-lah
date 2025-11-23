import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { generateCode } from '../utils/code-generator';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly vouchersRepository: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto) {
    const code = (
      createVoucherDto.code ?? generateCode('VOUCHER')
    ).toUpperCase();
    const exists = await this.vouchersRepository.exists({ where: { code } });
    if (exists) {
      throw new BadRequestException('Voucher code already exists');
    }

    const voucher = this.vouchersRepository.create({
      ...createVoucherDto,
      code,
      expirationDate: new Date(createVoucherDto.expirationDate),
    });
    this.ensureExpirationInFuture(voucher.expirationDate);

    return this.vouchersRepository.save(voucher);
  }

  findAll() {
    return this.vouchersRepository.find({ where: { deletedAt: IsNull() } });
  }

  async findAvailable() {
    const now = new Date();

    return this.vouchersRepository
      .createQueryBuilder('voucher')
      .where('voucher.expirationDate > :now', { now })
      .andWhere('voucher.deletedAt IS NULL')
      .andWhere('voucher.usageCount < voucher.usageLimit')
      .orderBy('voucher.expirationDate', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const voucher = await this.vouchersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return voucher;
  }

  async findByCode(code: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Voucher)
      : this.vouchersRepository;
    return repo.findOne({
      where: { code: code.toUpperCase(), deletedAt: IsNull() },
    });
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto) {
    await this.findOne(id);
    if (updateVoucherDto.expirationDate) {
      this.ensureExpirationInFuture(new Date(updateVoucherDto.expirationDate));
    }
    if (updateVoucherDto.code) {
      updateVoucherDto.code = updateVoucherDto.code.toUpperCase();
      const exists = await this.vouchersRepository.findOne({
        where: { code: updateVoucherDto.code, deletedAt: IsNull() },
      });
      if (exists && exists.id !== id) {
        throw new BadRequestException('Voucher code already exists');
      }
    }

    const voucher = await this.vouchersRepository.preload({
      id,
      ...updateVoucherDto,
      expirationDate: updateVoucherDto.expirationDate
        ? new Date(updateVoucherDto.expirationDate)
        : undefined,
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return this.vouchersRepository.save(voucher);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.vouchersRepository.softDelete(id);
  }

  private ensureExpirationInFuture(expirationDate: Date) {
    if (expirationDate.getTime() <= Date.now()) {
      throw new BadRequestException('Expiration date must be in the future');
    }
  }

  async incrementUsage(voucherId: string, manager: EntityManager) {
    await manager
      .getRepository(Voucher)
      .increment({ id: voucherId }, 'usageCount', 1);
  }
}
