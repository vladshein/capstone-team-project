import { getApproximateLocation } from "../services/locationServices.js";

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
