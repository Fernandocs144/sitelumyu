import { handlePostFollowUpSendRequest } from '../../follow-ups/[id]/send.js';

export default async function handler(req, res) {
  const response = await handlePostFollowUpSendRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
