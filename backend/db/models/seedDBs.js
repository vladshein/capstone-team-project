import sequelize from "../sequelize.js";

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
import {
  Area,
  Category,
  Shift,
  ShiftApplication,
  Location,
  Company,
  JobPosition,
  User,
  WorkerProfile,
} from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON files
function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, filename), "utf-8"));
}

export default async function seedAll() {
  try {
    // Load JSON data
    // const areasJson = loadJson("json/areas.json");
    // const categoriesJson = loadJson("json/categories.json");
    // const ingredientsJson = loadJson("json/ingredients.json");
    // const testimonialsJson = loadJson("json/testimonials.json");
    // const recipesJson = loadJson("json/recipes.json");
    const usersJson = loadJson("json/users.json");

    // // Insert Areas
    // for (const area of areasJson) {
    //   await Area.create({
    //     id: area._id.$oid,
    //     name: area.name,
    //   });
    // }

    // // Insert Categories
    // for (const cat of categoriesJson) {
    //   await Category.create({
    //     id: cat._id.$oid,
    //     name: cat.name,
    //   });
    // }

    // // Insert Ingredients
    // for (const ing of ingredientsJson) {
    //   await Ingredient.create({
    //     id: ing._id,
    //     name: ing.name,
    //     desc: ing.desc,
    //     img: ing.img,
    //   });
    // }

    for (const u of usersJson) {
      await User.create({
        id: u._id.$oid,
        name: u.name,
        avatar: u.avatar,
        email: u.email,
      });
    }

    // // Insert Testimonials
    // for (const t of testimonialsJson) {
    //   await Testimonial.create({
    //     id: t._id.$oid,
    //     ownerId: t.owner.$oid,
    //     testimonial: t.testimonial,
    //   });
    // }

    // // Insert Recipes + RecipeIngredients
    // for (const recipeData of recipesJson) {
    //   const category = await Category.findOne({
    //     where: { name: recipeData.category },
    //   });
    //   const area = await Area.findOne({ where: { name: recipeData.area } });

    //   const recipe = await Recipe.create({
    //     id: recipeData._id.$oid,
    //     title: recipeData.title,
    //     categoryId: category ? category.id : null,
    //     ownerId: recipeData.owner.$oid,
    //     areaId: area ? area.id : null,
    //     instructions: recipeData.instructions,
    //     description: recipeData.description,
    //     thumb: recipeData.thumb,
    //     time: recipeData.time ? parseInt(recipeData.time) : null,
    //     createdAt: new Date(Number(recipeData.createdAt.$date.$numberLong)),
    //     updatedAt: new Date(Number(recipeData.updatedAt.$date.$numberLong)),
    //   });

    //   // Link ingredients
    //   for (const ing of recipeData.ingredients) {
    //     await RecipeIngredient.create({
    //       recipeId: recipe.id,
    //       ingredientId: ing.id,
    //       measure: ing.measure,
    //     });
    //   }

    //   for (const u of usersJson) {
    //     if (u.favorites) {
    //       for (const recipeId of u.favorites) {
    //         await FavoriteRecipe.create({
    //           userId: u._id.$oid,
    //           recipeId,
    //         });
    //       }
    //     }
    //   }
    //   for (const u of usersJson) {
    //     const userId = u._id.$oid;

    //     // Followers: who follows this user
    //     for (const followerId of u.followers) {
    //       await UserFollowers.create({
    //         followerId,
    //         followingId: userId,
    //       });
    //     }

    //     // Following: who this user follows
    //     for (const followingId of u.following) {
    //       await UserFollowers.create({
    //         followerId: userId,
    //         followingId,
    //       });
    //     }
    //   }
    // }

    console.log("✅ Seed data inserted successfully");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  }
}
