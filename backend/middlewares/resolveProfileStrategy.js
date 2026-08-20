import HttpError from "../helpers/HttpError.js";
import * as workerService from "../services/workerServices.js";
import * as businessService from "../services/businessServices.js";

const strategies = {
  worker: workerService.getWorkerProfile,
  business_client: businessService.getCompanyProfile,
};

const resolveProfileStrategy = (req, res, next) => {
  const { role } = req.user;
  const strategy = strategies[role];

  if (!strategy) {
    // сюди попаде admin, поки для нього немає стратегії
    return next(HttpError(403, `Profile endpoint not supported for role: ${role}`));
  }

  req.profileStrategy = strategy;
  next();
};

export default resolveProfileStrategy;
