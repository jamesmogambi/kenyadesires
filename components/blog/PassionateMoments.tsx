import { cn } from "@/lib/utils";
import React from "react";
import SectionCard from "../SectionCard";
import Link from "next/link";

interface Prop {
  className?: string;
}
const PassionateMoments = ({ className }: Prop) => {
  return (
    <section className={cn("", className)}>
      <SectionCard>
        <h4 className="text-center text-2xl text-primary font-bold">
          Experience passionate moments
        </h4>

        <div className="text-white space-y-6 lg:max-w-[80%] mx-auto my-5 text-base font-medium ">
          <p>
            Welcome to our website, where new possibilities unfold in front of
            you and you can start exploring the world of sensuality and endless
            pleasure. We are here to guide you through the{" "}
            <span className="text-primary">
              mysterious corners of erotic services
            </span>{" "}
            and offer you the opportunity to explore and realize your most
            hidden fantasies. The stunning{" "}
            <span className="text-primary">companions {""}</span>and{" "}
            <span className="text-primary"> escort</span> girls you will find on
            our website are ready to make your day and night more enjoyable.
            Experience unforgettable moments full of excitement and intense
            emotions with them.
          </p>

          <p>
            From gentle touches in{" "}
            <span className="text-primary">erotic massages</span> such as{" "}
            <span className="text-primary">tantra, nuru</span> and{" "}
            <span className="text-primary">erotic prostate massage</span> erotic
            prostate massage and{" "}
            <span className="text-primary">penis massage</span>, to taboo
            practices and dark desires within <span>BDSM</span> practices, our
            website is here to open the door to a world of uninhibited pleasure.
            With us, you can discover and experience new ways of sexual
            satisfaction, whether you are from{" "}
            <span className="text-primary">Nairobi</span>,{" "}
            <span className="text-primary">Kisii</span> or{" "}
            <span className="text-primary">Mombasa</span>. Our website is the
            first step to connect your passionate erotic fantasies with the real
            possibility of living them.
          </p>

          <p>
            The sensual <span className="text-primary">sex girls</span>
            {""}that you will find on our site will make you look great and
            elegant escorts in the diverse world of erotic establishments. We
            have decided to create an environment for you where you will get the
            opportunity to enter the world of eroticism, excitement and
            satisfaction. All in complete safety and discretion. Explore our
            website and try what you have ever imagined and let us show you the
            way to fulfill your erotic fantasies. If you are looking for porn,
            visit{" "}
            <span className="text-primary">
              <Link
                passHref
                rel="noopener noreferrer"
                href={"https://kenyadesires.xyz/"}
              >
                kenyadesires.com
              </Link>
            </span>
            .
          </p>

          <p className="text-sm mt-16">
            The operator of the kenyadesires.ke website does not guarantee that
            the advertisements published here are up-to-date and veratrue. Each
            advertisement is the full responsibility of its owner. This site is
            primarily used to present advertisements and as an information
            platform, but it has no connection or responsibility for the content
            or actions of the sites or individuals mentioned on it. We provide
            space for advertising and do not engage in any escort or
            prostitution activity. Visitors are encouraged to report any
            suspicious or illegal content to us. We assume no responsibility and
            are not responsible for the content or activities of third party or
            individual websites that you may access through links, e-mails or
            telephone contacts from our site.
          </p>
        </div>
      </SectionCard>
    </section>
  );
};

export default PassionateMoments;
