import express from 'express';
import {
  getRecipesController,
  getPopularRecipesController,
  getRecipeByIdController,
  getOwnRecipesController,
  getUserRecipesController,
  createRecipeController,
  deleteRecipeController,
  getFavoriteRecipesController,
  updateFavoriteRecipeController,
  removeFavoriteRecipeController,
} from '../controllers/recipesControllers.js';
import upload from '../middlewares/upload.js';
import { validateQuery, validateParams } from '../helpers/validateFunctions.js';
import { paginationSchema, deleteRecipeSchema } from '../schemas/recipesSchemas.js';
import authenticate from '../middlewares/authenticate.js';

const recipesRouter = express.Router();

// public recipe routes (specific routes must be before /:id pattern)
recipesRouter.get('/', getRecipesController);
recipesRouter.get('/popular', getPopularRecipesController);

// protected routes - must be defined BEFORE /:id to avoid route collision
recipesRouter.get('/my', [authenticate, validateQuery(paginationSchema)], getOwnRecipesController);

// Favorites routes - GET must be before POST/DELETE with :id parameter
recipesRouter.get('/favorites', authenticate, getFavoriteRecipesController); // список улюблених
recipesRouter.post('/favorites/:id', authenticate, updateFavoriteRecipeController); // додати улюблений
recipesRouter.delete('/favorites/:id', authenticate, removeFavoriteRecipeController); // видалити з улюблених
recipesRouter.get('/userrecipes/:id', authenticate, getUserRecipesController);

// public route with dynamic parameter - must be AFTER specific routes
recipesRouter.get('/:id', getRecipeByIdController);

// protected recipe CRUD
recipesRouter.post('/', [authenticate, upload.single('thumb')], createRecipeController);
recipesRouter.delete(
  '/:id',
  [authenticate, validateParams(deleteRecipeSchema)],
  deleteRecipeController
);

export default recipesRouter;
