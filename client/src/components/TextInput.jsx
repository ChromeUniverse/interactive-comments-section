import React from 'react'

function TextInput({ user, reply = false, onChange, value, sendClickHandler, replyClickHandler, cancelClickHandler }) {

  const blank_pfp_url = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png";

  return (
    <div className={`bg-white w-full ${user ? 'h-60' : 'h-30'} md:h-36 px-6 py-6 rounded-lg flex flex-col md:flex-row items-start gap-4`}s>

      {!user && (
        <div className='w-full flex flex-col items-center gap-4'>
          <p className='text-xl text-grayishBlue text-center'>Sign in to start posting and rating comments.</p>
          <div id='signInDiv'></div>
        </div>
      )}

      {user && (
        <>
          <img
            className="hidden md:inline-block w-9 rounded-full"
            src={user ? `${import.meta.env.VITE_BACKEND_URL}/avatars/${user.user_id}.jpg` : blank_pfp_url}
            alt=""
          />
          <textarea
            value={value}
            className="border-solid border-2 border-grayishBlue/10 rounded-lg w-full h-full px-5 py-2 outline-none resize-none focus-visible:border-moderateBlue text-darkBlue"
            placeholder="Add a comment..."
            name=""
            id=""
            rows="40"
            onChange={onChange}
          ></textarea>

          {/* Button containers */}
          <div className="hidden md:flex flex-col gap-2 h-full justify-between">
            {!reply ? (
              <button
                className="bg-moderateBlue text-white px-8 py-3 rounded-lg font-semibold hover:bg-lightGrayishBlue"
                onClick={() => sendClickHandler(value)}
              >
                SEND
              </button>
            ) : (
              <>
                <button
                  className="bg-moderateBlue text-white w-24 py-2 rounded-lg font-semibold hover:bg-lightGrayishBlue"
                  onClick={replyClickHandler}
                >
                  REPLY
                </button>
                <button
                  className="bg-grayishBlue text-white w-24 py-2 rounded-lg font-semibold hover:bg-opacity-50"
                  onClick={cancelClickHandler}
                >
                  CANCEL
                </button>
              </>
            )}
          </div>

          {/* Mobile footer */}
          <div className="flex md:hidden flex-row items-center w-full justify-between">
            <img
              className="inline-block md:hidden w-9 rounded-full"
              src={user ? `${import.meta.env.VITE_BACKEND_URL}/avatars/${user.user_id}.jpg` : blank_pfp_url}
              alt=""
            />

            {/* Button containers */}
            <div className="flex flex-row-reverse gap-2 h-full justify-between">
              {!reply ? (
                <button
                  className="bg-moderateBlue text-white px-8 py-3 rounded-lg font-semibold hover:bg-lightGrayishBlue"
                  onClick={() => sendClickHandler(null, null, value)}
                >
                  SEND
                </button>
              ) : (
                <>
                  <button
                    className="bg-moderateBlue text-white w-24 py-2 rounded-lg font-semibold hover:bg-lightGrayishBlue"
                    onClick={replyClickHandler}
                  >
                    REPLY
                  </button>
                  <button
                    className="bg-grayishBlue text-white w-24 py-2 rounded-lg font-semibold hover:bg-opacity-50"
                    onClick={cancelClickHandler}
                  >
                    CANCEL
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TextInput