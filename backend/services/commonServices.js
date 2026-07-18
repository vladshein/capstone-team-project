import Category from "../db/models/Category.js";
import Area from "../db/models/Area.js";
import User from "../db/models/User.js";
import Testimonial from "../db/models/Testimonial.js";
import Ingredient from "../db/models/Ingredient.js";

export async function getCategories() {
    return await Category.findAll();
}

export async function getAreas() {
    return await Area.findAll();
}

export async function getIngredients() {
    return await Ingredient.findAll();
}


export async function getTestimonials() {
  const testimonials = await Testimonial.findAll({
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return testimonials.map(t => ({
    id: t.id,
    testimonial: t.testimonial,
    authorName: t.owner?.name || 'Anonymous',
  }));
}

