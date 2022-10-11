import React from 'react'

function Footer() {
  return (
    <div className="mx-auto flex flex-col gap-2">
      <p className="text-grayishBlue text-center">
        Made by{" "}
        <span className="text-darkBlue font-semibold">Lucca Rodrigues</span>. 🚀
      </p>
      <div className="flex flex-row justify-center gap-3">
        <a className='hover:scale-125 transition-all' href="https://github.com/ChromeUniverse">
          <i className="fa-brands fa-github text-2xl text-darkBlue"></i>
        </a>
        <a className='hover:scale-125 transition-all' href="http://34.200.98.64/">
          <i className="fa-solid fa-globe text-2xl text-darkBlue"></i>
        </a>
        <a className='hover:scale-125 transition-all' href="https://www.youtube.com/c/LuccasLab">
          <i className="fa-brands fa-youtube text-2xl text-darkBlue"></i>
        </a>
      </div>
    </div>
  );
}

export default Footer