import { ActivitiesRepository } from '../repositories/activities.repository';

export const ActivitiesService = {
  async list(userId: string, limit = 10) {
    return ActivitiesRepository.list(userId, limit);
  },
};
