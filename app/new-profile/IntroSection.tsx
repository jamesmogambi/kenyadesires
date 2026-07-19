"use client";
import {cn} from "@/lib/utils";
import React, {useEffect, useState} from "react";
import {FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
// import { towns } from "@/fixtures/location";
import {useFormStore} from "@/store/formStore";
// import { variantSettings } from "@/fixtures/setting";
// import { Checkbox } from "@radix-ui/react-checkbox";
import {useSettingStore} from "@/store/settingStore";
import {Checkbox} from "@/components/ui/checkbox";
import {useLocationStore} from "@/store/locationStore";
import {Town} from "@/types/globals";
import {useVariantStore} from "@/store/variantStore";

interface Prop {
    className?: string;
    form: any;
}

const IntroSection = ({form, className}: Prop) => {
    const [regionOpen, setRegionOpen] = React.useState<boolean>(false);
    const [cityOpen, setCityOpen] = React.useState<boolean>(false);

    const [regionTowns, setRegionTowns] = useState<Town[]>([]);

    const {watch, setValue} = form;

    const {town, region, setTown, setRegion} = useFormStore();

    const {languages, setLanguage, availability, setAvailability} =
        useSettingStore();

    // const setRegions = useLocationStore((s) => s.setRegions);
    const {setRegions, setTowns, regions, towns} = useLocationStore();
    const {availability: variantAvailability} = useVariantStore();

    useEffect(() => {
        async function fetchRegions() {
            try {
                // const res: any = await getRegions();
                const res: any = []
                console.log("fetched regions", res);
                setRegions(res);
            } catch (err) {
                console.error("Failed to load regions:", err);
            }
        }

        fetchRegions();
    }, [setRegions]);

    useEffect(() => {
        async function fetchTowns() {
            try {
                // const res: any = await getTowns();
                const res: any = []
                console.log("fetched towns", res);
                setTowns(res);
            } catch (err) {
                console.error("Failed to load towns:", err);
            }
        }

        fetchTowns();
    }, [setTowns]);

    const handleSelectRegion = (region: string) => {
        setRegion(region);

        const filteredTowns = towns.filter(
            (town: any) => town.region.name === region,
        );
        console.log("filteredTowns", filteredTowns);
        setRegionTowns(filteredTowns);
    };

    return (
        <section
            className={cn("flex gap-2 flex-col lg:flex-row lg:gap-10", className)}
        >
            {/* 1 */}
            <div className=" space-y-6 basis-full  lg:basis-1/3">
                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row justify-between   flex gap-4  border-none">
                                <FormLabel className=" font-medium text-nowrap mb-2 text-white/40 text-base">
                                    Escort's name:
                                </FormLabel>
                                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                                    <Input
                                        placeholder=""
                                        {...field}
                                        className="bg-white  text-black px-6 h-10 rounded-full text-sm lg:text-xl focus-visible:ring-0 "
                                    />
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <>
                            <FormItem className="  flex-row justify-between items-start flex gap-4  border-none">
                                <FormLabel className=" font-medium text-nowrap mb-2 text-white/40 text-base">
                                    Email:
                                </FormLabel>
                                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                                    <Input
                                        placeholder=""
                                        {...field}
                                        className=" bg-white  text-black px-6 h-10 rounded-full text-sm lg:text-lg focus-visible:ring-0 "
                                    />
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />

                <FormField
                    control={form.control}
                    name="street"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row flex gap-4 justify-between border-none">
                                <FormLabel className=" font-medium text-nowrap mb-2 text-white/40 text-base">
                                    Street:
                                </FormLabel>
                                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                                    <Input
                                        placeholder=""
                                        {...field}
                                        className="bg-white text-black px-6 h-10 rounded-full text-lg lg:text-xl focus-visible:ring-0 "
                                    />
                                </FormControl>
                            </FormItem>

                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />
            </div>
            {/* 2 */}

            <div className="  space-y-6 basis-full  lg:basis-1/3">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row  justify-between flex gap-2  border-none">
                                <FormLabel className=" font-medium text-nowrap mb-2 text-white/40 text-base">
                                    Phone:
                                </FormLabel>
                                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                                    <Input
                                        placeholder=""
                                        {...field}
                                        className="bg-white  text-black px-6 h-10 rounded-full text-lg lg:text-xl focus-visible:ring-0 "
                                    />
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />

                <FormField
                    control={form.control}
                    name="region"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row   justify-end flex gap-2  ">
                                <FormControl className="border w-2/3 lg:w-1/  border-primary">
                                    <DropdownMenu
                                        open={regionOpen}
                                        onOpenChange={setRegionOpen}

                                        // onOpenChange={(val) =>
                                        //   onHandleRegion(val, field.onChange)
                                        // }
                                    >
                                        <DropdownMenuTrigger
                                            className=" outline-0  self-end  cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md ">
                                            {region ? (
                                                <span className="text-white/50 text-base font-semibold">
                          {region}
                        </span>
                                            ) : (
                                                <span className="text-white/50 text-base font-semibold">
                          Region
                        </span>
                                            )}

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width={18}
                                                height={18}
                                                viewBox="0 0 32 32"
                                                className="text-white/50"
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
                                                    strokeWidth={1}
                                                    stroke="currentColor"
                                                ></path>
                                            </svg>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            //   side="left"
                                            className="flex border-0 flex-col outline-none p-5 gap-3 w-screen  lg:max-w-[900px] bg-gray-1 "
                                        >
                                            <div className="flex flex-row w-full gap-1.5 gap-y-2.5  flex-wrap">
                                                {(regions || []).map((item) => (
                                                    <DropdownMenuItem
                                                        className="rounded-lg  cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                                                        // onSelect={(e) => setRegion(item.location)}
                                                        onSelect={(val: any) =>
                                                            handleSelectRegion(item.name)
                                                        }
                                                        key={item.id}
                                                    >
                                                        {item.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />

                {/* TODO: AVAILABILITY */}
                <div className="flex  mt-12 mb-6  justify-end items-center gap-3">
                    <label className="text-white/50 text-base font-medium">
                        Availability:
                    </label>
                    {variantAvailability.map((i, k) => (
                        <div key={i}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={i}
                                    className="size-7 cursor-pointer data-[state=checked]:bg-primary bg-white rounded-md   outline-none border-0 border-primary"
                                    checked={availability.includes(i)}
                                    onCheckedChange={(checked) =>
                                        setAvailability(i, checked === true)
                                    }
                                />
                                <label className="text-primary text-lg  font-bold">{i}</label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3 */}

            <div className="  space-y-6 basis-full  lg:basis-1/3">
                <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row  justify-between flex gap-2  border-none">
                                <FormLabel className=" font-medium text-nowrap mb-2 text-white/40 text-base">
                                    WhatsApp:
                                </FormLabel>
                                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                                    <Input
                                        placeholder=""
                                        type="tel"
                                        {...field}
                                        className="bg-white  text-black px-6 h-10 rounded-full text-lg lg:text-xl focus-visible:ring-0 "
                                    />
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />

                <FormField
                    control={form.control}
                    name="city"
                    render={({field}) => (
                        <>
                            <FormItem className=" flex-row   justify-end flex gap-2  ">
                                <FormControl className="border w-2/3 lg:w-1/  border-primary">
                                    <DropdownMenu
                                        open={cityOpen}
                                        onOpenChange={setCityOpen}
                                        // onOpenChange={(val) =>
                                        //   onHandleRegion(val, field.onChange)
                                        // }
                                    >
                                        <DropdownMenuTrigger
                                            className=" outline-0  self-end  cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md ">
                                            {town ? (
                                                <span className="text-white/50 text-base font-semibold">
                          {town}
                        </span>
                                            ) : (
                                                <span className="text-white/50 text-base font-semibold">
                          Area or Town
                        </span>
                                            )}

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width={18}
                                                height={18}
                                                viewBox="0 0 32 32"
                                                className="text-white/50"
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
                                                    strokeWidth={1}
                                                    stroke="currentColor"
                                                ></path>
                                            </svg>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            //   side="left"
                                            className="flex border-0 flex-col outline-none p-4 gap-3 w-screen  lg:max-w-[900px] bg-gray-1 "
                                        >
                                            <div className="flex flex-row w-full gap-1.5 gap-y-2.5  flex-wrap">
                                                {regionTowns.map((item) => (
                                                    <DropdownMenuItem
                                                        className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                                                        // onSelect={(e) => setRegion(item.location)}
                                                        onSelect={(val: any) => setTown(item.name)}
                                                        key={item.id}
                                                    >
                                                        {item.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </FormControl>
                            </FormItem>
                            <FormMessage className="-mt-4"/>
                        </>
                    )}
                />
            </div>
        </section>
    );
};

export default IntroSection;
