import {
  getApproximateLocation,
  getCityByCoordinates,
} from "../services/locationServices.js";

export const getApproximateLocationByIp = async (req, res, next) => {
  try {
    const location = await getApproximateLocation(req.ip);

    res.json(
      location ?? {
        city: null,
        region: null,
        country: null,
        latitude: null,
        longitude: null,
        accuracy: "unavailable",
      },
    );
  } catch (error) {
    next(error);
  }
};

export const getCityByCoordinatesController = async (req, res, next) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ message: "Передано некоректні координати." });
    }

    const location = await getCityByCoordinates(latitude, longitude);
    return res.json(location ?? { city: null });
  } catch (error) {
    return next(error);
  }
};
