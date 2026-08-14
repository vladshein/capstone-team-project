/**
 * @swagger
 * {
 *   "components": {
 *     "responses": { 
 *       "200LoginSuccess": {
 *         "description": "User login successfully. Session initialized.",
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
 *       "201RegisterAccountSuccess": {
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
 *       "204NoContent": {
 *         "description": "Response with no content.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "message": { "type": "string", "example": "No Content" },
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
 *       },
 *       "401Unauthorized": {
 *         "description": "Unauthorized",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "message": {"type": "string", "example": "Authorization header missed"}
 *               }
 *             }
 *           }                   
 *         }
 *       },
 *       "409Duplicate": {
 *         "description": "Duplicate",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "message": {"type": "string", "example": "Duplicate"}
 *               }
 *             }
 *           }                   
 *         }
 *       }
 *     }
 *   }
 * }
 */
