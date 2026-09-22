"use server";

import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";
import { sendPaymentConfirmationEmail } from "./email";