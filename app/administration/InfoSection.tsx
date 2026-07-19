import React from "react";

interface InfoSectionProps {
  title?: string;
  description?: string;
}
const InfoSection = ({ title, description }: InfoSectionProps) => {
  return (
    <div className="">
      <h4 className="text-primary text-xl font-semibold mb-1">{title}</h4>
      <p className="  text-white text-base font-medium">{description}</p>
    </div>
  );
};

export default InfoSection;
