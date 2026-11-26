import TextField, { type TextFieldProps } from '@mui/material/TextField'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: Path<T>
  control: Control<T>
}

/**
 * Campo de texto de MUI conectado a React Hook Form, con su error de validación como ayuda.
 * La ref del formulario se pasa como inputRef para que llegue al <input> y no al contenedor:
 * así, al enviar con errores, el foco va al primer campo inválido.
 */
export function FormTextField<T extends FieldValues>({ name, control, ...props }: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...props}
          {...field}
          inputRef={ref}
          error={fieldState.invalid}
          helperText={fieldState.error?.message ?? props.helperText}
        />
      )}
    />
  )
}
