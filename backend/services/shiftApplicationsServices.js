import { ShiftApplication } from "../db/models/index.js";

export const getShiftApplicationByShiftId = async (shiftId) => {
  // Implementation for fetching shift applications by shift ID
  const shiftApplications = await ShiftApplication.findOne({
    where: { shiftId: shiftId },
  });
  return shiftApplications;
};
