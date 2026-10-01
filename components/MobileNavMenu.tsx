// components/MobileNavMenu.tsx
"use client";
import Link from "next/link";
import React from "react";
import { Minus, Plus } from "lucide-react";
import { usePopularCounties } from "@/store/countyStore";
import { buildListingHref } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

const MobileNavMenu = ({ onClose }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const counties = usePopularCounties();

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <div className="bg-dark-slate">
      <ul>
        {/* Erection Support */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/blog/erectile-dysfunction-treatment"
            onClick={handleLinkClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              className="size-10 text-stone-400/30"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M13.087 6.846c1.1-.674 2.354-.846 3.47-.846H39a3 3 0 0 1 3 3v17c0 4.71-4.54 8-9 8s-9-3.29-9-8v-8.86a5.2 5.2 0 0 0-1.732.834C21.433 18.594 21 19.33 21 20v9c.756.357 1.313.827 1.641 1.51c.36.748.36 1.627.36 2.409v.08c0 2.19-.881 4.412-2.284 6.091c-1.196 1.432-2.833 2.537-4.717 2.832V16a4 4 0 0 1 4-4h15v-2H20a6 6 0 0 0-6 6v25.922c-1.884-.295-3.521-1.4-4.717-2.832C7.88 37.411 7 35.188 7 33v-.081c0-.782 0-1.66.359-2.41c.328-.682.885-1.152 1.641-1.51V14c0-3.184 1.652-5.66 4.087-7.153"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 font-medium text-base py-3 uppercase border-y-2 text-white">
              erection support
            </div>
          </Link>
        </li>

        {/* Girls for Sex */}
        <li>
          <div className="flex items-center gap-2">
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
            <div className="flex-1 flex pr-5 items-center justify-between font-medium text-base py-3 uppercase border-b-2 text-white">
              <span>girls for sex</span>
              <button onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? (
                  <Minus className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Counties List */}
          <div className="ml-8 w-full border-white">
            {isOpen &&
              counties.map((county) => (
                <Link
                  key={county.id}
                  className="text-primary my-2 text-lg font-semibold flex flex-col uppercase"
                  href={buildListingHref("/girls", { county: county.name })}
                  onClick={handleLinkClick}
                >
                  {`Sex ${county.name}`}
                </Link>
              ))}
          </div>
        </li>

        {/* Erotic Massages */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/erotic-massages"
            onClick={handleLinkClick}
          >
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
            <div className="flex-1 font-medium text-base py-3 uppercase border-b-2 text-white">
              erotic massages
            </div>
          </Link>
        </li>

        {/* BDSM */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/bdsm"
            onClick={handleLinkClick}
          >
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
            <div className="flex-1 font-medium text-base py-3 uppercase border-b-2 text-white">
              bdsm
            </div>
          </Link>
        </li>

        {/* Erotic Businesses */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/agencies"
            onClick={handleLinkClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="text-stone-400/30 size-10 group-hover:text-primary"
            >
              <path
                fill="currentColor"
                d="m14.925 19.15l4.95-4.95q.3-.3.713-.287t.712.312t.3.7t-.3.7l-5.675 5.65q-.15.15-.325.225t-.375.075t-.375-.075t-.325-.225L11.4 18.45q-.3-.3-.3-.7t.3-.7t.7-.3t.7.3zM6 20q-.825 0-1.412-.587T4 18v-7.375L3 11.4q-.325.25-.737.2t-.663-.4q-.25-.325-.187-.725t.387-.65l8.975-6.9q.275-.2.588-.3t.637-.1t.638.1t.587.3L22.2 9.8q.325.25.388.65t-.213.75q-.25.325-.638.388T21 11.4l-.675-.5l-5.4 5.425l-.675-.675q-.875-.9-2.15-.9t-2.15.9q-.875.875-.85 2.175T10 20z"
                strokeWidth={0.5}
                stroke="currentColor"
              />
            </svg>
            <div className="flex-1 font-medium text-base py-3 uppercase border-b-2 text-white">
              erotic businesses
            </div>
          </Link>
        </li>

        {/* Blog */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/blog"
            onClick={handleLinkClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-10 text-stone-400/30 group-hover:text-primary"
            >
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
              <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
            </svg>
            <div className="flex-1 font-medium text-base py-3 uppercase border-b-2 text-white">
              blog
            </div>
          </Link>
        </li>

        {/* Contact */}
        <li>
          <Link
            className="flex items-center gap-2"
            href="/contact"
            onClick={handleLinkClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="size-10 text-stone-400/30"
            >
              <g fill="none">
                <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                <path
                  fill="currentColor"
                  d="M6.857 2.445C8.12 3.366 9.076 4.66 9.89 5.849l.638.938A1.504 1.504 0 0 1 10.35 8.7l-1.356 1.356l.143.304c.35.709.954 1.73 1.863 2.64a10 10 0 0 0 2.104 1.58l.367.197l.327.162l.146.067l1.355-1.356a1.5 1.5 0 0 1 1.918-.171l1.014.703c1.152.81 2.355 1.733 3.29 2.931a1.47 1.47 0 0 1 .189 1.485c-.837 1.953-2.955 3.616-5.158 3.534l-.3-.016l-.233-.02l-.258-.03l-.281-.038l-.305-.051l-.326-.064l-.346-.077l-.366-.094l-.385-.11l-.402-.13c-1.846-.626-4.189-1.856-6.593-4.26s-3.633-4.746-4.259-6.592l-.13-.402l-.11-.385l-.094-.366l-.078-.346a12 12 0 0 1-.063-.326l-.05-.305l-.04-.281l-.029-.258l-.02-.233l-.016-.3c-.081-2.196 1.6-4.329 3.544-5.162a1.47 1.47 0 0 1 1.445.159M5.93 4.253c-1.072.56-2.11 1.84-2.063 3.121l.02.328l.022.205l.029.23l.04.253l.051.277l.065.298l.08.32l.096.339l.114.358q.063.183.134.375l.154.392l.176.407c.628 1.382 1.652 3 3.325 4.672c1.672 1.672 3.29 2.697 4.672 3.325l.407.176l.392.154q.192.072.375.134l.358.114l.34.096l.319.08l.298.065l.277.051l.254.04l.23.03l.204.02l.328.02c1.264.047 2.554-.985 3.112-2.043c-.712-.835-1.596-1.52-2.571-2.21l-.748-.521l-.19.199l-.406.443l-.215.226c-.586.597-1.27 1.104-2.09.773l-.226-.095l-.276-.124l-.154-.073l-.338-.169l-.371-.2a12 12 0 0 1-2.567-1.925a12 12 0 0 1-1.925-2.567l-.2-.37l-.17-.339l-.196-.43L7 10.48c-.311-.769.117-1.418.664-1.98l.224-.22l.557-.513l.2-.19l-.473-.693c-.703-1.02-1.39-1.94-2.243-2.632Zm9.063 1.787l.116.013a3.5 3.5 0 0 1 2.858 2.96a1 1 0 0 1-1.958.393l-.023-.115a1.5 1.5 0 0 0-1.07-1.233l-.155-.035a1 1 0 0 1 .232-1.983M15 3a6 6 0 0 1 6 6a1 1 0 0 1-1.993.117L19 9a4 4 0 0 0-3.738-3.991L15 5a1 1 0 1 1 0-2"
                />
              </g>
            </svg>
            <div className="flex-1 font-medium text-base py-3 uppercase border-b-2 text-white">
              contact
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default MobileNavMenu;
