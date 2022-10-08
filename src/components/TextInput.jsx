import React from 'react'

function TextInput({ user, reply=false, onChange, value, sendClickHandler, replyClickHandler, cancelClickHandler }) {
  return (
    <div className="bg-white w-full h-60 md:h-36 px-6 py-6 rounded-lg flex flex-col md:flex-row items-start gap-4">
      <img className="hidden md:inline-block w-9" src={user.image.png} alt="" />
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

        <img className="inline-block md:hidden w-9" src={user.image.png} alt="" />

        {/* Button containers */}
        <div className="flex flex-row-reverse gap-2 h-full justify-between">
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
      </div>
    </div>
  );
}

export default TextInput