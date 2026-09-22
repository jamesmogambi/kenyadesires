import { NextResponse } from "next/server";

interface ICounty {
  id: string;
  name: string;
  code: string;
  description?: string;
  isPopular: boolean;
  population?: number;
  area?: string;
  capital?: string;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: string;
  name: string;
  countyCode: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Location {
  region: string;
  town: string;
  estate: string;
  address: string;
  street: string;
  postalCode: string;
  isActive: boolean;
  notes: string;
  _id?: string;
}

export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}

export async function GET() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
