import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../atoms/Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}

export const FormField: React.FC<FormFieldProps> = ({ name, label, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Input
      label={label}
      error={error}
      {...register(name)}
      {...props}
    />
  );
};
