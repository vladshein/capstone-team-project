import recipesServices from '../services/recipesServices.js';
import HttpError from '../helpers/HttpError.js';
import { getPagination, formatResponse } from './../helpers/pagination.js';
import { createRecipeSchema } from '../schemas/recipesSchemas.js';

// +, no owner = public
export const getRecipesController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const { recipes, pagination } = await recipesServices.getRecipes(
    {
      category: req.query.category,
      area: req.query.area,
      ingredient: req.query.ingredient,
      page,
      limit,
    }
    // req.user.id ? req.user.id : null
  );

  res.json({ recipes, pagination });
};

// +, no owner = public
export const getRecipeByIdController = async (req, res) => {
  // TODO: add service to get recipe details by id
  const recipe = await recipesServices.getRecipeById(req.params.id);
  if (!recipe) {
    throw HttpError(404, 'Not found');
  }
  res.json(recipe);
};

// +, no owner public
export const getPopularRecipesController = async (req, res) => {
  // TODO: add service to get popular recipes
  const recipes = await recipesServices.getPopularRecipes();
  res.json(recipes);
};

/**
 * Gets own recipes with pagination
 *
 * @param {*} req
 * @param {*} res
 */
export const getOwnRecipesController = async (req, res) => {
  const { id: ownerId } = req.user;
  const query = req.validatedQuery || req.query;
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 4;
  const { offset } = getPagination(page, limit);
  // GO!
  const recipes = await recipesServices.getOwnRecipes(ownerId, limit, offset, [
    ['updatedAt', 'ASC'],
  ]);
  const {
    totalItems,
    items,
    totalPages,
    currentPage,
    limit: responseLimit,
  } = formatResponse(recipes, page, limit);
  // Rename items to recipes for consistency with other endpoints
  res.json({
    recipes: items,
    pagination: {
      total: totalItems,
      page: currentPage,
      limit: responseLimit,
      totalPages,
    },
  });
};

export const getUserRecipesController = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1; // Fixed query reference
  const limit = parseInt(req.query.limit) || 4; // Fixed query reference
  const { offset } = getPagination(page, limit);

  const recipes = await recipesServices.getOwnRecipes(id, limit, offset, [['updatedAt', 'ASC']]);
  const {
    totalItems,
    items,
    totalPages,
    currentPage,
    limit: responseLimit,
  } = formatResponse(recipes, page, limit);

  res.json({
    recipes: items,
    pagination: {
      total: totalItems,
      totalPages,
      page: currentPage,
      limit: responseLimit,
    },
  });
};

/**
 * Delete user own recipe by recipeID
 *
 * @param {*} req
 * @param {*} res
 */
export const deleteRecipeController = async (req, res) => {
  const { id: ownerId } = req.user;
  const recipe = await recipesServices.deleteRecipe(req.params.id, ownerId);
  if (!recipe) {
    throw HttpError(404, 'Recipe not found');
  }
  res.json({ message: `The recipe (${req.params.id}) was deleted successfully` });
};

// +
export const createRecipeController = async (req, res) => {
  const { id: ownerId } = req.user;

  if (!req.file) {
    throw HttpError(400, 'Recipe photo is required');
  }

  let ingredients = req.body.ingredients;
  if (typeof ingredients === 'string') {
    try {
      ingredients = JSON.parse(ingredients);
    } catch (error) {
      throw HttpError(400, 'Invalid ingredients format');
    }
  }

  const getBaseUrl = (req) => {
    return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  };

  const thumbPath = `${getBaseUrl(req)}/temp/${req.file.filename}`;

  // Validate the parsed body with ingredients as array
  const bodyToValidate = {
    ...req.body,
    ingredients: JSON.stringify(ingredients),
    thumb: thumbPath,
  };

  const { error, value } = createRecipeSchema.validate(bodyToValidate);

  if (error) {
    throw HttpError(400, error.message);
  }

  // Parse ingredients back to array for service
  const parsedIngredients = JSON.parse(value.ingredients);

  const recipe = await recipesServices.addRecipe({
    ...value,
    ingredients: parsedIngredients,
    ownerId,
  });

  res.status(201).json(recipe);
};

/**
 * User (Profiles) Favorites Tabs
 * @param {*} req
 * @param {*} res
 */
export const getFavoriteRecipesController = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Fixed query reference
  const limit = parseInt(req.query.limit) || 9; // Fixed query reference
  const { offset } = getPagination(page, limit);
  const { id: userId } = req.user;

  try {
    const favorites = await recipesServices.getFavoriteRecipes(userId, limit, offset, [
      ['updatedAt', 'ASC'],
    ]);

    const {
      totalItems,
      items,
      totalPages,
      currentPage,
      limit: responseLimit,
    } = formatResponse(favorites, page, limit);

    res.json({
      favorites: items,
      pagination: {
        total: totalItems,
        totalPages,
        page: currentPage,
        limit: responseLimit,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const updateFavoriteRecipeController = async (req, res) => {
  const { id: ownerId } = req.user;
  const { id } = req.params;

  const fav = await recipesServices.addFavoriteRecipe(ownerId, id);

  if (!fav) {
    throw HttpError(404, `Recipe not found`);
  }

  res.status(200).json({
    message: 'Recipe added to favorites',
    data: fav,
  });
};

export const removeFavoriteRecipeController = async (req, res) => {
  const { id: ownerId } = req.user;
  const { id } = req.params;

  const fav = await recipesServices.removeFavoriteRecipe(ownerId, id);

  if (!fav) {
    throw HttpError(404, `Recipe not found in favorites`);
  }

  res.status(200).json({
    message: 'Recipe removed from favorites',
    data: fav,
  });
};
