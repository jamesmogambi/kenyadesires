import React from "react";
import InfoSection from "./InfoSection";
import ContactForm from "./ContactForm";
import BottomSection from "./BottomSection";

export const metadata = {
    title: "Contact - support Mon-Sun(08-22) 💖 | KenyaDivas.com.com",
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
