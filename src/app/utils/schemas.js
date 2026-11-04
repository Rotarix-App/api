const { z } = require('zod')

const NAME_PATTERN = /^[A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+)+$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/

module.exports = {
    id: z
        .string({ error: 'Informe um identificador válido.' })
        .regex(/^[1-9][0-9]{0,9}$/, 'Informe um identificador válido.')
        .transform(Number)
        .pipe(z.number().max(2147483647, 'Informe um identificador válido.')),

    role: z.enum(['manager', 'driver'], { error: 'Escolha o perfil: gestor ou motorista.' }),

    name: z
        .string({ error: 'Informe o nome completo.' })
        .trim()
        .min(3, 'O nome deve ter pelo menos 3 caracteres.')
        .max(120, 'O nome deve ter no máximo 120 caracteres.')
        .regex(NAME_PATTERN, 'Informe nome e sobrenome, usando apenas letras.'),

    email: z
        .string({ error: 'Informe o e-mail.' })
        .trim()
        .toLowerCase()
        .max(160, 'O e-mail deve ter no máximo 160 caracteres.')
        .email('Informe um e-mail válido.'),

    phone: z
        .string({ error: 'Informe o telefone.' })
        .trim()
        .regex(/^\d{10,11}$/, 'Informe o telefone com DDD, apenas números.'),

    password: z
        .string({ error: 'Informe a senha.' })
        .min(8, 'A senha deve ter pelo menos 8 caracteres.')
        .max(72, 'A senha deve ter no máximo 72 caracteres.')
        .regex(PASSWORD_PATTERN, 'A senha deve ter letras maiúsculas, minúsculas e números.'),

    cnhNumber: z
        .string({ error: 'Informe o número da CNH.' })
        .trim()
        .regex(/^\d{11}$/, 'O número da CNH deve ter 11 dígitos.'),

    cnhCategory: z.enum(['B', 'C', 'D', 'E'], { error: 'Escolha a categoria da CNH: B, C, D ou E.' }),

    plate: z
        .string({ error: 'Informe a placa.' })
        .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
        .pipe(z.string().regex(PLATE_PATTERN, 'Informe uma placa válida, como ABC1D23 ou ABC1234.')),

    vehicleYear: z
        .number({ error: 'Informe o ano do veículo.' })
        .int('Informe o ano do veículo.')
        .min(1950, 'Informe um ano a partir de 1950.')
        .refine((year) => year <= new Date().getFullYear() + 1, 'O ano não pode ser posterior ao próximo ano.'),

    odometer: z
        .number({ error: 'Informe o odômetro em km.' })
        .int('O odômetro deve ser em km inteiros.')
        .min(0, 'O odômetro não pode ser negativo.')
        .max(9999999, 'O odômetro deve ter no máximo 9.999.999 km.')
}
