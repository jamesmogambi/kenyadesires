import React, { useEffect, useMemo, useState } from "react";

import {
  cn,
  getFlagEmoji,
  splitIntoThreeColumns,
  formatPracticeName,
} from "@/lib/utils";
import ReactCountryFlag from "react-country-flag";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { variantSettings } from "@/fixtures/setting";
import { useSettingStore } from "@/store/settingStore";
import { Checkbox } from "@/components/ui/checkbox";
import { useVariantStore } from "@/store/variantStore";
import {
  getPracticesLookup,
  getMassageTypes,
  getBdsmPractices,
  getCategoryLookup,
} from "@/server-actions/lookup.action";

const LANGUAGE_COUNTRY_CODES: Record<string, string> = {
  english: "GB",
  swahili: "KE",
  arabic: "SA",
};

const toNames = (items: any): string[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of items) {
    const name =
      typeof item === "string"
        ? item
        : (item?.name ?? item?.value ?? item?.practice ?? "");
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    names.push(trimmed);
  }
  return names;
};

const withSelected = (options: string[], selectedValues: string[]) =>
  options.concat(
    toNames(selectedValues).filter((name) => !options.includes(name)),
  );

interface ServiceChipsProps {
  items: string[];
  selectedValues: string[];
  onToggle: (name: string) => void;
  breakClassName?: string;
}

const ServiceChips = ({
  items,
  selectedValues,
  onToggle,
  breakClassName = "wrap-break-word",
}: ServiceChipsProps) => {
  const columns = useMemo(() => splitIntoThreeColumns(items), [items]);

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-3 p-4">
      {columns.map((column, i) => (
        <div key={i} className="space-y-3 flex flex-col">
          {column.map((name) => (
            <span
              onClick={() => onToggle(name)}
              key={name}
              className={cn(
                "cursor-pointer font-medium text-white text-center rounded-full p-2.5 line-clamp-2",
                breakClassName,
                selectedValues.includes(name) ? "bg-primary" : "bg-gray-1",
              )}
            >
              {formatPracticeName(name)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

interface Prop {
  className?: string;
  form: any;
}

const SelectPackagesForm = ({ form, className }: Prop) => {
  const { setValue, watch } = form;
  const variantSettings = useVariantStore();
  const { practices, massage } = variantSettings;

  const [dbPractices, setDbPractices] = useState<string[]>([]);
  const [dbMassages, setDbMassages] = useState<string[]>([]);
  const [dbBdsm, setDbBdsm] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const [practiceRes, massageRes, bdsmRes, categoryRes] =
        await Promise.all([
          getPracticesLookup().catch((err) => {
            console.error("Failed to load practices from DB:", err);
            return [];
          }),
          getMassageTypes().catch((err) => {
            console.error("Failed to load massage types from DB:", err);
            return [];
          }),
          getBdsmPractices().catch((err) => {
            console.error("Failed to load bdsm practices from DB:", err);
            return [];
          }),
          getCategoryLookup().catch((err) => {
            console.error("Failed to load categories from DB:", err);
            return [];
          }),
        ]);

      if (cancelled) return;

      setDbPractices(toNames(practiceRes));
      setDbMassages(toNames(massageRes));
      setDbBdsm(toNames(bdsmRes));
      setDbCategories(toNames(categoryRes));
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // `variantStore` may hold plain strings or `{ id, name }` records for these
  // lookups, so normalise both and use it as a fallback while the DB read for
  // the canonical `lookup_*` table is still in flight.
  const practiceOptions = useMemo(
    () => (dbPractices.length ? dbPractices : toNames(practices)),
    [dbPractices, practices],
  );

  const massageOptions = useMemo(
    () => (dbMassages.length ? dbMassages : toNames(massage)),
    [dbMassages, massage],
  );

  const bdsmOptions = useMemo(
    () => (dbBdsm.length ? dbBdsm : toNames(variantSettings.bdsm)),
    [dbBdsm, variantSettings.bdsm],
  );

  const categoryOptions = useMemo(
    () => (dbCategories.length ? dbCategories : toNames(variantSettings.categories)),
    [dbCategories, variantSettings.categories],
  );

  // Values already saved on the profile are appended to the lookup lists so an
  // existing selection is always visible and highlighted, even when it is no
  // longer present in the `lookup_*` catalogue.
  const practiceItems = useMemo(
    () => withSelected(practiceOptions, selected),
    [practiceOptions, selected],
  );

  const massageItems = useMemo(
    () => withSelected(massageOptions, massages),
    [massageOptions, massages],
  );

  const bdsmItems = useMemo(
    () => withSelected(bdsmOptions, bdsm),
    [bdsmOptions, bdsm],
  );

  // Categories the profile already has stay visible even if the
  // `lookup_categories` catalogue no longer lists them.
  const categoryItems = useMemo(
    () => withSelected(categoryOptions, categories),
    [categoryOptions, categories],
  );

  return (
    <section className={cn("w-full ", className)}>
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
          <ServiceChips
            items={practiceItems}
            selectedValues={selected}
            onToggle={toggle}
          />
        </TabsContent>
        <TabsContent className="mt-4" value="massage">
          <ServiceChips
            items={massageItems}
            selectedValues={massages}
            onToggle={toggleMassage}
          />
        </TabsContent>
        <TabsContent className="mt-4" value="bdsm">
          <ServiceChips
            items={bdsmItems}
            selectedValues={bdsm}
            onToggle={toggleBdsm}
            breakClassName="break-words"
          />
        </TabsContent>
      </Tabs>
      {/* // select categories */}
      <div className="mt-6 px-2 lg:px-4 flex flex-col gap-4">
        <span className="text-primary text-xl text-nowrap  font-bold  lg:text-2xl">
          Categories where I want to appear:
        </span>

        <div className="flex flex-wrap">
          {categoryItems.map((catName) => (
            <div key={catName} className="flex items-center mx-4 gap-2">
              <Checkbox
                id={catName}
                className="size-6 bg-white border-primary"
                checked={categories.includes(catName)}
                onCheckedChange={(checked) =>
                  setCategory(catName, checked === true)
                }
              />
              <label
                className="lg:text-2xl text-xl text-primary font-bold line-clamp-2"
                htmlFor={catName}
              >
                {catName}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* languages */}
      <div className="lg:px-4 mt-8 px-1 lg:mt-32 flex-col lg:flex-row flex flex-wrap gap-3">
        <span className="text-white/50 font-bold  text-lg">Languages:</span>

        <div className="flex-1 flex ">
          {variantSettings.languages
            .filter((lang: any) =>
              ["english", "swahili", "arabic"].includes(
                (lang.name || "").toLowerCase(),
              ),
            )
            .map((lang: any) => (
              <div
                key={lang.name}
                className="flex flex-row flex-wrap lg:flex-nowrap items-center mx-4 mr-6 lg:gap-2 gap-1"
              >
                <Checkbox
                  id={lang.name}
                  className="size-6  bg-white border-primary"
                  checked={languages.includes(lang.name)}
                  onCheckedChange={(checked) =>
                    setLanguage(lang.name, checked === true)
                  }
                />
                <label className="lg:hidden line-clamp-2">{lang.name}</label>
                <label className="hidden lg:inline-block">
                  <ReactCountryFlag
                    countryCode={
                      LANGUAGE_COUNTRY_CODES[(lang.name || "").toLowerCase()] ||
                      "GB"
                    }
                    style={{
                      fontSize: "2em",
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
