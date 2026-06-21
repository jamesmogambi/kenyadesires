import React from "react";

const InfoSection = () => {
    return (
        <article className="w-full text-lg flex flex-col lg:flex-row gap-5">
            <div className="basis-full lg:basis-1/3">
                <p className="text-white/60">
                    Due to the workload, if possible, write to e-mail or WhatsApp.
                </p>
            </div>

            {/* section 2 */}
            <div className="basis-fulln font-semibold lg:basis-1/3 space-y-3">
                <h6 className="text-primary text-lg font-semibold">Phone</h6>
                <div className="flex items-center gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6 text-gray-1"
                    >
                        <path
                            fillRule="evenodd"
                            d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72h-2.69a.75.75 0 0 1-.75-.75Z"
                            clipRule="evenodd"
                        />
                        <path
                            fillRule="evenodd"
                            d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span className="text-primary">08:00 – 20:00 (Mon – Fri)</span>
                </div>

                <p className="text-gray-1">
                    {" "}
                    +254 743 129 621 (technical support only, we do not offer{" "}
                    <span className="text-primary">erotic services</span>)
                </p>
            </div>

            {/* section 3 */}
            <div className="basis-fulln font-semibold lg:basis-1/3 soace-y-3">
                <h6 className="text-primary text-lg mb-6 font-semibold">
                    Email / Whatsapp
                </h6>
                <div className="flex items-center gap-3">
                    <span className="text-primary">08:00 – 19:00 (Mon – Fri)</span>
                </div>

                <div className="flex items-center gap-3 ">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6 text-gray-1"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.478 5.559A1.5 1.5 0 0 1 6.912 4.5H9A.75.75 0 0 0 9 3H6.912a3 3 0 0 0-2.868 2.118l-2.411 7.838a3 3 0 0 0-.133.882V18a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-4.162c0-.299-.045-.596-.133-.882l-2.412-7.838A3 3 0 0 0 17.088 3H15a.75.75 0 0 0 0 1.5h2.088a1.5 1.5 0 0 1 1.434 1.059l2.213 7.191H17.89a3 3 0 0 0-2.684 1.658l-.256.513a1.5 1.5 0 0 1-1.342.829h-3.218a1.5 1.5 0 0 1-1.342-.83l-.256-.512a3 3 0 0 0-2.684-1.658H3.265l2.213-7.191Z"
                            clipRule="evenodd"
                        />
                        <path
                            fillRule="evenodd"
                            d="M12 2.25a.75.75 0 0 1 .75.75v6.44l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V3a.75.75 0 0 1 .75-.75Z"
                            clipRule="evenodd"
                        />
                    </svg>

                    <span className="text-gray-1">info@escortke.com</span>
                </div>
            </div>
        </article>
    );
};

export default InfoSection;
