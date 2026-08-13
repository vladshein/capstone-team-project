import {
  getCategories,
  getAreas,
  getJobPositions,
  // getIngredients,
  // getTestimonials,
} from "../services/commonServices.js";

export const categoriesController = async (req, res) => {
  // const { id: owner } = req.user;
  const categories = await getCategories();
  res.json(categories);
};

export const areasController = async (req, res) => {
  const contacts = await getAreas();
  res.json(contacts);
};

export const jobPositionsController = async (req, res) => {
  const positions = await getJobPositions();
  res.json(positions);
};

// export const ingredientsController = async (req, res) => {
//   const contacts = await getIngredients();
//   res.json(contacts);
// };

// export const testimonialsController = async (req, res) => {
//   const contacts = await getTestimonials();
//   res.json(contacts);
// };
