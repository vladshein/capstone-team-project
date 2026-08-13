/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "User": {
 *         "type": "object",
 *         "required": ["id", "email", "role", "isVerified"],
 *         "properties": {
 *           "id": { "type": "integer", "format": "int64", "example": 12 },
 *           "email": { "type": "string", "format": "email", "example": "example@example.com" },
 *           "role": { "type": "string", "example": "worker" },
 *           "displayName": { "type": "string", "example": "test@test.com" },
 *           "avatarUrl": { "type": "string", "example": "//://gravatar.com..." },
 *           "balance": { "type": "number", "format": "float", "example": 0 },
 *           "phone": { "type": "string", "example": "+380931111111" },
 *           "isVerified": { "type": "boolean", "example": false }
 *         }
 *       },
 *       "RegisterRequest": {
 *         "type": "object",
 *         "required": ["email", "password"],
 *         "properties": {
 *           "email": { "type": "string", "format": "email", "example": "example@example.com" },
 *           "password": { "type": "string", "format": "password", "minLength": 8, "example": "examplepass" },
 *           "phone": { "type": "string", "example": "+380631111111" },
 *           "role": { "type": "string", "example": "worker" }
 *         }
 *       }
 *     }
 *   }
 * }
 */
