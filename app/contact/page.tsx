import React from "react";
import InfoSection from "./InfoSection";
import ContactForm from "./ContactForm";
import BottomSection from "./BottomSection";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
    title: "Contact - support Mon-Sun(08-22) 💖 | KenyaDesires",
};
const page = () => {
    return (
        <div className="">
            <section className="px-6 py-10 mx-auto lg:max-w-7xl w-full">
                <h4 className="text-center mb-8 text-4xl font-semibold">Contact</h4>
                <InfoSection/>
                <ContactForm/>
                <BottomSection/>
            </section>
        </div>
    );
};

export default page;
