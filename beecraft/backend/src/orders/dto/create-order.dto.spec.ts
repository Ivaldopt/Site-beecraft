import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomizationDetailsDto } from './create-order.dto';

describe('CustomizationDetailsDto', () => {
  it('aceita campos vazios enviados pelo formulário', async () => {
    const dto = plainToInstance(CustomizationDetailsDto, {
      orientation: 'Vertical',
      columns: '',
      startMonth: '',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('continua a recusar um número de colunas inválido', async () => {
    const dto = plainToInstance(CustomizationDetailsDto, { columns: '9' });
    expect(await validate(dto)).toHaveLength(1);
  });
});
