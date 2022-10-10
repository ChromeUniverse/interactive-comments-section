export default async function fetchRatingsAPI(setComments) {
  // fetch all comment ratings for this user
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/rate`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
  const ratings = await res.json();    

  // console.log(ratings);

  setComments(oldComments => {
    const ratingsMapping = {}
    ratings.forEach(rating => {
      ratingsMapping[rating.comment_id] = rating.button;
    });

    return oldComments.map(c => {
      return Object.keys(ratingsMapping).includes(c.comment_id.toString())
        ? { ...c, rating: ratingsMapping[c.comment_id] }
        : { ...c, rating: 0};
    });
  })
}