import {
    getCategories,
    getAreas,
    getIngredients,
    getTestimonials,
} from "../services/commonServices.js";

export const categoriesController = async (req, res) => {
    // const { id: owner } = req.user;
    const contacts = await getCategories();
    res.json(contacts);
};

export const areasController = async (req, res) => {
    const contacts = await getAreas();
    res.json(contacts);
};

export const ingredientsController = async (req, res) => {
    const contacts = await getIngredients();
    res.json(contacts);
};

export const testimonialsController = async (req, res) => {
    const contacts = await getTestimonials();
    res.json(contacts);
};
