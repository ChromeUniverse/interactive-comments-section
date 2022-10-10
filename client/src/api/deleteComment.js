export default async function deleteCommentAPI(id) {

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/${id}`, {
    method: "DELETE",
    headers: {      
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  console.log(res.status);
  return res.status;
}
