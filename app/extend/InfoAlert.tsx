"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Prop {
  text: string;
  className?: string;
}
const InfoAlert = ({ text, className }: Prop) => {
  const [open, setOpen] = useState(false);

  const handleActivate = () => {
    setOpen(false);
  };

  return (
    <div
      className={cn(
        "bg-green-600  flex flex-col sm:flex-row justify-center items-center gap-4 py-2.5 w-full text-white text-lg",
        className,
      )}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <p className="font-semibold cursor-pointer text-center">{text}</p>
        </DialogTrigger>
        <DialogContent
          className=""
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            {/* <DialogTitle>Extend Membership</DialogTitle> */}
            <DialogDescription className="text-4xl mb-12 text-gray-800  font-bold">
              Do you really want to extend membership by 30 days for
              <br />
              <span className="text-2xl text-gray-700 font-bold mt-2">
                Membership price: 150 credits
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center items-center gap-4">
            <Button className="text-lg p-4" onClick={handleActivate}>
              Activate
            </Button>
            <Button
              className="text-lg p-5"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InfoAlert;
