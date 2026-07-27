import { NrcRepository } from '../repositories/nrc.repository';

export const NrcService = {
  async getTownships() {
    return NrcRepository.listRegionsWithTownships();
  },
};
