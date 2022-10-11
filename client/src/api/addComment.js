export default async function addCommentAPI(user, parentId, replyingTo, content) {

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      content: content,
      parent_id: parentId,
      replying_to: replyingTo,
    }),
  });

  const data = await res.json();

  console.log(data);

  return {
    comment_id: Number(data.comment_id),
    content: content,
    created_at: data.created_at,
    parent_id: parentId,
    replying_to: replyingTo,
    username: user.username,
    pfp_url: user.pfp_url,
    user_id: user.user_id,
    score: 0,
    rating: 0,
  };
}