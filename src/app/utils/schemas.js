const { z } = require('zod')

const NAME_PATTERN = /^[A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+)+$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const DAY = 24 * 60 * 60 * 1000

/**
 * @param {string} message
 * @param {number} max
 * @param {number} decimals
 */
function decimal(message, max, decimals) {
    const factor = 10 ** decimals
    return z
        .number({ error: message })
        .positive(message)
        .max(max, message)
        .refine((value) => Math.abs(Math.round(value * factor) - value * factor) < 1e-6, `Use no máximo ${decimals} casas decimais.`)
}

/**
 * @param {string} message
 * @param {number} max
 */
function optionalText(message, max) {
    return z
        .string({ error: message })
        .trim()
        .max(max, message)
        .nullish()
        .transform((value) => value || null)
}

module.exports = {
    id: z
        .string({ error: 'Informe um identificador válido.' })
        .regex(/^[1-9][0-9]{0,9}$/, 'Informe um identificador válido.')
        .transform(Number)
        .pipe(z.number().max(2147483647, 'Informe um identificador válido.')),

    decimal,

    optionalText,

    amount: decimal('Informe um valor maior que zero, em reais.', 99999999.99, 2),

    month: z
        .string({ error: 'Informe o mês no formato AAAA-MM.' })
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM.')
        .optional(),

    period: z
        .object({
            days: z.union([z.literal(7), z.literal(30), z.literal(90)], { error: 'Escolha o período: 7, 30 ou 90 dias.' }).optional(),
            from: z.string({ error: 'Informe a data inicial.' }).regex(DATE_PATTERN, 'Informe a data inicial no formato AAAA-MM-DD.').optional(),
            to: z.string({ error: 'Informe a data final.' }).regex(DATE_PATTERN, 'Informe a data final no formato AAAA-MM-DD.').optional()
        })
        .refine(({ from, to }) => !from === !to, { error: 'Informe a data inicial e a final.', path: ['from'] })
        .refine(({ from, to }) => !from || from <= to, { error: 'A data inicial deve ser anterior à final.', path: ['from'] })
        .refine(({ from, to }) => !from || (Date.parse(to) - Date.parse(from)) / DAY <= 366, { error: 'Escolha um período de até 366 dias.', path: ['to'] }),

    reference: (message) => z
        .number({ error: message })
        .int(message)
        .min(1, message)
        .max(2147483647, message),

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
