import { handleGetConversationDetailRequest } from './conversations/[id].js';

export { handleGetConversationDetailRequest };

export default {
  async fetch(request, env, ctx) {
    return handleGetConversationDetailRequest(request);
  },
};
