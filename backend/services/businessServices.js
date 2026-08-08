import { User, Company } from "../db/models/index.js";
import HttpError from "../helpers/HttpError.js";

/**
 * Get current business_client's profile (User + OwnedCompanies, LEFT JOIN).
 * User can own zero or multiple companies; empty list is a valid state
 * right after registration, not an error.
 *
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const getCompanyProfile = async (userId) => {
  const user = await User.findOne({
    where: { id: userId },
    attributes: ["id", "email", "phone", "avatar", "isVerified", "role", "created_at"],
    include: {
      model: Company,
      as: "OwnedCompanies",
      attributes: ["id", "name", "edrpou", "legalAddress", "avatar"],
      required: false,
    },
  });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  const { OwnedCompanies, ...userData } = user.toJSON();

  return {
    ...userData,
    companies: OwnedCompanies,
    profileCompleted: OwnedCompanies.length > 0,
  };
};

// TODO: createCompany(userId, payload)
// - POST /me/companies (множина, бо User.hasMany(Company) — на відміну від
//   worker-профілю, тут немає обмеження "тільки один", тож 409 на дублікат
//   недоречний; унікальність варто перевіряти тільки по edrpou
//   (SequelizeUniqueConstraintError -> HttpError(409, "EDRPOU already registered"))
// - ownerId береться з req.user.id, ніколи з тіла запиту (щоб business_client
//   не міг створити компанію від імені іншого юзера)

// TODO: updateCompany(userId, companyId, payload)
// - PATCH /me/companies/:companyId
// - обов'язкова перевірка належності: Company.findOne({ where: { id: companyId,
//   ownerId: userId } }) — інакше один business_client зможе редагувати чужу
//   компанію по id. Якщо не знайдено — HttpError(404), не 403 (не палити факт
//   існування чужого companyId)

// TODO: deleteCompany / listCompanies — окремі ендпоінти чи вистачить того,
// що getBusinessProfile вже повертає весь список? Залежить від того, чи
// потрібна business_client-у сторінка "мої компанії" окремо від "мій профіль"

// TODO: розділити відповідальність — getBusinessProfile зараз віддає І дані
// User, І список Company в одному payload. Якщо пізніше зʼявиться окремий
// GET /me/companies/:id (деталі однієї компанії з Location/Shift include),
// не дублюй attributes-список тут і там — виніси в спільну константу
// COMPANY_LIST_ATTRIBUTES / COMPANY_DETAIL_ATTRIBUTES