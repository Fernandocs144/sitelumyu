import { handleGetLeadDetailRequest } from './leads/[id].js';

export default {
  async fetch(request) {
    return handleGetLeadDetailRequest(request);
  },
};
