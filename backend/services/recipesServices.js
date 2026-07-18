import { Recipe, Category, Area, Ingredient, User, FavoriteRecipe } from '../db/models/index.js';
import { Sequelize } from 'sequelize';
import { ObjectId } from 'bson';
import HttpError from '../helpers/HttpError.js';

// async function getRecipes(where) {
//     return await Recipe.findAll({ where });
// }
async function getRecipes(filters = {}, loggedUserId = null) {
  const where = {};
  // filter by ownerId
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  const include = [
    { model: Category, as: 'category', attributes: ['id', 'name'] },
    { model: Area, as: 'area', attributes: ['id', 'name'] },
    { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
  ];

  // filter by category (selected from CATEGORIES page)
  if (filters.category) {
    // include[0].where = { name: filters.category };
    include[0].where = { id: filters.category }; // pavlo
    include[0].required = true;
  }

  // filter by area
  if (filters.area) {
    // include[1].where = { name: filters.area };
    include[1].where = { id: filters.area }; // pavlo
    include[1].required = true;
  }

  // filter by ingredients (join table)
  if (filters.ingredient) {
    include.push({
      model: Ingredient,
      as: 'ingredients',
      through: { attributes: ['measure'] },
      where: { id: filters.ingredient }, // can be array of IDs
    });
  } else {
    include.push({
      model: Ingredient,
      as: 'ingredients',
      through: { attributes: ['measure'] },
    });
  }

  // Pagination with validation
  let page = filters.page || 1;
  let limit = filters.limit || 12;

  // Ensure positive values
  page = page > 0 ? page : 1;
  limit = limit > 0 ? limit : 12;

  const offset = (page - 1) * limit;

  // Get total count with distinct
  const count = await Recipe.count({
    where,
    include,
    distinct: true,
    col: 'id',
  });

  // Get recipes with pagination
  const rows = await Recipe.findAll({
    where,
    include,
    limit,
    offset,
    distinct: true,
  });

  return {
    recipes: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}
//TODO: add correct processing
// async function getPopularRecipes(where) {
//     return await Recipe.findAll({ where });
// }
// Get popular recipes (sorted by favorites count)
export async function getPopularRecipes(limit = 4) {
  const recipes = await Recipe.findAll({
    order: [['favoritesCount', 'DESC']],
    limit,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'avatar'],
      },
      { model: Category, as: 'category' },
      { model: Area, as: 'area' },
      {
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['measure'] },
      },
    ],
  });

  return recipes;
}

/**
 * Get recipes owned by a user
 *
 * @param {*} ownerId  User ID
 * @param {*} limit  Items per page
 * @param {*} offset  position for start
 * @param {*} order  Sort
 * @returns
 */
async function getOwnRecipes(ownerId, limit, offset, order) {
  return await Recipe.findAndCountAll({
    where: { ownerId },
    limit,
    offset,
    order,
  });
}

async function getRecipeById(id) {
  const recipe = await Recipe.findByPk(id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Area, as: 'area', attributes: ['id', 'name'] },
      {
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['measure'] },
      },
    ],
  });

  return recipe ? recipe.get({ plain: true }) : null;
}

/**
 * Delete user own recipe by recipe ID
 *
 * @param {*} id
 * @param {*} ownerId
 * @returns
 */
async function deleteRecipe(id, ownerId) {
  const recipe = await Recipe.findOne({ where: { id, ownerId } });
  if (!recipe) return null;
  await recipe.destroy();
  return recipe;
}

async function addRecipe(payload) {
  const categoryId = payload.categoryId;
  const areaId = payload.areaId;

  // Validate that category and area exist
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw HttpError(404, 'Category not found');
  }

  const area = await Area.findByPk(areaId);
  if (!area) {
    throw HttpError(404, 'Area not found');
  }

  const newRecipe = await Recipe.create({
    id: new ObjectId().toString(),
    title: payload.title,
    description: payload.description,
    instructions: payload.instructions,
    thumb: payload.thumb,
    time: payload.time,
    ownerId: payload.ownerId,
    categoryId,
    areaId,
  });

  // Add ingredients if provided
  if (payload.ingredients && payload.ingredients.length > 0) {
    const ingredientPromises = payload.ingredients.map((ing) =>
      newRecipe.addIngredient(ing.id, { through: { measure: ing.measure || ing.quantity } })
    );
    await Promise.all(ingredientPromises);
  }

  // Fetch the recipe with all relationships
  const recipeWithRelations = await Recipe.findByPk(newRecipe.id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Area, as: 'area', attributes: ['id', 'name'] },
      { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
      {
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['measure'] },
      },
    ],
  });

  return recipeWithRelations;
}
// async function addFavoriteRecipe(where) {
//     const recipe = await getRecipeById(where);
//     if (!recipe) return null;
//     await recipe.update({ favorite: true });
//     return recipe;
// }
// Add recipe to favorites
async function addFavoriteRecipe(userId, recipeId) {
  const recipe = await Recipe.findByPk(recipeId);
  if (!recipe) {
    throw HttpError(404, 'Recipe not found');
  }

  const existingFavorite = await FavoriteRecipe.findOne({
    where: { userId, recipeId },
  });

  if (existingFavorite) {
    throw HttpError(409, 'Recipe already in favorites');
  }

  await Recipe.increment('favoritesCount', { by: 1, where: { id: recipeId } });

  return await FavoriteRecipe.create({ userId, recipeId });
}

// async function removeFavoriteRecipe(where) {
//     const recipe = await getRecipeById(where);
//     if (!recipe) return null;
//     await recipe.update({ favorite: false });
//     return recipe;
// }
// Remove recipe from favorites
async function removeFavoriteRecipe(userId, recipeId) {
  await Recipe.decrement('favoritesCount', { by: 1, where: { id: recipeId } });
  const fav = await FavoriteRecipe.findOne({ where: { userId, recipeId } });
  if (!fav) return null;
  await fav.destroy();
  return fav;
}

const getFavoriteRecipes = async (ownerId, limit, offset, order) => {
  return await Recipe.findAndCountAll({
    include: [
      {
        model: User,
        as: 'favoritedBy',
        where: { id: ownerId },
        attributes: [],
        through: { attributes: [] },
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'avatar'],
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
      {
        model: Area,
        as: 'area',
        attributes: ['id', 'name'],
      },
    ],
    limit,
    offset,
    order,
  });
};

export default {
  getRecipes,
  getRecipeById,
  addRecipe,
  deleteRecipe,
  getOwnRecipes,
  addFavoriteRecipe,
  removeFavoriteRecipe,
  getPopularRecipes,
  getFavoriteRecipes,
};
