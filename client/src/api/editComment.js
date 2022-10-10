export default async function editCommentAPI(id, content) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ content: content }),
  });

  console.log(res.status);
  return res.status;
}