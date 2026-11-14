import {InfoPage} from "@/components/InfoPage";
import type {Lang} from "@/lib/types";
export default async function Page({params}:{params:Promise<{lang:string}>}){return <InfoPage lang={(await params).lang as Lang} slug="shipping"/>;}
