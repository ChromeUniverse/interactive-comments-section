// packages
import React, { useState, useEffect } from 'react'
import { nanoid } from 'nanoid';
import jwt_decode from "jwt-decode";


// Components
import Header from './components/Header';
import Modal from './components/Modal';
import Comment from './components/Comment'
import TextInput from './components/TextInput';
import Footer from './components/Footer';

// API functions
import deleteCommentAPI from './api/deleteComment';
import addCommentAPI from './api/addComment';
import editCommentAPI from './api/editComment';
import rateCommentAPI from './api/rateComment';

// data
import data from './data.json'
import fetchRatingsAPI from './api/fetchRatings';


function App() {
  const [user, setUser] = useState({});
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [newCommentContent, setNewCommentContent] = useState('');

  // Removes comment/reply from "comments" state
  async function deleteComment() {    
    const id = commentToDelete;
    await deleteCommentAPI(id);
    setComments(oldComments => oldComments.filter(c => c.comment_id !== id));      
  }

  // Edits comment
  async function editComment(id, newContent) {

    await editCommentAPI(id, newContent);

    setComments((oldComments) =>
      oldComments.map((c) =>
        c.comment_id === id ? { ...c, content: newContent } : c
      )
    );   
  }

  // New Comment text input change handler
  function newCommentChangeHandler(e) {
    setNewCommentContent(e.target.value);
  }

  // Adds new top-level comment
  async function addNewComment(parentId = null, replyingTo = null, content) {    

    console.log('got here', parentId, content);

    if (content === '') return;

    const newComment = await addCommentAPI(user, parentId, replyingTo, content);
    console.log(newComment);

    setComments(oldComments =>  [...oldComments, newComment]);
    if (parentId === null) setNewCommentContent('');
  }

  // sets the rating for a comment
  async function rateComment(id, button) {

    if (!loggedIn()) return; 

    const newScore = await rateCommentAPI(id, button);
    setComments((oldComments) =>
      oldComments.map((c) =>
        c.comment_id === id
          ? { ...c, score: newScore, rating: c.rating === button ? 0 : button }
          : c
      )
    );
  }

  function loggedIn() {    
    return Object.keys(user).length !== 0 ? user : false;
  }

  // Run on page load
  useEffect(() => {
    
    async function fetchAllComments() {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments`);
      const data = await res.json();      
      setComments(data.comments);
    }
    fetchAllComments();
    
    async function fetchUser() {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) return;
      const user = await res.json();
      fetchRatingsAPI(setComments);
      setUser(user)
      console.log(data);
    }
    fetchUser();

  }, [])

  // login callback
  async function handleCallbackResponse(response) {
    // decode token
    const token = jwt_decode(response.credential);

    // post it to server, retrive user token
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
      method: "POST", 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token),
    })
    const userToken = await res.text();    

    // update app state
    setUser(jwt_decode(userToken));    
    localStorage.setItem('token', userToken);

    fetchRatingsAPI(setComments);
  }

  // Google Auth
  useEffect(() => {

    const timer = setTimeout(() => {

      console.log(`Here goes nothin'`);

      /* global google */
      google.accounts.id.initialize({
        client_id: "994169675178-u8tbg94a4midpvv5j0loi83vm843mjr2.apps.googleusercontent.com",
        callback: handleCallbackResponse
      })

      google.accounts.id.renderButton(document.getElementById("signInDiv"), {
        theme: "outline",
        size: "large",
      });
    }, 500);
    
    return () => {
      clearTimeout(timer);
    }

  }, [])
  
  

  return (
    <div className="bg-veryLightGray min-h-screen relative">      

      {/* Modal */}
      {showModal && (
        <Modal
          setShowModal={setShowModal}
          setCommentToDelete={setCommentToDelete}
          deleteComment={deleteComment}
        />
      )}

      {/* Main container */}
      <div className="w-[90%] md:w-[720px] mx-auto flex flex-col pt-6 pb-12 gap-6">

        <Header/>

        {/* Comments */}
        {comments
          .filter((c) => c.parent_id === null)
          .map((comment) => (
            <div className="flex flex-col" key={comment.comment_id}>
              {/* Base comment */}
              <Comment
                key={comment.comment_id}
                comment={comment}
                user={loggedIn()}
                setShowModal={setShowModal}
                setCommentToDelete={setCommentToDelete}
                editComment={editComment}
                addReply={addNewComment}
                rateComment={rateComment}
              />

              {/* replies container */}
              {comments.filter((c) => c.parent_id === comment.comment_id)
                .length !== 0 && (
                <div className="relative mt-4">
                  {/* Vertical bar */}
                  <div className="absolute w-[2px] bg-grayishBlue/10 left-0 md:left-10 top-0 bottom-2"></div>

                  {/* Replies */}
                  <div className="ml-4 md:ml-20 flex flex-col items-end gap-6">
                    {comments
                      .filter((c) => c.parent_id === comment.comment_id)
                      .map((reply) => (
                        <Comment
                          key={reply.comment_id}
                          comment={reply}
                          user={loggedIn()}
                          setShowModal={setShowModal}
                          setCommentToDelete={setCommentToDelete}
                          editComment={editComment}
                          addReply={addNewComment}
                          parentId={comment.comment_id}
                          rateComment={rateComment}
                          replyingTo={comment.username}
                          reply
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* Text Input */}
        <TextInput
          user={loggedIn()}
          value={newCommentContent}
          onChange={newCommentChangeHandler}
          sendClickHandler={() => addNewComment(null, null, newCommentContent)}
        />

        <Footer />
      </div>
    </div>
  );
}

export default App