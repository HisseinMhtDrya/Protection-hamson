const { z } = require('zod');

// URL validation schema
const urlSchema = z.object({
    url: z.string()
        .min(1, 'L\'URL ne peut pas être vide')
        .max(2048, 'L\'URL est trop longue')
        .refine((val) => {
            try {
                new URL(val);
                return true;
            } catch {
                return false;
            }
        }, 'URL invalide')
});

// Message validation schema
const messageSchema = z.object({
    message: z.string()
        .min(1, 'Le message ne peut pas être vide')
        .max(5000, 'Le message est trop long')
        .trim()
});

// Validation middleware factory
function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
    };
}

module.exports = {
    validateUrl: validate(urlSchema),
    validateMessage: validate(messageSchema),
    urlSchema,
    messageSchema
};
