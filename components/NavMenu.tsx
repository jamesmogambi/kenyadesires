import { cn } from "@/lib/utils";
import React from "react";
import NavItem from "./NavItem";

interface Prop {
  className?: string;
}

const NavMenu = ({ className }: Prop) => {
  return (
    <nav className={cn("-mt-2", className)}>
      <ul className="flex gap-10">
        <NavItem path="/girls" text="girls for sex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="text-stone-400/30 size-10 group-hover:text-primary"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M40.497.512a1.934 1.934 0 0 1 1.991 1.992c-.068 2.349-.28 4.61-.483 6.383c-.079.685-.478 1.226-1.039 1.46c-.566.238-1.23.134-1.76-.331a55 55 0 0 1-1.404-1.283l-.024.024l-5.499 5.5a14.43 14.43 0 0 1 2.232 7.732c0 7.156-5.184 13.1-12 14.285v2.215h1.5a2.5 2.5 0 1 1 0 5h-1.5v1.5a2.5 2.5 0 1 1-5 0v-1.5h-1.5a2.5 2.5 0 0 1 0-5h1.5v-2.214c-6.817-1.185-12-7.13-12-14.286c0-8.008 6.492-14.5 14.5-14.5c3.358 0 6.449 1.142 8.907 3.058l5.325-5.326l.012-.011a54 54 0 0 1-1.305-1.411c-.459-.517-.572-1.168-.347-1.73c.223-.557.75-.957 1.424-1.043a68 68 0 0 1 6.47-.514M10.51 21.989a9.5 9.5 0 1 1 19 0a9.5 9.5 0 0 1-19 0"
              clipRule="evenodd"
            />
          </svg>
        </NavItem>
        <NavItem path="/erotic-massages" text="erotic massages">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="text-stone-400/30 size-10 group-hover:text-primary"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 17a1 1 0 1 0 2 0a1 1 0 1 0-2 0M8 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 22l4-2v-3h12m-9 3h9M8 14l3-2l1-4c3 1 3 4 3 6"
            />
          </svg>
        </NavItem>
        <NavItem path="/bdsm" text="bdsm">
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="text-stone-400/30 size-8 group-hover:text-primary"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 17a1 1 0 1 0 2 0a1 1 0 1 0-2 0M8 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 22l4-2v-3h12m-9 3h9M8 14l3-2l1-4c3 1 3 4 3 6"
            ></path>
          </svg> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="text-stone-400/30 size-10 group-hover:text-primary"
          >
            <g fill="currentColor">
              <path d="M14.5 13a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7m4 2a1.5 1.5 0 0 1 .367.046c1.113.28 1.862.959 2.333 1.886c.412.81.613 1.82.78 2.822l1 6a1.5 1.5 0 1 1-2.96.493l-1-6a15 15 0 0 0-.265-1.309L18.5 22c0 1.606 1.703 10.36 2.298 13.37a.99.99 0 0 1-.829 1.173c-4.12.599-6.817.618-10.939.004a.99.99 0 0 1-.823-1.177c.6-2.962 2.293-11.5 2.293-13.37l-.255-3.061c-.087.327-.172.752-.265 1.309l-1 6a1.5 1.5 0 1 1-2.96-.493l1-6c.168-1.003.369-2.011.78-2.823c.472-.926 1.22-1.605 2.334-1.885q.179-.046.364-.046H18.5m-7.869 23.111l.377 3.012a1 1 0 0 0 1.962.119l.72-2.88c-.992-.037-2-.121-3.059-.252m4.685.274l.714 2.857a1 1 0 0 0 1.962-.118l.365-2.913a35 35 0 0 1-3.041.174" />
              <path
                fillRule="evenodd"
                d="M32 24v-2h-1a4 4 0 0 1-4-4h2a2 2 0 0 0 2 2h1v-4h-1a4 4 0 0 1 0-8h1V6h2v2h1a4 4 0 0 1 4 4h-2a2 2 0 0 0-2-2h-1v4h1a4 4 0 0 1 0 8h-1v2zm3-4h-1v-4h1a2 2 0 1 1 0 4m-4-10h1v4h-1a2 2 0 1 1 0-4m-7 25c0-1.306.835-2.417 2-2.83V26h2v1h10v-1h2v6.17c1.165.413 2 1.524 2 2.83v7h-2v-3H26v3h-2zm14-6h-2v3h2zm-4 0h-2v3h2zm-4 0h-2v3h2zm-3 5a1 1 0 0 0-1 1v2h14v-2a1 1 0 0 0-1-1z"
                clipRule="evenodd"
              />
            </g>
          </svg>
        </NavItem>
        <NavItem path="/agencies" text="businesses">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="text-stone-400/30 size-8 group-hover:text-primary"
          >
            <path
              fill="currentColor"
              d="m14.925 19.15l4.95-4.95q.3-.3.713-.287t.712.312t.3.7t-.3.7l-5.675 5.65q-.15.15-.325.225t-.375.075t-.375-.075t-.325-.225L11.4 18.45q-.3-.3-.3-.7t.3-.7t.7-.3t.7.3zM6 20q-.825 0-1.412-.587T4 18v-7.375L3 11.4q-.325.25-.737.2t-.663-.4q-.25-.325-.187-.725t.387-.65l8.975-6.9q.275-.2.588-.3t.637-.1t.638.1t.587.3L22.2 9.8q.325.25.388.65t-.213.75q-.25.325-.638.388T21 11.4l-.675-.5l-5.4 5.425l-.675-.675q-.875-.9-2.15-.9t-2.15.9q-.875.875-.85 2.175T10 20z"
              strokeWidth={0.5}
              stroke="currentColor"
            ></path>
          </svg>
        </NavItem>
        <NavItem path="/blog" text="blog">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            // height={3}
            // width={35}
            fill="currentColor"
            className=" size-8  text-stone-400/30 group-hover:text-primary "
          >
            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
          </svg>
        </NavItem>
      </ul>
    </nav>
  );
};

export default NavMenu;
