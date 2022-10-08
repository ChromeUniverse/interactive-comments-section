import React, { useState } from 'react'
import Modal from './components/Modal';
import Comment from './components/Comment'
import TextInput from './components/TextInput';

// data
import data from './data.json'
import { nanoid } from 'nanoid';

function App() {

  const [user, setUser] = useState(data.currentUser);
  const [comments, setComments] = useState(data.comments);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [newCommentContent, setNewCommentContent] = useState('');

  // Removes comment/reply from "comments" state
  function deleteComment() {

    const id = commentToDelete;

    setComments(oldComments => {

      // search base comments first
      if (oldComments.map(c => c.id).includes(id)) return oldComments.filter(c => c.id !== id);

      // deep search - replies
      for (const baseComment of oldComments) {
        for (const reply of baseComment.replies) {
          if (reply.id === id) {

            console.log(`Found in reply id ${reply.id} of base comment id ${baseComment.id}`);

            return oldComments.map((oldBaseComment) =>
              oldBaseComment.id === baseComment.id
                ? {
                    ...oldBaseComment,
                    replies: oldBaseComment.replies.filter((r) => r.id !== id),
                  }
                : oldBaseComment
            );
          }
        }
      }  

    })      
  }

  // Edits comment
  function editComment(id, newContent) {

    setComments(oldComments => {

      // search base comments first1
      if (oldComments.map(c => c.id).includes(id)) {
        return oldComments.map((c) =>
          c.id === id ? { ...c, content: newContent } : c
        );
      }      

      // deep search - replies
      for (const baseComment of oldComments) {
        for (const reply of baseComment.replies) {
          if (reply.id === id) {
            return oldComments.map((oldBaseComment) =>
              oldBaseComment.id === baseComment.id
                ? {
                    ...oldBaseComment,
                    replies: oldBaseComment.replies.map((r) =>
                      r.id === id ? {...r, content: newContent} : r
                    ),
                  }
                : oldBaseComment
            );
          }
        }
      }  

    })   

  }

  function addReply(parentId, originalPoster, content) {

    console.log(parentId, originalPoster);

    const newReplyComment = {
      id: nanoid(),
      content: content,
      createdAt: "just now",
      score: 1,
      user: user,
      "replyingTo": originalPoster,
    };

    setComments((oldComments) =>
      comments.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, newReplyComment] }
          : c
      )
    );    
  }

  function newCommentChangeHandler(e) {
    setNewCommentContent(e.target.value);
  }

  function addNewComment(content) {
    const newComment = {
      "id": nanoid(),
      "content": content,
      "createdAt": "just now",
      "score": 1,
      "user": user,
      "replies": []
    }
    setComments(oldComments => [...oldComments, newComment]);
    setNewCommentContent('');
  }

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
      <div className="w-[720px] mx-auto flex flex-col py-6 gap-6">
        {/* Comments */}
        {comments.map((comment) => {
          return (
            <div className="flex flex-col" key={comment.id}>
              {/* Base comment */}
              <Comment
                comment={comment}
                user={user}
                setShowModal={setShowModal}
                setCommentToDelete={setCommentToDelete}
                editComment={editComment}
                addReply={addReply}
              />

              {/* replies container */}
              {comment.replies.length !== 0 && (
                <div className="relative mt-4">
                  {/* Vertical bar */}
                  <div className="absolute w-[2px] bg-grayishBlue/10 left-10 top-0 bottom-2"></div>

                  {/* Replies */}
                  <div className='ml-20 flex flex-col items-end gap-6'>
                    {comment.replies.map((reply) => (
                      <Comment
                        key={reply.id}
                        comment={reply}
                        user={user}
                        setShowModal={setShowModal}
                        setCommentToDelete={setCommentToDelete}
                        editComment={editComment}
                        addReply={addReply}
                        parentId={comment.id}
                        reply
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Text Input */}
        <TextInput user={data.currentUser} value={newCommentContent} onChange={newCommentChangeHandler} sendClickHandler={addNewComment} />
      </div>
    </div>
  );
}

export default App