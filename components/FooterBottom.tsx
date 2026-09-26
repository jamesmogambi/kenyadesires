import Link from "next/link";
import React from "react";

const FooterBottom = () => {
  return (
    <div className="w-full bg-primary">
      <div className="lg:max-w-[1400] flex-col lg:flex-row flex justify-between items-center w-full text-white mx-auto py-3">
        <span className="text-sm font-medium">
          Copyright 2027 © - www.kenyadesires.xyz |{" "}
          <Link href={""} className="font-bold">
            Sex Kenya
          </Link>
        </span>

        <div className="flex mt-4 lg:mt-0 justify-center items-center flex-wrap  lg:gap-5">
          {/* <Link
            href={
              "terms-of-use-for-the-web-interface-for-advertisers-and-users"
            }
            className="font-light"
          >
            Terms and Conditions
          </Link> */}
          <Link href={"/withdrawal-contract"} className="font-medium">
            Withdrawal from the Contract
          </Link>
          <Link href={"/terms"} className="font-medium">
            Terms of Use of the Web Interface
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
