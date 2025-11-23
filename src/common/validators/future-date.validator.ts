import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const IsFutureDate = (
  validationOptions?: ValidationOptions,
): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      name: 'IsFutureDate',
      validator: {
        validate(value: string | Date) {
          if (!value) {
            return true;
          }
          const date = value instanceof Date ? value : new Date(value);
          if (Number.isNaN(date.getTime())) {
            return false;
          }
          return date.getTime() > Date.now();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a future date`;
        },
      },
    });
  };
};
