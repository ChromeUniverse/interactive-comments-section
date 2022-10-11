import React from "react";

function Header() {
  return (
    <div className="mx-auto flex flex-col items-center pt-0 max-w-[340px] md:max-w-[100%] md:w-[560px]">
      <h1 className="text-2xl md:text-3xl text-darkBlue py-4 text-center">
        Welcome to <span className="font-semibold">LuccaBoard™</span>.
      </h1>
      <p className="text-md text-grayishBlue text-center pb-2">
        LuccaBoard™ — a revolutionary new message board. Share your hot takes,
        reply and upvote (or downvote!) to your heart's content.
      </p>
      <p className="text-md text-grayishBlue text-center">
        Scroll to the bottom to get started. Enjoy! 😉
      </p>
      <div className=""></div>
    </div>
  );
}

export default Header;
