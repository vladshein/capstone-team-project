/**
 * @swagger
 * {
 *   "components": {
 *     "responses": {
 *       "201AuthSuccess": {
 *         "description": "User account created successfully. Session initialized.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "required": ["user", "accessToken"],
 *               "properties": {
 *                 "user": { "$ref": "#/components/schemas/User" },
 *                 "accessToken": { "type": "string", "example": "eyJhbGciOiJIUzI1Ni..." }
 *               }
 *             }
 *           }
 *         }
 *       },
 *       "400ValidationError": {
 *         "description": "Validation error from Joi/Zod library",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "message": { "type": "string", "example": "Error from validation library" }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
