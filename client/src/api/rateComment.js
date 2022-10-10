export default async function rateCommentAPI(id, button) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/rate/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ button: button }),
  });

  const newScore = await res.text();
  console.log(newScore);
  return newScore;
}