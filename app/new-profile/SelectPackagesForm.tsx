import React from "react";

import { cn, getFlagEmoji, splitIntoThreeColumns } from "@/lib/utils";
import ReactCountryFlag from "react-country-flag";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { variantSettings } from "@/fixtures/setting";
import { useSettingStore } from "@/store/settingStore";
import { Checkbox } from "@/components/ui/checkbox";
import { useVariantStore } from "@/store/variantStore";

interface Prop {
  className?: string;
  form: any;
}

const SelectPackagesForm = ({ form, className }: Prop) => {
  const { setValue, watch } = form;
  const variantSettings = useVariantStore();
  const { practices, massage } = variantSettings;

  const {
    massages,
    toggleMassage,
    bdsm,
    clearAll,
    selected,
    toggle,
    toggleBdsm,
    setTab,
    tab,
    categories,
    setCategory,
    setLanguage,
    languages,
  } = useSettingStore();

  const [practiceCol1, practiceCol2, practiceCol3] =
    splitIntoThreeColumns(practices);

  const [massageCol1, massageCol2, massageCol3] =
    splitIntoThreeColumns(massage);

  const [bdsmCol1, bdsmCol2, bdsmCol3] = splitIntoThreeColumns(
    variantSettings.bdsm,
  );
  return (
    <section className={cn("w-full  ", className)}>
      <h4 className="text-primary text-xl  mb-6 font-bold">
        Select the services you offer:
      </h4>
      {/* // packages tab */}
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="w-full bg-transparent"
      >
        <TabsList className="w-full   bg-transparent ">
          <TabsTrigger
            className=" data-[state=active]:bg-primary rounded-none text-lg text-white  font-semibold cursor-pointer py-8  items-center flex  bg-gray-1"
            value="practices"
          >
            Practices
          </TabsTrigger>
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-white text-lg rounded-none font-semibold cursor-pointer py-8  items-center flex  bg-gray-1"
            value="massage"
          >
            Type of Massage
          </TabsTrigger>
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-white text-lg rounded-none font-semibold cursor-pointer py-8  items-center flex  bg-gray-1"
            value="bdsm"
          >
            BDSM Practices
          </TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="practices">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            {[practiceCol1, practiceCol2, practiceCol3].map((column, i) => (
              <div key={i} className="space-y-3 flex flex-col">
                {column.map((item, j) => (
                  <span
                    onClick={() => {
                      toggle(item.name);
                    }}
                    key={j}
                    className={cn(
                      "bg-gray-1  cursor-pointer data-[active]:bg-primary font-medium text-white  text-center rounded-full p-2.5",
                      selected.includes(item.name) ? "bg-primary" : "bg-gray-1",
                    )}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent className="mt-4" value="massage">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            {[massageCol1, massageCol2, massageCol3].map((column, i) => (
              <div key={i} className="space-y-3 flex flex-col">
                {column.map((item, j) => (
                  <span
                    onClick={() => {
                      toggleMassage(item.name);
                    }}
                    key={j}
                    className={cn(
                      "bg-gray-1  cursor-pointer data-[active]:bg-primary font-medium text-white  text-center rounded-full p-2.5",
                      massages.includes(item.name) ? "bg-primary" : "bg-gray-1",
                    )}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent className="mt-4" value="bdsm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            {[bdsmCol1, bdsmCol2, bdsmCol3].map((column, i) => (
              <div key={i} className="space-y-3 flex flex-col">
                {column.map((item, j) => (
                  <span
                    onClick={() => {
                      toggleBdsm(item.name);
                    }}
                    key={j}
                    className={cn(
                      "bg-gray-1  cursor-pointer data-[active]:bg-primary font-medium text-white  text-center rounded-full p-2.5",
                      bdsm.includes(item.name) ? "bg-primary" : "bg-gray-1",
                    )}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      {/* // select categories */}
      <div className="mt-6 px-2 lg:px-4 flex  flex-wrap">
        <span className="text-primary text-xl text-nowrap  font-bold  lg:text-2xl">
          Categories where I want to appear:
        </span>

        {variantSettings.categories.map((cat: any) => {
          const catName = typeof cat === "string" ? cat : cat.name;
          const catKey = typeof cat === "string" ? cat : cat.id ?? cat.name;
          return (
            <div key={catKey} className="flex items-center mx-4 gap-2">
              <Checkbox
                id={String(catKey)}
                className="size-6 bg-white border-primary"
                checked={categories.includes(catName)}
                onCheckedChange={(checked) => setCategory(catName, checked === true)}
              />
              <label
                className="lg:text-2xl text-xl text-primary font-bold"
                htmlFor={String(catKey)}
              >
                {catName}
              </label>
            </div>
          );
        })}
      </div>

      {/* languages */}
      <div className=" lg:px-4 px-1 flex lg:absolute top-[80%] my-5 lg:my-0  flex-wrap">
        <span className="text-white/50 font-bold  text-lg">Languages:</span>

        <div className="flex-1 flex ">
          {variantSettings.languages.map((lang: any) => (
            <div
              key={lang.name}
              className="flex flex-row flex-wrap lg:flex-nowrap items-center mx-4 mr-6 lg:gap-2 gap-1"
            >
              <Checkbox
                id={lang}
                className="size-6  bg-white border-primary"
                checked={languages.includes(lang.name)}
                onCheckedChange={(checked) =>
                  setLanguage(lang.name, checked === true)
                }
              />
              <label className="lg:hidden">{lang.name}</label>
              <label className="hidden lg:inline-block">
                <ReactCountryFlag
                  countryCode={lang.flag}
                  // className="size-2"
                  // className="size-12"
                  style={{
                    fontSize: "2em",
                    // height: "2em",
                    // display: "inline-block",
                  }}
                  svg
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SelectPackagesForm;
