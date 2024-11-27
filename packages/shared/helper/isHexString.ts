/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsHexStringArray(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isHexStringArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;
          return value.every(
            item => typeof item === 'string' && /^0x[0-9a-fA-F]+$/.test(item), // Check for valid hex string
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid hex strings`;
        },
      },
    });
  };
}
